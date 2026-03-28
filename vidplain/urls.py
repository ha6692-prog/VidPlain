from django.urls import path
from . import views

urlpatterns = [
    path('', views.home),
    path('api/auth/register/', views.register_user, name='register'),
    path('api/auth/login/', views.login_user, name='login'),
    path('api/dashboard/', views.dashboard_data, name='dashboard'),
    path('api/mood/', views.save_mood, name='save-mood'),
    path('api/subjects/', views.create_or_update_subject, name='subjects'),
    path('api/track-activity/', views.track_activity, name='track-activity'),
    path('api/profile/update-language/', views.update_language, name='update-language'),
    # Chat history
    path('api/conversations/', views.list_conversations, name='list-conversations'),
    path('api/conversations/new/', views.new_conversation, name='new-conversation'),
    path('api/conversations/<int:conv_id>/', views.get_conversation, name='get-conversation'),
    path('api/conversations/<int:conv_id>/delete/', views.delete_conversation, name='delete-conversation'),
    # Streaming chat
    path('api/chat/stream/', views.chat_stream, name='chat-stream'),
    path('api/chat/mental-health/stream/', views.mental_health_stream, name='mental-health-stream'),
    # Feedback
    path('api/chat/feedback/', views.submit_feedback, name='submit-feedback'),
]