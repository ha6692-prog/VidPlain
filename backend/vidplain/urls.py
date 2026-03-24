from django.urls import path
from . import views

urlpatterns = [
    path('', views.home),
    path('auth/register', views.register_user, name='register'),
    path('auth/login', views.login_user, name='login'),
    path('dashboard', views.dashboard_data, name='dashboard'),
    path('mood', views.save_mood, name='save-mood'),
    path('subjects', views.create_or_update_subject, name='subjects'),
    path('track-activity', views.track_activity, name='track-activity'),
    # Chat history
    path('conversations', views.list_conversations, name='list-conversations'),
    path('conversations/new', views.new_conversation, name='new-conversation'),
    path('conversations/<int:conv_id>', views.get_conversation, name='get-conversation'),
    path('conversations/<int:conv_id>/delete', views.delete_conversation, name='delete-conversation'),
    # Streaming chat
    path('chat/stream', views.chat_stream, name='chat-stream'),
    path('chat/mental-health/stream', views.mental_health_stream, name='mental-health-stream'),
    # Feedback
    path('chat/feedback', views.submit_feedback, name='submit-feedback'),
]