import resend
import os
import logging

logger = logging.getLogger(__name__)

resend.api_key = os.getenv("RESEND_API_KEY")

def send_absence_emails(students: list, date: str, custom_message: str = "") -> tuple:
    """Send absence notification emails to a list of students."""
    success_count = 0
    failure_count = 0
    errors = []

    for student in students:
        try:
            to_email = student.get("email") or student.get("parent_email")
            student_name = student.get("name") or student.get("student_name")
            
            if not to_email:
                errors.append(f"No email for {student_name}")
                failure_count += 1
                continue

            resend.Emails.send({
                "from": "onboarding@resend.dev",
                "to": to_email,
                "subject": f"Absence Alert - {student_name}",
                "html": f"""
                    <h2>Absence Notification</h2>
                    <p>Dear Parent/Guardian,</p>
                    <p><strong>{student_name}</strong> was marked 
                    <strong>absent</strong> on {date}.</p>
                    {f'<p>{custom_message}</p>' if custom_message else ''}
                    <p>Smart Attendance System</p>
                """
            })
            logger.info(f"Email sent to {to_email}")
            success_count += 1

        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            errors.append(str(e))
            failure_count += 1

    return success_count, failure_count, errors
