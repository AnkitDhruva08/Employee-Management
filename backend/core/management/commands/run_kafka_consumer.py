
# Employee-Management/backend/core/management/commands/run_kafka_consumer.py
from django.core.management.base import BaseCommand
from core.consumers.notification_consumer import run_notification_consumer

class Command(BaseCommand):
    help = "Runs the Kafka consumer for notifications"

    def handle(self, *args, **options):
        self.stdout.write("📡 Running Kafka notification consumer...")
        run_notification_consumer()
