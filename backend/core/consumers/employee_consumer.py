# core/consumers/employee_consumer.py

import os
import django
import json
from confluent_kafka import Consumer
from django.core.mail import send_mail
import traceback

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

conf = {
    'bootstrap.servers': 'localhost:9092',
    'group.id': 'employee-group',
    'auto.offset.reset': 'earliest'
}

consumer = Consumer(conf)
consumer.subscribe(['employee-events'])

def run_employee_event_consumer():
    print("📡 Employee Kafka consumer started...")

    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
            if msg.error():
                print(f"❌ Kafka error: {msg.error()}")
                continue

            try:
                data = json.loads(msg.value().decode('utf-8'))
                print(f"📨 Received employee event: {data}")

                event_type = data.get("event_type")
                email = data.get("email")

                if not email:
                    print("❗ No email provided in the event, skipping.")
                    continue

                if event_type == "employee_created":
                    name = data.get("name", "New Employee")
                    company_name = data.get("company_name", "Your Company")
                    login_url = data.get("login_url", "http://localhost:5173/login")
                    default_password = data.get("default_password", "Pass@123")

                    subject = f"Welcome to {company_name} Employee Management System"
                    message = (
                        f"Hi {name},\n\n"
                        f"Your account has been created.\n"
                        f"🔗 Login: {login_url}\n"
                        f"📧 Email: {email}\n🔐 Password: {default_password}\n\n"
                        f"Please change your password after logging in.\n\n"
                        f"- {company_name} HR Team"
                    )
                    send_mail(subject, message, "no-reply@yourcompany.com", [email])
                    print(f"✅ Welcome email sent to {email}")

                elif event_type == "employee_updated":
                    subject = "Employee Profile Updated"
                    message = (
                        f"Hi,\n\n"
                        f"Your employee profile has been updated in the system.\n"
                        f"If you did not request this, please contact HR.\n\n"
                        f"- HR Team"
                    )
                    send_mail(subject, message, "no-reply@yourcompany.com", [email])
                    print(f"✅ Update email sent to {email}")

                elif event_type == "employee_deactivated":
                    subject = "Account Deactivated"
                    message = (
                        f"Hi,\n\n"
                        f"Your employee account has been deactivated. You will no longer have access to the system.\n"
                        f"For questions, please contact your manager or HR.\n\n"
                        f"- HR Team"
                    )
                    send_mail(subject, message, "no-reply@yourcompany.com", [email])
                    print(f"✅ Deactivation email sent to {email}")

                else:
                    print(f"ℹ️ Unhandled event type: {event_type}")

            except json.JSONDecodeError as e:
                print(f"❗ JSON decode error: {e}")
            # except Exception as e:
            #     print(f"❗ Error handling employee event: {e}")
            #     traceback.print_exc()

    except KeyboardInterrupt:
        print("🛑 Consumer stopped by user.")
    finally:
        consumer.close()
        print("🔌 Kafka consumer closed.")
