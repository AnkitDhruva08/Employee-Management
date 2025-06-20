# backend/core/consumers/notification_consumer.py
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from confluent_kafka import Consumer
import json
from django.contrib.auth import get_user_model
from core.models import Notification

User = get_user_model()

conf = {
    'bootstrap.servers': 'localhost:9092',
    'group.id': 'notification-group',
    'auto.offset.reset': 'earliest',
}

consumer = Consumer(conf)
consumer.subscribe(['notifications'])

def run_notification_consumer():
    print("📡 Kafka notification consumer started...")

    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
            if msg.error():
                print(f"❌ Kafka error: {msg.error()}")
                continue

            try:
                raw_data = msg.value().decode('utf-8')
                print(f"📨 Received message: {raw_data}")
                data = json.loads(raw_data)

                user_id = data.get('user_id')
                message = data.get('message', '')
                url = data.get('url', '')
                notification_type = data.get('type', 'task')

                if not user_id:
                    print("⚠️ Missing user_id in message.")
                    continue

                user = User.objects.get(id=user_id)

                # ✅ Deduplication check

                Notification.objects.create(
                    user=user,
                    message=message,
                    notification_type=notification_type,
                    url=url,
                    is_read=False
                )
                print(f"✅ Notification saved to DB for ankit {user.email}")

            except User.DoesNotExist:
                print(f"❌ User with ID {user_id} does not exist.")
            except json.JSONDecodeError as e:
                print(f"❗ JSON decode error: {e}")
            except Exception as e:
                print(f"❗ Unexpected error: {e}")

    except KeyboardInterrupt:
        print("🛑 Consumer stopped by user.")
    finally:
        consumer.close()
        print("🔌 Kafka consumer closed.")

if __name__ == "__main__":
    run_notification_consumer()
