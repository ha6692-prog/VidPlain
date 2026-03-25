from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    MEMBERSHIP_CHOICES = [
        ('free', 'Free Member'),
        ('pro', 'Pro Member'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    age = models.IntegerField(null=True, blank=True)
    membership = models.CharField(max_length=10, choices=MEMBERSHIP_CHOICES, default='free')

    def __str__(self):
        return f"{self.user.username}'s Profile"


class Subject(models.Model):
    STATUS_CHOICES = [
        ('on_track', 'On Track'),
        ('needs_review', 'Needs Review'),
        ('behind', 'Behind'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subjects')
    name = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='on_track')
    progress = models.IntegerField(default=0)
    current_chapter = models.CharField(max_length=300, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'name')
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} ({self.user.username}) - {self.progress}%"


class MoodEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='moods')
    mood = models.IntegerField()  # 0-4 mapping to 😣😟😐🙂😄
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - mood {self.mood}"


class Activity(models.Model):
    ACTIVITY_TYPES = [
        ('completed_quiz', 'Completed Quiz'),
        ('ai_tutor_session', 'AI Tutor Session'),
        ('new_subject', 'New Subject Added'),
        ('completed_chapter', 'Completed Chapter'),
        ('focus_session', 'Focus Session'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES)
    subject_name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.activity_type} - {self.subject_name}"


# ─── Chat History ───

class Conversation(models.Model):
    BOT_TYPES = [
        ('tutor', 'AI Tutor'),
        ('mental_health', 'Mental Health'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    title = models.CharField(max_length=300, blank=True, default='')
    bot_type = models.CharField(max_length=20, choices=BOT_TYPES, default='tutor')
    subject = models.CharField(max_length=200, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'bot_type', '-updated_at'], name='conv_user_bot_updated_idx'),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.title or 'Untitled'}"


class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at'], name='msg_conv_created_idx'),
        ]

    def __str__(self):
        return f"{self.role}: {self.content[:60]}"


class ConversationFeedback(models.Model):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]
    conversation = models.OneToOneField(Conversation, on_delete=models.CASCADE, related_name='feedback')
    rating = models.IntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback {self.rating}/5 for {self.conversation}"

