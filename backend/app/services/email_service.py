import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)


def _connect_smtp(email_user: str, email_pass: str) -> smtplib.SMTP | smtplib.SMTP_SSL:
    """Try SSL (port 465) first, then fall back to STARTTLS (port 587)."""
    context = ssl.create_default_context()

    # Attempt 1: SMTP_SSL on port 465
    try:
        logger.info("Trying SMTP_SSL on port 465...")
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context, timeout=15)
        server.login(email_user, email_pass)
        logger.info("Connected via SMTP_SSL (465)")
        return server
    except Exception as e:
        logger.warning(f"SMTP_SSL (465) failed: {e}")

    # Attempt 2: STARTTLS on port 587
    try:
        logger.info("Trying STARTTLS on port 587...")
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=15)
        server.ehlo()
        server.starttls(context=context)
        server.ehlo()
        server.login(email_user, email_pass)
        logger.info("Connected via STARTTLS (587)")
        return server
    except Exception as e:
        logger.warning(f"STARTTLS (587) failed: {e}")
        raise ConnectionError(
            f"Could not connect to Gmail SMTP on port 465 or 587. "
            f"Last error: {e}"
        )


def send_absence_emails(students: list, date: str, custom_message: str = None) -> tuple[int, int, list]:
    """
    Sends absence emails using SMTP.
    Args:
        students: list of NotifyStudent schemas
        date: absence date string
        custom_message: Optional custom message overriding the default body
    Returns:
        tuple containing (success_count, failure_count, errors)
    """
    settings = get_settings()
    email_user = settings.smtp_email
    email_pass = settings.smtp_password

    if not email_user or not email_pass:
        logger.warning("SMTP credentials not configured.")
        return 0, len(students), [{"error": "SMTP credentials not configured"}]

    success_count = 0
    failure_count = 0
    errors = []

    try:
        server = _connect_smtp(email_user, email_pass)

        for student in students:
            if not student.email:
                failure_count += 1
                errors.append({"student_id": student.student_id, "error": "No email address provided"})
                continue

            msg = MIMEMultipart()
            msg["From"] = email_user
            msg["To"] = student.email
            msg["Subject"] = "Absence Notification - Smart Attendance"

            body = custom_message if custom_message else (
                f"Dear {student.name} ({student.student_id}),\n\n"
                f"This is an automated notification to inform you that you were "
                f"marked absent for the session on {date}.\n\n"
                f"If you believe this is an error, please contact your department.\n\n"
                f"Regards,\nSmart Attendance System"
            )

            msg.attach(MIMEText(body, "plain"))

            try:
                server.send_message(msg)
                success_count += 1
                logger.info(f"Email sent to {student.email}")
            except Exception as e:
                failure_count += 1
                errors.append({"student_id": student.student_id, "error": str(e)})
                logger.error(f"Failed to send to {student.email}: {e}")

        server.quit()

    except Exception as e:
        logger.error(f"SMTP connection failed: {e}")
        return 0, len(students), [{"error": f"SMTP Connection failed: {str(e)}"}]

    return success_count, failure_count, errors
