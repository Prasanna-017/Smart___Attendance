import smtplib
import ssl

email_user = "prasannabalasubramaniam75@gmail.com"
email_pass = "rozd beqw zodt dyll"

context = ssl.create_default_context()

print("Testing SMTP login with App Password...\n")

try:
    server = smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context, timeout=15)
    server.login(email_user, email_pass)
    print("SUCCESS! SMTP login worked!")
    server.quit()
except Exception as e:
    print(f"FAILED: {e}")
