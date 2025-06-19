# backend/celery.py
import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
# This ensures Celery can find your Django settings.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Create a Celery application instance.
# The 'backend' argument should be your project's root package name where settings.py resides.
app = Celery('backend')

# Load task configuration from Django settings.
# All Celery-related configuration in settings.py should be prefixed with 'CELERY_'.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed Django apps.
# Celery will look for a 'tasks.py' file within each app directory listed in INSTALLED_APPS.
app.autodiscover_tasks()

# Optional: A debug task to verify Celery is working
@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')