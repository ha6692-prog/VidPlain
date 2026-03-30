from django.contrib.auth.models import User
from django.db import models as db_models
from django.utils import timezone
from django.http import StreamingHttpResponse, HttpResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .serializers import SubjectSerializer, MoodEntrySerializer, ActivitySerializer
from .models import Subject, MoodEntry, Activity, Conversation, ChatMessage, ConversationFeedback
from .prompt_builder import prompt_builder, UserContext
from .mental_health_prompt_builder import build_mano_messages
import json


def home(request):
    return HttpResponse("Vidplain API working 🚀")


# ─── Helper: resolve User from Supabase UID or email ───

def _get_user(request):
    """
    Accepts either:
      - supabase_uid  (preferred — set this from the Supabase session user.id)
      - email         (fallback for backwards compat)
    Returns (user, error_response) — exactly one will be None.
    """
    uid = (
        request.data.get("supabase_uid")
        or request.query_params.get("supabase_uid")
    )
    email = (
        request.data.get("email")
        or request.query_params.get("email")
    )

    if uid:
        try:
            return User.objects.get(username=uid), None
        except User.DoesNotExist:
            # First time this Supabase user hits the backend — auto-create a shell user
            if not email:
                return None, Response(
                    {"error": "User not found and no email provided to create one"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            user = User.objects.create_user(username=uid, email=email)
            return user, None

    if email:
        try:
            return User.objects.get(email=email), None
        except User.DoesNotExist:
            return None, Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    return None, Response(
        {"error": "supabase_uid or email required"},
        status=status.HTTP_400_BAD_REQUEST,
    )


# ─── Dashboard ───

@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def dashboard_data(request):
    user, err = _get_user(request)
    if err:
        return err

    try:
        subjects = user.subjects.all().order_by('-updated_at')
        activities = user.activities.all().order_by('-created_at')[:10]
        latest_mood = user.moods.first() if hasattr(user, 'moods') else None

        overall_progress = 0
        if subjects.exists():
            overall_progress = int(
                subjects.aggregate(avg=db_models.Avg('progress'))['avg'] or 0
            )

        continue_subject = subjects.first() if subjects.exists() else None
        profile = getattr(user, 'profile', None)

        membership = "Free Member"
        if profile:
            try:
                membership = (
                    profile.get_membership_display()
                    if hasattr(profile, 'get_membership_display')
                    else profile.membership
                )
            except Exception:
                membership = getattr(profile, 'membership', 'Free Member')

        total_conversations = Conversation.objects.filter(user=user).count()
        total_questions = ChatMessage.objects.filter(
            conversation__user=user, role='user'
        ).count()

        return Response({
            "subjects": SubjectSerializer(subjects, many=True).data,
            "activities": ActivitySerializer(activities, many=True).data,
            "latest_mood": MoodEntrySerializer(latest_mood).data if latest_mood else None,
            "overall_progress": overall_progress,
            "user_name": (
                f"{profile.first_name} {profile.last_name}"
                if profile else user.email or user.username
            ),
            "membership": membership,
            "preferredLanguage": profile.preferred_language if profile else "english",
            "continue_subject": (
                SubjectSerializer(continue_subject).data if continue_subject else None
            ),
            "total_conversations": total_conversations,
            "total_questions": total_questions,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── Update Language ───

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def update_language(request):
    language = request.data.get('language')
    if not language:
        return Response({"error": "language required"}, status=status.HTTP_400_BAD_REQUEST)

    user, err = _get_user(request)
    if err:
        return err

    profile = getattr(user, 'profile', None)
    if not profile:
        return Response(
            {"error": "User profile not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    profile.preferred_language = language
    profile.save()
    return Response({
        "message": "Language updated successfully",
        "preferredLanguage": profile.preferred_language,
    })


# ─── Mood ───

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def save_mood(request):
    mood = request.data.get('mood')
    if mood is None:
        return Response({"error": "mood required"}, status=status.HTTP_400_BAD_REQUEST)

    user, err = _get_user(request)
    if err:
        return err

    entry = MoodEntry.objects.create(user=user, mood=int(mood))
    return Response(MoodEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


# ─── Subjects ───

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@csrf_exempt
def create_or_update_subject(request):
    user, err = _get_user(request)
    if err:
        return err

    if request.method == 'GET':
        subjects = Subject.objects.filter(user=user)
        return Response(SubjectSerializer(subjects, many=True).data)

    # POST
    name = request.data.get('name')
    if not name:
        return Response({"error": "name required"}, status=status.HTTP_400_BAD_REQUEST)

    subject, created = Subject.objects.get_or_create(
        user=user,
        name=name,
        defaults={
            'current_chapter': request.data.get('current_chapter', ''),
            'progress': request.data.get('progress', 0),
            'status': request.data.get('status', 'active')
        }
    )

    if not created:
        for attr, value in request.data.items():
            if attr != 'name':
                setattr(subject, attr, value)
        subject.save()

    return Response(SubjectSerializer(subject).data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)