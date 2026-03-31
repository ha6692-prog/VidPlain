from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / '.env')
except ImportError:
    pass

GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '').strip().strip('"').strip("'")
GROQ_MODEL = os.environ.get('GROQ_MODEL', 'llama-3.3-70b-versatile').strip().strip('"').strip("'")

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-fro)=70v8q3sw%y&t#akk*7$_0c-s2)8cjsrw=+#5#mxxf048*')

# Disable debug in production
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = [
    "vidplain-backend-dhhsbfgtfkgxbbg2.centralindia-01.azurewebsites.net",
    "localhost",
    "127.0.0.1",
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'vidplain',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be first
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database — uses PostgreSQL in production via DATABASE_URL env var, SQLite locally
DATABASE_URL = os.environ.get('DATABASE_URL', '')
if DATABASE_URL:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# ─── CORS ───
CORS_ALLOWED_ORIGINS = [
    "https://www.vidplainai.com",
    "https://vidplainai.com",
    "https://vidplain-xi.vercel.app",
    "https://vid-plain-qvbv.vercel.app",
    "https://vidplain-2.onrender.com",
    "http://localhost:3000",
]

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_ALLOW_HEADERS = [
    "accept",
    "authorization",
    "content-type",
    "origin",
    "x-csrftoken",
    "x-requested-with",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL_ORIGINS', 'False').lower() == 'true'

# ─── CSRF ───
CSRF_TRUSTED_ORIGINS = [
    "https://www.vidplainai.com",
    "https://vidplainai.com",
    "https://vidplain-xi.vercel.app",
    "https://vid-plain-qvbv.vercel.app",
    "https://vidplain-2.onrender.com",
    "https://vidplain-backend-dhhsbfgtfkgxbbg2.centralindia-01.azurewebsites.net",
    "http://localhost:3000",
]

CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = "None"
SESSION_COOKIE_SAMESITE = "None"

APPEND_SLASH = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'