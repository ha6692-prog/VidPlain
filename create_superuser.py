import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from vidplain.models import UserProfile

# Create superuser
username = 'user'
email = 'user@gmail.com'
password = 'admin123'

user, created = User.objects.get_or_create(
    username=username,
    defaults={
        'email': email,
        'is_staff': True,
        'is_superuser': True,
    }
)

if created:
    user.set_password(password)
    user.save()
    print(f'✅ Superuser created: {username}')
else:
    user.set_password(password)
    user.save()
    print(f'✅ Superuser updated: {username}')

# Create profile
profile, _ = UserProfile.objects.get_or_create(
    user=user,
    defaults={
        'first_name': 'Admin',
        'last_name': 'User',
        'age': 25,
        'membership': 'admin'
    }
)

print(f'✅ Username: {username}')
print(f'✅ Password: {password}')
