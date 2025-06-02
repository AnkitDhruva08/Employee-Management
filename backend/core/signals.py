from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from core.models import Project, Task, Bug, Notification
from django.contrib.auth import get_user_model

User = get_user_model()
def notify_users(users, message, notif_type, url):
    print(f"🔔 Sending notifications to {len(users)} users for type '{notif_type}'")
    for user in users:
        print(f"🔍 Processing user: {user}")
        print('username is', getattr(user, 'username', 'N/A'))

        if user:
            print('📨 Attempting notification...')
            print(f"📧 Using employee email: {user.company_email}")

            try:
                user_obj = User.objects.get(email=user.company_email)  
                print(f"🔍 User data found: {user_obj.id}")

                Notification.objects.create(
                    user=user_obj,  # ✅ FIXED: must be a User instance
                    message=message,
                    notification_type=notif_type,
                    url=url,
                )
                print(f"✅ Notification sent to {user.company_email}: {message}")
            except User.DoesNotExist:
                print(f"❌ No User found for email: {user.company_email}")
        else:
            print(f"⚠️ Skipping user: No associated Employee object")




@receiver(post_save, sender=Project)
def notify_on_project_create(sender, instance, created, **kwargs):
    if created:
        print(f"📦 New Project Created: {instance.project_name}")
        # No notifications here because assigned_to may be empty at creation.

@receiver(m2m_changed, sender=Project.assigned_to.through)
def notify_on_project_assigned_to_changed(sender, instance, action, pk_set, **kwargs):
    if action == 'post_add': 
        employees = set(instance.assigned_to.all())

        # Optionally include task members
        for task in instance.tasks.all():
            employees.update(task.members.all())

        print(f"🔔 Notifying {len(employees)} users for Project '{instance.project_name}'")
        notify_users(
            employees,
            f"You have been assigned to the project '{instance.project_name}'.",
            "project",
            f"/projects/{instance.id}/"
        )
