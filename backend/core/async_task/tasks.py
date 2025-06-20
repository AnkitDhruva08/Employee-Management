from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


@shared_task
def send_email_task(subject, message, recipient_email):
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [recipient_email])
        print(f"Email sent to {recipient_email}")
    except Exception as e:
        print(f"Error sending email to {recipient_email}: {e}")



