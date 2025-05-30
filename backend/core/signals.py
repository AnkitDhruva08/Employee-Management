from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from core.models import Project, Task, Bug, Notification

def notify_users(users, message, notif_type, url):
    for user in users:
        if user and hasattr(user, 'user') and user.user:
            Notification.objects.create(
                user=user.user,
                message=message,
                notification_type=notif_type,
                url=url,
            )
            print(f"✅ Notification sent to {user.user.email}: {message}")
        else:
            print(f"⚠️ Skipping user: No associated User object for {user}")

@receiver(post_save, sender=Project)
def notify_on_project_create(sender, instance, created, **kwargs):
    if created:
        print(f"📦 New Project Created: {instance.project_name}")
        # No notifications here because assigned_to may be empty at creation.

@receiver(m2m_changed, sender=Project.assigned_to.through)
def notify_on_project_assigned_to_changed(sender, instance, action, pk_set, **kwargs):
    if action == 'post_add':  # after new members assigned
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
