import requests
import json

url = "http://localhost:8000/api/attendance/notify"
payload = {
    "students": [
        {
            "student_id": "TEST001",
            "name": "Test Student",
            "email": "prasannabalasubramaniam75@gmail.com"
        }
    ],
    "date": "2026-04-02"
}

print("Sending test email via /api/attendance/notify ...\n")
resp = requests.post(url, json=payload)
print(f"Status: {resp.status_code}")
print(f"Response: {json.dumps(resp.json(), indent=2)}")
