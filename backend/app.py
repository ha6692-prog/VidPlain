from core.wsgi import application

# WSGI entrypoint for Python hosting platforms
# 'application' is the WSGI callable for Django

[tool.poetry.scripts]
app = "app:application"
