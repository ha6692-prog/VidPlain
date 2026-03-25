from django.contrib import admin
from .models import UserProfile, Subject, MoodEntry, Activity

admin.site.register(UserProfile)
admin.site.register(Subject)
admin.site.register(MoodEntry)
admin.site.register(Activity)
