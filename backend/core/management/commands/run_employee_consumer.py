# core/management/commands/run_employee_consumer.py
# python backend/manage.py run_employee_consumer

from django.core.management.base import BaseCommand
from core.consumers.employee_consumer import run_employee_event_consumer

class Command(BaseCommand):
    help = "Runs the Kafka consumer for employee events"

    def handle(self, *args, **kwargs):
        self.stdout.write("📡 Starting employee Kafka consumers ...")
        run_employee_event_consumer()
