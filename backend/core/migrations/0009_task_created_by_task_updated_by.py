# Generated by Django 5.2 on 2025-06-19 05:54

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_remove_attendance_check_in_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='created_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_tasks', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='task',
            name='updated_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='updated_tasks', to=settings.AUTH_USER_MODEL),
        ),
    ]
