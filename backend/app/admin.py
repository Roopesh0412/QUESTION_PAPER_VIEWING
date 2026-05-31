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

def normalize_question_data(data: dict) -> dict:
    normalized = {}
    
    # Helper to get value ignoring case and spaces/underscores
    def get_val(keys):
        for k in keys:
            if k in data:
                return data[k]
            k_norm = k.lower().replace(" ", "").replace("_", "")
            for dk in data:
                dk_norm = str(dk).lower().replace(" ", "").replace("_", "")
                if dk_norm == k_norm:
                    return data[dk]
        return None

    normalized["subject"] = get_val(["subject"]) or "Physics"
    normalized["chapter"] = get_val(["chapter"]) or "General"
    normalized["question"] = get_val(["question"]) or ""
    normalized["answer"] = get_val(["answer"]) or "A"
    normalized["image_url"] = get_val(["image_url", "imageUrl"]) or ""
    
    # Options & option images
    raw_options = get_val(["options"]) or []
    parsed_options = []
    parsed_option_images = ["", "", "", ""]
    if isinstance(raw_options, list):
        for i, opt in enumerate(raw_options):
            label = chr(65 + i)
            if isinstance(opt, dict):
                text = opt.get("text", "")
                img = opt.get("image_url", opt.get("imageUrl", ""))
                if not str(text).startswith(f"{label}. "):
                    text = f"{label}. {text}"
                parsed_options.append(text)
                if i < 4:
                    parsed_option_images[i] = img
            else:
                text = str(opt)
                if not text.startswith(f"{label}. "):
                    text = f"{label}. {text}"
                parsed_options.append(text)
    normalized["options"] = parsed_options

    # Extra tags
    normalized["class"] = str(get_val(["class", "class_level", "classLevel"]) or "11th")
    if "11" in normalized["class"]:
        normalized["class"] = "11th"
    elif "12" in normalized["class"]:
        normalized["class"] = "12th"

    normalized["exam_type"] = get_val(["exam_type", "examType", "exam"]) or "JEE"
    if str(normalized["exam_type"]).upper() in ("JEE", "NEET"):
        normalized["exam_type"] = str(normalized["exam_type"]).upper()

    # Question Type
    normalized["question_type"] = get_val(["question_type", "questionType", "assessment_type", "assessmentType"]) or "Multiple Choice"
    if "num" in str(normalized["question_type"]).lower():
        normalized["question_type"] = "Numerical"
    else:
        normalized["question_type"] = "Multiple Choice"

    # Difficulty Level
    normalized["difficulty_level"] = get_val(["difficulty_level", "difficultyLevel", "difficulty"]) or "Medium"
    normalized["difficulty_level"] = str(normalized["difficulty_level"]).capitalize()
    if normalized["difficulty_level"] not in ("Easy", "Medium", "Hard"):
        normalized["difficulty_level"] = "Medium"

    normalized["concept"] = get_val(["concept"]) or ""
    normalized["detailed_solution"] = get_val(["detailed_solution", "detailedSolution", "solution"]) or ""
    normalized["solution_image_url"] = get_val(["solution_image_url", "solutionImageUrl", "solution_image"]) or ""
    
    # option_images list
    opt_imgs = get_val(["option_images", "optionImages"])
    if isinstance(opt_imgs, list):
        for i in range(min(len(opt_imgs), 4)):
            if opt_imgs[i]:
                parsed_option_images[i] = opt_imgs[i]
    normalized["option_images"] = parsed_option_images

    return normalized

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
        "image_url": payload.image_url,
        "class": payload.class_level,
        "exam_type": payload.exam_type,
        "question_type": payload.question_type,
        "difficulty_level": payload.difficulty_level,
        "concept": payload.concept,
        "detailed_solution": payload.detailed_solution,
        "solution_image_url": payload.solution_image_url,
        "option_images": payload.option_images
    }
    await questions_col.insert_one(question_doc)
    await log_audit_action(current_user["email"], f"admin_create_question: {question_id}", request, current_user["device_id"])
    return {"message": "Question created successfully.", "question_id": question_id}

@router.post("/questions/bulk")
async def bulk_upload_questions(
    payload: List[Dict[str, Any]],
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
    for raw_q in payload:
        normalized = normalize_question_data(raw_q)
        q_id = str(uuid.uuid4())
        question_doc = {
            "_id": q_id,
            "subject": normalized["subject"],
            "chapter": normalized["chapter"],
            "question": normalized["question"],
            "options": normalized["options"],
            "answer": normalized["answer"],
            "image_url": normalized["image_url"],
            "class": normalized["class"],
            "exam_type": normalized["exam_type"],
            "question_type": normalized["question_type"],
            "difficulty_level": normalized["difficulty_level"],
            "concept": normalized["concept"],
            "detailed_solution": normalized["detailed_solution"],
            "solution_image_url": normalized["solution_image_url"],
            "option_images": normalized["option_images"]
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
    if payload.class_level is not None:
        update_data["class"] = payload.class_level
    if payload.exam_type is not None:
        update_data["exam_type"] = payload.exam_type
    if payload.question_type is not None:
        update_data["question_type"] = payload.question_type
    if payload.difficulty_level is not None:
        update_data["difficulty_level"] = payload.difficulty_level
    if payload.concept is not None:
        update_data["concept"] = payload.concept
    if payload.detailed_solution is not None:
        update_data["detailed_solution"] = payload.detailed_solution
    if payload.solution_image_url is not None:
        update_data["solution_image_url"] = payload.solution_image_url
    if payload.option_images is not None:
        update_data["option_images"] = payload.option_images

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
