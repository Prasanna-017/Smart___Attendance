import os
import logging
import requests

logger = logging.getLogger(__name__)

def send_absence_emails(students: list, date: str, custom_message: str = "") -> tuple:
    success_count = 0
    failure_count = 0
    errors = []

    api_key = os.getenv("BREVO_API_KEY")
    smtp_from = os.getenv("BREVO_SMTP_FROM", "prasannaanna9@gmail.com")

    for student in students:
        try:
            if hasattr(student, '__dict__'):
                to_email = getattr(student, 'email', None) or getattr(student, 'parent_email', None)
                student_name = getattr(student, 'name', None) or getattr(student, 'student_name', None)
            else:
                to_email = student.get("email") or student.get("parent_email")
                student_name = student.get("name") or student.get("student_name")

            if not to_email:
                errors.append(f"No email for {student_name}")
                failure_count += 1
                continue

            response = requests.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key": api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "sender": {"name": "Smart Attendance", "email": smtp_from},
                    "to": [{"email": to_email}],
                    "subject": f"Absence Alert - {student_name}",
                    "htmlContent": f"""
                        <h2>Absence Notification</h2>
                        <p>Dear Parent/Guardian,</p>
                        <p><strong>{student_name}</strong> was marked
                        <strong>absent</strong> on {date}.</p>
                        {f'<p>{custom_message}</p>' if custom_message else ''}
                        <p>Smart Attendance System</p>
                    """
                }
            )

            if response.status_code == 201:
                logger.info(f"Email sent to {to_email}")
                success_count += 1
            else:
                error_msg = response.json()
                logger.error(f"Brevo API error: {error_msg}")
                errors.append(str(error_msg))
                failure_count += 1

        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            errors.append(str(e))
            failure_count += 1

    return success_count, failure_count, errors
