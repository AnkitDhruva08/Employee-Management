from kafka import KafkaProducer

producer = KafkaProducer(bootstrap_servers='localhost:9092')
producer.send('notifications', b'Test message from producer')
producer.flush()
print("✅ Message sent")