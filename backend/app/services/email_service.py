import smtplib
import os
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

def send_absence_emails(students: list, date: str, custom_message: str = "") -> tuple:
    success_count = 0
    failure_count = 0
    errors = []

    smtp_user = os.getenv("BREVO_SMTP_USER")
    smtp_pass = os.getenv("BREVO_SMTP_PASSWORD")
    smtp_from = os.getenv("BREVO_SMTP_FROM")

    for student in students:
        try:
            # Handle both dict and Pydantic model objects
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

            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"Absence Alert - {student_name}"
            msg["From"] = smtp_from
            msg["To"] = to_email

            html = f"""
                <h2>Absence Notification</h2>
                <p>Dear Parent/Guardian,</p>
                <p><strong>{student_name}</strong> was marked
                <strong>absent</strong> on {date}.</p>
                {f'<p>{custom_message}</p>' if custom_message else ''}
                <p>Smart Attendance System</p>
            """
            msg.attach(MIMEText(html, "html"))

            with smtplib.SMTP("smtp-relay.brevo.com", 587) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_from, to_email, msg.as_string())

            logger.info(f"Email sent to {to_email}")
            success_count += 1

        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            errors.append(str(e))
            failure_count += 1

    return success_count, failure_count, errors
