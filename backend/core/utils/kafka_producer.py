from confluent_kafka import Producer
import json

conf = {'bootstrap.servers': 'localhost:9092'}
producer = Producer(conf)

def delivery_report(err, msg):
    if err is not None:
        print(f"❌ Message delivery failed: {err}")
    else:
        print(f"✅ Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}")

def send_to_kafka(topic, message: dict):
    try:
        print('message ==<<>>', message)
        json_data = json.dumps(message)
        print(f"📤 Sending message to topic '{topic}': {json_data}")
        producer.produce(topic, value=json_data.encode('utf-8'), callback=delivery_report)
        producer.flush()
    except Exception as e:
        print(f"❌ Error sending message: {e}")
