import datetime
import random
import uuid
from fastapi import APIRouter, HTTPException, Depends, Request, status
from app.config import settings
from app.database import teachers_col, otps_col, sessions_col
from app.models import OTPRequest, OTPVerifyRequest, LoginRequest, TokenResponse
from app.utils import log_audit_action, send_otp_email, get_current_user
import jwt

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Helper to generate 6-digit OTP
def generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"

@router.post("/request-otp")
async def request_otp(payload: OTPRequest, request: Request):
    email = payload.email.strip().lower()
    
    # 1. Validate email registered
    teacher = await teachers_col.find_one({"email": email})
    if not teacher:
        # Secure practice: don't reveal if account exists, or do reveal?
        # The prompt says: "System validates email exists."
        # If email does not exist, return an error.
        await log_audit_action(email, "otp_request_failed_unregistered", request)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is not registered in our system."
        )
    
    if not teacher.get("is_active", True):
        await log_audit_action(email, "otp_request_failed_deactivated", request)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This teacher account has been deactivated."
        )

    # 2. Rate limiting check (cooldown of 60 seconds)
    now = datetime.datetime.utcnow()
    last_otp = await otps_col.find_one(
        {"email": email},
        sort=[("created_at", -1)]
    )
    if last_otp:
        created_at = last_otp["created_at"]
        # Ensure timezone-naive comparison
        if created_at.tzinfo is not None:
            created_at = created_at.replace(tzinfo=None)
        elapsed = (now - created_at).total_seconds()
        if elapsed < 60:
            await log_audit_action(email, "otp_request_rate_limited", request)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {int(60 - elapsed)} seconds before requesting another OTP."
            )

    # 3. Generate OTP
    otp_code = generate_otp()
    expiry = now + datetime.timedelta(minutes=5)
    
    # 4. Save to Database
    await otps_col.insert_one({
        "email": email,
        "otp": otp_code,
        "created_at": now,
        "expires_at": expiry,
        "attempts": 0,
        "is_used": False
    })
    
    # 5. Send OTP via SMTP
    sent = send_otp_email(email, otp_code)
    if not sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email. Please contact support."
        )
        
    await log_audit_action(email, "otp_requested", request)
    
    return {"message": "A secure 6-digit OTP has been sent to your email address."}

@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(payload: OTPVerifyRequest, request: Request):
    email = payload.email.strip().lower()
    otp_entered = payload.otp.strip()
    device_id = payload.device_id.strip()

    # 1. Fetch latest OTP document for this email
    otp_doc = await otps_col.find_one(
        {"email": email, "is_used": False},
        sort=[("created_at", -1)]
    )

    if not otp_doc:
        await log_audit_action(email, "otp_verification_failed_not_found", request, device_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP found. Please request a new OTP."
        )

    # 2. Check Expiration
    now = datetime.datetime.utcnow()
    expires_at = otp_doc["expires_at"]
    if expires_at.tzinfo is not None:
        expires_at = expires_at.replace(tzinfo=None)
        
    if now > expires_at:
        await log_audit_action(email, "otp_verification_failed_expired", request, device_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new OTP."
        )

    # 3. Check Attempts Count
    attempts = otp_doc.get("attempts", 0)
    if attempts >= 3:
        # Deactivate this OTP
        await otps_col.update_one({"_id": otp_doc["_id"]}, {"$set": {"is_used": True}})
        await log_audit_action(email, "otp_verification_failed_max_attempts", request, device_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a new OTP."
        )

    # 4. Verify OTP code
    if otp_doc["otp"] != otp_entered:
        # Increment attempts
        attempts += 1
        await otps_col.update_one(
            {"_id": otp_doc["_id"]},
            {"$set": {"attempts": attempts}}
        )
        await log_audit_action(email, f"otp_verification_wrong_code_attempt_{attempts}", request, device_id)
        
        remaining = 3 - attempts
        if remaining <= 0:
            await otps_col.update_one({"_id": otp_doc["_id"]}, {"$set": {"is_used": True}})
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect OTP. Maximum attempts exceeded. Please request a new OTP."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Incorrect OTP. Remaining attempts: {remaining}."
            )

    # OTP is correct! Mark as used
    await otps_col.update_one({"_id": otp_doc["_id"]}, {"$set": {"is_used": True}})

    # Fetch teacher role and subject details
    teacher = await teachers_col.find_one({"email": email})
    if not teacher or not teacher.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is no longer active."
        )

    role = teacher.get("role", "teacher")
    subject = teacher.get("subject", "")

    # 5. ENFORCE SINGLE DEVICE LOGIN
    # Invalidate any existing active sessions
    existing_active = await sessions_col.find(
        {"email": email, "logout_time": None}
    ).to_list(length=100)
    
    if existing_active:
        now_str = datetime.datetime.utcnow().isoformat() + "Z"
        await sessions_col.update_many(
            {"email": email, "logout_time": None},
            {"$set": {"logout_time": now_str}}
        )
        for old_sess in existing_active:
            await log_audit_action(
                email, 
                f"session_terminated_concurrent_login (new device: {device_id}, old: {old_sess.get('device_id')})", 
                request, 
                old_sess.get("device_id")
            )

    # 6. Create New Session
    session_id = str(uuid.uuid4())
    login_time = datetime.datetime.utcnow().isoformat() + "Z"
    
    session_doc = {
        "_id": str(uuid.uuid4()),
        "email": email,
        "session_id": session_id,
        "device_id": device_id,
        "login_time": login_time,
        "logout_time": None
    }
    await sessions_col.insert_one(session_doc)
    await log_audit_action(email, "login_success", request, device_id)
    await log_audit_action(email, "session_created", request, device_id)

    # 7. Create JWT Session Token
    exp = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_payload = {
        "email": email,
        "role": role,
        "subject": subject,
        "session_id": session_id,
        "device_id": device_id,
        "exp": exp
    }
    token = jwt.encode(token_payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": role,
        "email": email,
        "subject": subject
    }

@router.post("/logout")
async def logout(request: Request, current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    session_id = current_user["session_id"]
    device_id = current_user["device_id"]
    
    now_str = datetime.datetime.utcnow().isoformat() + "Z"
    
    # Terminate active session
    await sessions_col.update_one(
        {"email": email, "session_id": session_id, "logout_time": None},
        {"$set": {"logout_time": now_str}}
    )
    
    await log_audit_action(email, "logout", request, device_id)
    await log_audit_action(email, "session_terminated", request, device_id)
    
    return {"message": "Successfully logged out."}

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, request: Request):
    email = payload.email.strip().lower()
    password = payload.password.strip()
    device_id = payload.device_id.strip()

    # 1. Validate email is registered and active
    teacher = await teachers_col.find_one({"email": email})
    if not teacher:
        await log_audit_action(email, "login_failed_unregistered", request, device_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password."
        )
    
    if not teacher.get("is_active", True):
        await log_audit_action(email, "login_failed_deactivated", request, device_id)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This teacher account has been deactivated."
        )

    # Check suspension
    suspended_until = teacher.get("suspended_until")
    if suspended_until:
        susp_time = datetime.datetime.fromisoformat(suspended_until.replace("Z", ""))
        if datetime.datetime.utcnow() < susp_time:
            diff = susp_time - datetime.datetime.utcnow()
            minutes_left = int(diff.total_seconds() / 60) + 1
            await log_audit_action(email, "login_failed_account_suspended", request, device_id)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Your account is temporarily suspended due to a security violation (screenshot attempt). Please try again after {minutes_left} minutes."
            )

    # 2. Verify password
    if password != "Mantech":
        await log_audit_action(email, "login_failed_wrong_password", request, device_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password."
        )

    # 3. Create New Session (Enforce single device session)
    existing_active = await sessions_col.find(
        {"email": email, "logout_time": None}
    ).to_list(length=100)
    
    if existing_active:
        now_str = datetime.datetime.utcnow().isoformat() + "Z"
        await sessions_col.update_many(
            {"email": email, "logout_time": None},
            {"$set": {"logout_time": now_str}}
        )
        for old_sess in existing_active:
            await log_audit_action(
                email, 
                f"session_terminated_concurrent_login (new device: {device_id}, old: {old_sess.get('device_id')})", 
                request, 
                old_sess.get("device_id")
            )

    session_id = str(uuid.uuid4())
    login_time = datetime.datetime.utcnow().isoformat() + "Z"
    
    session_doc = {
        "_id": str(uuid.uuid4()),
        "email": email,
        "session_id": session_id,
        "device_id": device_id,
        "login_time": login_time,
        "logout_time": None
    }
    await sessions_col.insert_one(session_doc)
    await log_audit_action(email, "login_success", request, device_id)
    await log_audit_action(email, "session_created", request, device_id)

    # 4. Generate JWT
    role = teacher.get("role", "teacher")
    subject = teacher.get("subject", "")
    
    exp = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_payload = {
        "email": email,
        "role": role,
        "subject": subject,
        "session_id": session_id,
        "device_id": device_id,
        "exp": exp
    }
    token = jwt.encode(token_payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": role,
        "email": email,
        "subject": subject
    }
