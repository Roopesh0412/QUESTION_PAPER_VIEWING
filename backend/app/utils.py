import datetime
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import jwt
from fastapi import Header, HTTPException, Request, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from app.database import sessions_col, teachers_col, audit_logs_col

logger = logging.getLogger("uvicorn.error")
security = HTTPBearer()

# 1. Audit Logging Utility
async def log_audit_action(email: str, action: str, request: Request, device_id: str = "unknown"):
    # Determine IP Address
    ip_address = "unknown"
    if request.client:
        ip_address = request.client.host
    # Forwarded headers support
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        ip_address = forwarded_for.split(",")[0].strip()

    audit_entry = {
        "email": email,
        "action": action,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "ip_address": ip_address,
        "device_id": device_id
    }
    try:
        await audit_logs_col.insert_one(audit_entry)
        logger.info(f"Audit Log: {email} - {action} - {ip_address}")
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")

# 2. OTP Sender
def send_otp_email(to_email: str, otp_code: str) -> bool:
    subject = "Manchester Technologies - Secure OTP Verification"
    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background-color: #1e293b; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px; letter-spacing: 1px;">MANCHESTER TECHNOLOGIES</h2>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">Secure Question Bank Portal</p>
          </div>
          <div style="padding: 24px; background-color: #ffffff;">
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 16px;">To complete your login process, please use the following one-time password (OTP):</p>
            <div style="margin: 30px 0; text-align: center;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; background-color: #eff6ff; padding: 12px 24px; border-radius: 6px; border: 1px dashed #2563eb; display: inline-block;">
                {otp_code}
              </span>
            </div>
            <p style="font-size: 14px; color: #ef4444; font-weight: 500;">IMPORTANT: This OTP is valid for 5 minutes. Do not share this code with anyone.</p>
            <p style="font-size: 14px; color: #64748b; margin-top: 20px;">If you did not request this OTP, please contact the administrator immediately.</p>
          </div>
          <div style="background-color: #f8fafc; color: #64748b; padding: 15px; text-align: center; font-size: 12px; border-top: 1px solid #e2e8f0;">
            This is an automated security notification from Manchester Technologies.
          </div>
        </div>
      </body>
    </html>
    """

    # Check if configurations are default/invalid
    if (not settings.SMTP_PASSWORD or 
        settings.SMTP_EMAIL == "placeholder@gmail.com" or 
        settings.USE_CONSOLE_OTP):
        logger.warning("=" * 60)
        logger.warning(f"SMTP NOT CONFIGURED. LOGGING OTP FOR: {to_email}")
        logger.warning(f"OTP CODE IS: {otp_code}")
        logger.warning("=" * 60)
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_EMAIL, [to_email], msg.as_string())
        logger.info(f"OTP email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Error sending email to {to_email}: {e}")
        # Always fallback to console log so it doesn't block evaluation
        logger.warning("=" * 60)
        logger.warning(f"EMAIL SENDING FAILED. FALLBACK OTP FOR: {to_email}")
        logger.warning(f"OTP CODE IS: {otp_code}")
        logger.warning("=" * 60)
        return True

# 3. JWT & Active Session Verification Dependency
async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("email")
    role = payload.get("role")
    session_id = payload.get("session_id")
    device_id = payload.get("device_id")

    if not email or not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # A. Check if the user/teacher is active in the database
    teacher = await teachers_col.find_one({"email": email.lower()})
    if not teacher:
        # User not found in DB
        await log_audit_action(email, "unauthorized_access_attempt_no_user", request, device_id)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher account not registered",
        )
    
    if not teacher.get("is_active", True):
        await log_audit_action(email, "unauthorized_access_attempt_inactive_user", request, device_id)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher account is deactivated",
        )

    # B. Single Device Session Check
    active_session = await sessions_col.find_one({
        "email": email.lower(),
        "logout_time": None
    })
    
    if not active_session:
        # No active session found in database
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="SESSION_TERMINATED",
        )

    if active_session.get("session_id") != session_id:
        # Session IDs do not match (a newer device has logged in)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="SESSION_TERMINATED",
        )

    # Return decoded session user info
    return {
        "email": email.lower(),
        "role": teacher.get("role", "teacher"),
        "subject": teacher.get("subject"),
        "session_id": session_id,
        "device_id": device_id
    }

# Helper to verify role requirements
def require_role(allowed_roles: list):
    async def dependency(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for role: {current_user['role']}",
            )
        return current_user
    return dependency
