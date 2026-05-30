import datetime
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Request, Query, status
from app.database import teachers_col, questions_col, sessions_col, audit_logs_col
from app.models import (
    TeacherCreate, TeacherUpdate, TeacherResponse,
    QuestionCreate, QuestionUpdate, QuestionResponse,
    ActiveSessionResponse, AuditLogResponse
)
from app.utils import require_role, log_audit_action

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

# Ensure only users with "admin" role can access the Admin Panel endpoints
admin_auth = require_role(["admin"])

# ==========================================
# TEACHER MANAGEMENT (CRUD)
# ==========================================

@router.get("/teachers")
async def get_teachers(
    current_user: dict = Depends(admin_auth)
):
    cursor = teachers_col.find()
    teachers = await cursor.to_list(length=1000)
    formatted = []
    for t in teachers:
        formatted.append({
            "_id": str(t["_id"]),
            "email": t["email"],
            "subject": t["subject"],
            "role": t.get("role", "teacher"),
            "is_active": t.get("is_active", True),
            "created_at": t.get("created_at", "")
        })
    return formatted

@router.post("/teachers")
async def create_teacher(
    payload: TeacherCreate,
    request: Request,
    current_user: dict = Depends(admin_auth)
):
    email = payload.email.strip().lower()
    
    # Check if teacher already exists
    existing = await teachers_col.find_one({"email": email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A teacher account with this email already exists."
        )

    teacher_id = str(uuid.uuid4())
    now_str = datetime.datetime.utcnow().isoformat() + "Z"
    
    teacher_doc = {
        "_id": teacher_id,
        "email": email,
        "subject": payload.subject,
        "role": payload.role,
        "is_active": payload.is_active,
        "created_at": now_str
    }
    
    await teachers_col.insert_one(teacher_doc)
    await log_audit_action(current_user["email"], f"admin_create_teacher: {email}", request, current_user["device_id"])
    
    return {"message": "Teacher account created successfully.", "teacher_id": teacher_id}

@router.put("/teachers/{teacher_id}")
async def update_teacher(
    teacher_id: str,
    payload: TeacherUpdate,
    request: Request,
    current_user: dict = Depends(admin_auth)
):
    # Check if teacher exists
    teacher = await teachers_col.find_one({"_id": teacher_id})
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher account not found."
        )

    update_data = {}
    if payload.subject is not None:
        update_data["subject"] = payload.subject
    if payload.role is not None:
        update_data["role"] = payload.role
    if payload.is_active is not None:
        update_data["is_active"] = payload.is_active
        
        # If deactivating, terminate their current active sessions
        if payload.is_active is False:
            now_str = datetime.datetime.utcnow().isoformat() + "Z"
            await sessions_col.update_many(
                {"email": teacher["email"], "logout_time": None},
                {"$set": {"logout_time": now_str}}
            )
            await log_audit_action(
                current_user["email"], 
                f"admin_deactivate_sessions_for: {teacher['email']}", 
                request, 
                current_user["device_id"]
            )

    if update_data:
        await teachers_col.update_one({"_id": teacher_id}, {"$set": update_data})
        await log_audit_action(
            current_user["email"], 
            f"admin_update_teacher: {teacher['email']} (updated fields: {list(update_data.keys())})", 
            request, 
            current_user["device_id"]
        )

    return {"message": "Teacher account updated successfully."}

@router.delete("/teachers/{teacher_id}")
async def delete_teacher(
    teacher_id: str,
    request: Request,
    current_user: dict = Depends(admin_auth)
):
    teacher = await teachers_col.find_one({"_id": teacher_id})
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher account not found."
        )

    # Invalidate sessions first
    now_str = datetime.datetime.utcnow().isoformat() + "Z"
    await sessions_col.update_many(
        {"email": teacher["email"], "logout_time": None},
        {"$set": {"logout_time": now_str}}
    )

    await teachers_col.delete_one({"_id": teacher_id})
    await log_audit_action(current_user["email"], f"admin_delete_teacher: {teacher['email']}", request, current_user["device_id"])
    
    return {"message": "Teacher account deleted successfully."}

# ==========================================
# QUESTION MANAGEMENT (CRUD & Bulk Upload)
# ==========================================

@router.post("/questions")
async def create_question(
    payload: QuestionCreate,
    request: Request,
    current_user: dict = Depends(admin_auth)
):
    if current_user["email"].lower() != "manchestertechnologiess@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only manchestertechnologiess@gmail.com is authorized to manage questions."
        )
    question_id = str(uuid.uuid4())
    question_doc = {
        "_id": question_id,
        "subject": payload.subject,
        "chapter": payload.chapter,
        "question": payload.question,
        "options": payload.options,
        "answer": payload.answer,
        "image_url": payload.image_url
    }
    await questions_col.insert_one(question_doc)
    await log_audit_action(current_user["email"], f"admin_create_question: {question_id}", request, current_user["device_id"])
    return {"message": "Question created successfully.", "question_id": question_id}

@router.post("/questions/bulk")
async def bulk_upload_questions(
    payload: List[QuestionCreate],
    request: Request,
    current_user: dict = Depends(admin_auth)
):
    if current_user["email"].lower() != "manchestertechnologiess@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only manchestertechnologiess@gmail.com is authorized to manage questions."
        )
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No questions provided in bulk upload request."
        )

    inserted_ids = []
    for q in payload:
        q_id = str(uuid.uuid4())
        question_doc = {
            "_id": q_id,
            "subject": q.subject,
            "chapter": q.chapter,
            "question": q.question,
            "options": q.options,
            "answer": q.answer,
            "image_url": q.image_url
        }
        await questions_col.insert_one(question_doc)
        inserted_ids.append(q_id)

    await log_audit_action(
        current_user["email"], 
        f"admin_bulk_upload_questions: {len(inserted_ids)} questions added", 
        request, 
        current_user["device_id"]
    )
    return {"message": f"Successfully uploaded {len(inserted_ids)} questions.", "ids": inserted_ids}

@router.put("/questions/{question_id}")
async def update_question(
    question_id: str,
    payload: QuestionUpdate,
    request: Request,
    current_user: dict = Depends(admin_auth)
):
    if current_user["email"].lower() != "manchestertechnologiess@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only manchestertechnologiess@gmail.com is authorized to manage questions."
        )
    question = await questions_col.find_one({"_id": question_id})
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found."
        )

    update_data = {}
    if payload.subject is not None:
        update_data["subject"] = payload.subject
    if payload.chapter is not None:
        update_data["chapter"] = payload.chapter
    if payload.question is not None:
        update_data["question"] = payload.question
    if payload.options is not None:
        update_data["options"] = payload.options
    if payload.answer is not None:
        update_data["answer"] = payload.answer
    if payload.image_url is not None:
        update_data["image_url"] = payload.image_url

    if update_data:
        await questions_col.update_one({"_id": question_id}, {"$set": update_data})
        await log_audit_action(current_user["email"], f"admin_update_question: {question_id}", request, current_user["device_id"])

    return {"message": "Question updated successfully."}

@router.delete("/questions/{question_id}")
async def delete_question(
    question_id: str,
    request: Request,
    current_user: dict = Depends(admin_auth)
):
    if current_user["email"].lower() != "manchestertechnologiess@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only manchestertechnologiess@gmail.com is authorized to manage questions."
        )
    question = await questions_col.find_one({"_id": question_id})
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found."
        )

    await questions_col.delete_one({"_id": question_id})
    await log_audit_action(current_user["email"], f"admin_delete_question: {question_id}", request, current_user["device_id"])
    return {"message": "Question deleted successfully."}

@router.post("/questions/bulk-delete")
async def bulk_delete_questions(
    payload: List[str],
    request: Request,
    current_user: dict = Depends(admin_auth)
):
    if current_user["email"].lower() != "manchestertechnologiess@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only manchestertechnologiess@gmail.com is authorized to manage questions."
        )
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No question IDs provided for deletion."
        )
    
    result = await questions_col.delete_many({"_id": {"$in": payload}})
    await log_audit_action(
        current_user["email"], 
        f"admin_bulk_delete_questions: deleted {result.deleted_count} questions", 
        request, 
        current_user["device_id"]
    )
    return {"message": f"Successfully deleted {result.deleted_count} questions."}

# ==========================================
# SYSTEM MONITORING (AUDIT LOGS & SESSIONS)
# ==========================================

@router.get("/sessions")
async def get_active_sessions(
    current_user: dict = Depends(admin_auth)
):
    cursor = sessions_col.find({"logout_time": None})
    sessions = await cursor.to_list(length=100)
    formatted = []
    for s in sessions:
        formatted.append({
            "_id": str(s["_id"]),
            "email": s["email"],
            "session_id": s["session_id"],
            "device_id": s["device_id"],
            "login_time": s["login_time"],
            "logout_time": s.get("logout_time")
        })
    return formatted

@router.post("/sessions/force-logout")
async def force_logout_session(
    payload: Dict[str, str],
    request: Request,
    current_user: dict = Depends(admin_auth)
):
    target_email = payload.get("email")
    target_session_id = payload.get("session_id")
    
    if not target_email or not target_session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="email and session_id are required fields."
        )

    now_str = datetime.datetime.utcnow().isoformat() + "Z"
    
    # Invalidate session in DB
    result = await sessions_col.update_one(
        {"email": target_email.lower(), "session_id": target_session_id, "logout_time": None},
        {"$set": {"logout_time": now_str}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active session not found or already terminated."
        )

    await log_audit_action(
        current_user["email"], 
        f"admin_force_logout: terminated session {target_session_id} for user {target_email}", 
        request, 
        current_user["device_id"]
    )
    
    return {"message": f"Successfully forced logout for user {target_email}."}

@router.get("/audit-logs")
async def get_audit_logs(
    email: str = Query(None),
    action: str = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    current_user: dict = Depends(admin_auth)
):
    query_filter = {}
    if email:
        query_filter["email"] = {"$regex": email.strip(), "$options": "i"}
    if action:
        query_filter["action"] = {"$regex": action.strip(), "$options": "i"}

    cursor = audit_logs_col.find(query_filter).sort("timestamp", -1).limit(limit)
    logs = await cursor.to_list(length=limit)
    
    formatted = []
    for l in logs:
        formatted.append({
            "_id": str(l["_id"]),
            "email": l["email"],
            "action": l["action"],
            "timestamp": l["timestamp"],
            "ip_address": l.get("ip_address", "unknown"),
            "device_id": l.get("device_id", "unknown")
        })
    return formatted
