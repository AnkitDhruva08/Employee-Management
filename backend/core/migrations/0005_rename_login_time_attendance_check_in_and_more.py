# Generated by Django 5.2 on 2025-06-16 10:41

import datetime
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_alter_leaverequest_comment'),
    ]

    operations = [
        migrations.RenameField(
            model_name='attendance',
            old_name='login_time',
            new_name='check_in',
        ),
        migrations.RenameField(
            model_name='attendance',
            old_name='logout_time',
            new_name='check_out',
        ),
        migrations.RemoveField(
            model_name='attendance',
            name='active',
        ),
        migrations.RemoveField(
            model_name='attendance',
            name='created_at',
        ),
        migrations.RemoveField(
            model_name='attendance',
            name='created_by',
        ),
        migrations.RemoveField(
            model_name='attendance',
            name='updated_at',
        ),
        migrations.RemoveField(
            model_name='attendance',
            name='updated_by',
        ),
        migrations.AddField(
            model_name='attendance',
            name='total_duration',
            field=models.DurationField(default=datetime.timedelta),
        ),
        migrations.AlterField(
            model_name='attendance',
            name='company',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to='core.company'),
            preserve_default=False,
        ),
        migrations.CreateModel(
            name='AttendanceSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(default=django.utils.timezone.now)),
                ('login_time', models.DateTimeField()),
                ('logout_time', models.DateTimeField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('company', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.company')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
