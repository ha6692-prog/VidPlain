from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import models as db_models
from django.http import StreamingHttpResponse, HttpResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer, SubjectSerializer, MoodEntrySerializer, ActivitySerializer
from .models import Subject, MoodEntry, Activity, Conversation, ChatMessage, ConversationFeedback
from .prompt_builder import prompt_builder, UserContext
from .mental_health_prompt_builder import build_mano_messages
import json

def home(request):
    return HttpResponse("Vidplain API working 🚀")

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def register_user(request):
    # Transform incoming frontend data into the nested structure DRF expects
    data = {
        'username': request.data.get('email'), # using email as username
        'email': request.data.get('email'),
        'password': request.data.get('password'),
        'profile': {
            'first_name': request.data.get('firstName', ''),
            'last_name': request.data.get('lastName', ''),
            'age': request.data.get('age')
        }
    }
    
    serializer = UserSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()
        profile = getattr(user, 'profile', None)
        return Response({
            "message": "User created successfully",
            "username": user.username,
            "email": user.email,
            "firstName": profile.first_name if profile else "",
            "lastName": profile.last_name if profile else "",
            "membership": profile.membership if profile else "free",
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login_user(request):
    email = request.data.get("email")
    password = request.data.get("password")

    user = authenticate(username=email, password=password)

    if user is None:
        return Response({"error": "Invalid Credentials"}, status=401)

    return Response({"message": "Login successful"})


# ─── Dashboard ───

@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def dashboard_data(request):
    email = request.query_params.get('email')
    if not email:
        return Response({"error": "Email required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        subjects = user.subjects.all().order_by('-updated_at')
        activities = user.activities.all().order_by('-created_at')[:10]
        latest_mood = user.moods.first() if hasattr(user, 'moods') else None

        # Calculate overall progress as average of all subjects
        overall_progress = 0
        if subjects.exists():
            overall_progress = int(subjects.aggregate(avg=db_models.Avg('progress'))['avg'] or 0)

        # Continue subject = most recently updated
        continue_subject = subjects.first() if subjects.exists() else None

        profile = getattr(user, 'profile', None)
        
        # Safe membership display
        membership = "Free Member"
        if profile:
            try:
                membership = profile.get_membership_display() if hasattr(profile, 'get_membership_display') else profile.membership
            except:
                membership = getattr(profile, 'membership', 'Free Member')

        return Response({
            "subjects": SubjectSerializer(subjects, many=True).data,
            "activities": ActivitySerializer(activities, many=True).data,
            "latest_mood": MoodEntrySerializer(latest_mood).data if latest_mood else None,
            "overall_progress": overall_progress,
            "user_name": f"{profile.first_name} {profile.last_name}" if profile else user.username,
            "membership": membership,
            "continue_subject": SubjectSerializer(continue_subject).data if continue_subject else None,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── Mood ───

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def save_mood(request):
    email = request.data.get('email')
    mood = request.data.get('mood')

    if email is None or mood is None:
        return Response({"error": "email and mood required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    entry = MoodEntry.objects.create(user=user, mood=int(mood))
    return Response(MoodEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


# ─── Subjects ───

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@csrf_exempt
def create_or_update_subject(request):
    email = request.query_params.get('email') if request.method == 'GET' else request.data.get('email')
    
    # Handle GET: retrieve all subjects for a user
    if request.method == 'GET':
        if not email:
            return Response({"error": "email required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        subjects = Subject.objects.filter(user=user)
        serializer = SubjectSerializer(subjects, many=True)
        return Response(serializer.data)
    
    # Handle POST: create or update subject
    name = request.data.get('name')

    if not email or not name:
        return Response({"error": "email and name required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    subject, created = Subject.objects.get_or_create(
        user=user, name=name,
        defaults={
            'current_chapter': request.data.get('current_chapter', ''),
            'progress': request.data.get('progress', 0),
            'status': request.data.get('status', 'on_track'),
        }
    )

    if not created:
        # Update existing subject
        if 'progress' in request.data:
            subject.progress = int(request.data['progress'])
        if 'current_chapter' in request.data:
            subject.current_chapter = request.data['current_chapter']
        if 'status' in request.data:
            subject.status = request.data['status']

        # Auto-update status based on progress
        if subject.progress >= 70:
            subject.status = 'on_track'
        elif subject.progress >= 40:
            subject.status = 'needs_review'
        else:
            subject.status = 'behind'
        subject.save()

    if created:
        Activity.objects.create(
            user=user,
            activity_type='new_subject',
            subject_name=name,
        )

    return Response(SubjectSerializer(subject).data, status=status.HTTP_200_OK)


# ─── Track Activity (called from chat) ───

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def track_activity(request):
    email = request.data.get('email')
    activity_type = request.data.get('activity_type', 'ai_tutor_session')
    subject_name = request.data.get('subject_name', '')

    if not email:
        return Response({"error": "email required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    # Create activity entry
    activity = Activity.objects.create(
        user=user,
        activity_type=activity_type,
        subject_name=subject_name,
    )

    # If it's a tutor session, update the subject progress
    if activity_type == 'ai_tutor_session' and subject_name:
        subject, created = Subject.objects.get_or_create(
            user=user, name=subject_name,
            defaults={'progress': 5}
        )
        if not created:
            subject.progress = min(100, subject.progress + 2)
            if subject.progress >= 70:
                subject.status = 'on_track'
            elif subject.progress >= 40:
                subject.status = 'needs_review'
            else:
                subject.status = 'behind'
            subject.save()

    return Response(ActivitySerializer(activity).data, status=status.HTTP_201_CREATED)


# ─── Groq client helper ───

def _get_groq_client():
    try:
        from groq import Groq
        api_key = getattr(settings, 'GROQ_API_KEY', '')
        if not api_key:
            return None

        # Defensively sanitize .env parsing artifacts and validate expected format.
        api_key = str(api_key).strip().strip('"').strip("'")
        if not api_key.startswith('gsk_'):
            return None
        return Groq(api_key=api_key)
    except ImportError:
        return None


def _format_groq_error(exc: Exception) -> str:
    msg = str(exc)
    lowered = msg.lower()
    if 'invalid_api_key' in lowered or 'invalid api key' in lowered or 'authentication_error' in lowered:
        return 'Groq API key is invalid. Update GROQ_API_KEY in backend/.env and restart the Django server.'
    if 'rate_limit' in lowered or 'too many requests' in lowered:
        return 'Groq rate limit reached. Please retry in a moment.'
    if 'model_decommissioned' in lowered or 'decommissioned' in lowered:
        return 'Configured Groq model is decommissioned. Set GROQ_MODEL in backend/.env to a currently supported model.'
    return msg


# ─── Chat: list conversations ───

@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def list_conversations(request):
    email = request.query_params.get('email')
    bot_type = request.query_params.get('bot_type', 'tutor')
    if not email:
        return Response({"error": "email required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    convs = Conversation.objects.filter(user=user, bot_type=bot_type)
    data = [{"id": c.id, "title": c.title or "Untitled", "updated_at": c.updated_at.isoformat()} for c in convs]
    return Response(data)


# ─── Chat: get single conversation messages ───

@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def get_conversation(request, conv_id):
    try:
        conv = Conversation.objects.get(id=conv_id)
    except Conversation.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    messages = [{"role": m.role, "content": m.content} for m in conv.messages.all()]
    has_feedback = hasattr(conv, 'feedback')
    return Response({
        "id": conv.id,
        "title": conv.title,
        "subject": conv.subject,
        "messages": messages,
        "has_feedback": has_feedback,
    })


# ─── Chat: new conversation ───

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def new_conversation(request):
    email = request.data.get('email')
    bot_type = request.data.get('bot_type', 'tutor')
    subject = request.data.get('subject', '')
    if not email:
        return Response({"error": "email required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    conv = Conversation.objects.create(user=user, bot_type=bot_type, subject=subject, title='')
    return Response({"id": conv.id})


# ─── Chat: streaming AI response (tutor) ───

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def chat_stream(request):
    email = request.data.get('email')
    question = request.data.get('question', '').strip()
    conv_id = request.data.get('conversation_id')
    subject = request.data.get('subject', '')
    level = request.data.get('level', 'intermediate')
    language = request.data.get('language', 'English')
    weak_topics = request.data.get('weak_topics', [])

    if not question:
        return Response({"error": "question required"}, status=status.HTTP_400_BAD_REQUEST)

    # Get or create conversation
    conv = None
    if conv_id:
        try:
            conv = Conversation.objects.get(id=conv_id)
        except Conversation.DoesNotExist:
            pass

    if conv is None and email:
        try:
            user = User.objects.get(email=email)
            conv = Conversation.objects.create(
                user=user, bot_type='tutor', subject=subject,
                title=question[:80],
            )
        except User.DoesNotExist:
            pass

    # Save the user message
    if conv:
        ChatMessage.objects.create(conversation=conv, role='user', content=question)
        if not conv.title:
            conv.title = question[:80]
            conv.save(update_fields=['title'])

    # Build Groq messages
    ctx = UserContext(level=level, language=language, subject=subject, weak_topics=weak_topics if weak_topics else None)
    messages = prompt_builder.build_messages(question, ctx)

    client = _get_groq_client()
    if not client:
        return Response({"error": "Groq API key not configured"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    def event_stream():
        full_response = []
        try:
            stream = client.chat.completions.create(
                model=getattr(settings, 'GROQ_MODEL', 'llama-3.3-70b-versatile'),
                messages=messages,
                stream=True,
                max_tokens=2048,
                temperature=0.7,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    full_response.append(delta)
                    yield f"data: {json.dumps({'token': delta})}\n\n"

            # Save assistant message after stream completes
            if conv:
                complete_text = ''.join(full_response)
                ChatMessage.objects.create(conversation=conv, role='assistant', content=complete_text)
                conv.save(update_fields=['updated_at'])
            yield f"data: {json.dumps({'done': True, 'conversation_id': conv.id if conv else None})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': _format_groq_error(e)})}\n\n"

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response


# ─── Chat: streaming AI response (mental health) ───

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def mental_health_stream(request):
    email = request.data.get('email')
    message = request.data.get('message', '').strip()
    conv_id = request.data.get('conversation_id')
    language = request.data.get('language', 'English')

    if not message:
        return Response({"error": "message required"}, status=status.HTTP_400_BAD_REQUEST)

    conv = None
    if conv_id:
        try:
            conv = Conversation.objects.get(id=conv_id)
        except Conversation.DoesNotExist:
            pass

    if conv is None and email:
        try:
            user = User.objects.get(email=email)
            conv = Conversation.objects.create(
                user=user, bot_type='mental_health',
                title=message[:80],
            )
        except User.DoesNotExist:
            pass

    if conv:
        ChatMessage.objects.create(conversation=conv, role='user', content=message)
        if not conv.title:
            conv.title = message[:80]
            conv.save(update_fields=['title'])

    messages = build_mano_messages(message, language=language)

    client = _get_groq_client()
    if not client:
        return Response({"error": "Groq API key not configured"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    def event_stream():
        full_response = []
        try:
            stream = client.chat.completions.create(
                model=getattr(settings, 'GROQ_MODEL', 'llama-3.3-70b-versatile'),
                messages=messages,
                stream=True,
                max_tokens=1024,
                temperature=0.8,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    full_response.append(delta)
                    yield f"data: {json.dumps({'token': delta})}\n\n"

            if conv:
                complete_text = ''.join(full_response)
                ChatMessage.objects.create(conversation=conv, role='assistant', content=complete_text)
                conv.save(update_fields=['updated_at'])
            yield f"data: {json.dumps({'done': True, 'conversation_id': conv.id if conv else None})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': _format_groq_error(e)})}\n\n"

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response


# ─── Chat: delete conversation ───

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_conversation(request, conv_id):
    try:
        conv = Conversation.objects.get(id=conv_id)
        conv.delete()
        return Response({"message": "Deleted"})
    except Conversation.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)


# ─── Chat: submit feedback ───

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def submit_feedback(request):
    conv_id = request.data.get('conversation_id')
    rating = request.data.get('rating')
    comment = request.data.get('comment', '')

    if not conv_id or rating is None:
        return Response({"error": "conversation_id and rating required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        conv = Conversation.objects.get(id=conv_id)
    except Conversation.DoesNotExist:
        return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)

    feedback, _ = ConversationFeedback.objects.update_or_create(
        conversation=conv,
        defaults={"rating": int(rating), "comment": comment},
    )
    return Response({"message": "Feedback saved", "rating": feedback.rating})
