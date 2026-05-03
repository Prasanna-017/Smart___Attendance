import resend
import os
import logging

logger = logging.getLogger(__name__)

resend.api_key = os.getenv("RESEND_API_KEY")

def send_absence_email(to_email: str, student_name: str, date: str) -> bool:
    """Send absence notification email using Resend API."""
    try:
        resend.Emails.send({
            "from": "onboarding@resend.dev",
            "to": to_email,
            "subject": f"Absence Alert - {student_name}",
            "html": f"""
                <h2>Absence Notification</h2>
                <p>Dear Parent/Guardian,</p>
                <p>This is to inform you that <strong>{student_name}</strong> 
                was marked <strong>absent</strong> on {date}.</p>
                <p>Please contact the institution if you have any questions.</p>
                <br>
                <p>Smart Attendance System</p>
            """
        })
        logger.info(f"Absence email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False
