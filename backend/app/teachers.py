import re
from fastapi import APIRouter, HTTPException, Depends, Query, Request, status
from app.database import questions_col
from app.models import QuestionResponse
from app.utils import get_current_user, log_audit_action, require_role
from typing import List, Dict, Any

def parse_jee_options(options_data) -> list:
    if isinstance(options_data, list):
        return options_data
        
    combined_str = ""
    if isinstance(options_data, dict):
        if all(k in options_data for k in ['A', 'B', 'C', 'D']):
            return [
                f"A. {options_data['A']}",
                f"B. {options_data['B']}",
                f"C. {options_data['C']}",
                f"D. {options_data['D']}"
            ]
        # Otherwise get key 'A'
        combined_str = options_data.get('A', '')
        if not combined_str:
            combined_str = list(options_data.values())[0] if options_data else ''
    elif isinstance(options_data, str):
        combined_str = options_data
        
    combined_str = str(combined_str).strip()
    
    # Try to find (B), (C), (D)
    match_b = re.search(r'\((B|b)\)', combined_str)
    match_c = re.search(r'\((C|c)\)', combined_str)
    match_d = re.search(r'\((D|d)\)', combined_str)
    
    if match_b and match_c and match_d:
        idx_b = match_b.start()
        idx_c = match_c.start()
        idx_d = match_d.start()
        
        opt_a = combined_str[:idx_b].strip()
        opt_b = combined_str[idx_b + 3:idx_c].strip()
        opt_c = combined_str[idx_c + 3:idx_d].strip()
        opt_d = combined_str[idx_d + 3:].strip()
        
        opt_a = opt_a.lstrip('. :')
        opt_b = opt_b.lstrip('. :')
        opt_c = opt_c.lstrip('. :')
        opt_d = opt_d.lstrip('. :')
        
        return [
            f"A. {opt_a}",
            f"B. {opt_b}",
            f"C. {opt_c}",
            f"D. {opt_d}"
        ]
        
    # Try B), C), D)
    match_b2 = re.search(r'\bB\)\s*', combined_str)
    match_c2 = re.search(r'\bC\)\s*', combined_str)
    match_d2 = re.search(r'\bD\)\s*', combined_str)
    
    if match_b2 and match_c2 and match_d2:
        idx_b = match_b2.start()
        idx_c = match_c2.start()
        idx_d = match_d2.start()
        
        opt_a = combined_str[:idx_b].strip()
        opt_b = combined_str[idx_b + 2:idx_c].strip()
        opt_c = combined_str[idx_c + 2:idx_d].strip()
        opt_d = combined_str[idx_d + 2:].strip()
        
        opt_a = opt_a.lstrip('. :')
        opt_b = opt_b.lstrip('. :')
        opt_c = opt_c.lstrip('. :')
        opt_d = opt_d.lstrip('. :')
        
        return [
            f"A. {opt_a}",
            f"B. {opt_b}",
            f"C. {opt_c}",
            f"D. {opt_d}"
        ]

    return [
        f"A. {combined_str}",
        "B. Not specified",
        "C. Not specified",
        "D. Not specified"
    ]

def clean_question_text(question_text: str) -> str:
    question_text = str(question_text).strip()
    match = re.match(r'^Q\d+\.\s*', question_text, re.IGNORECASE)
    if match:
        question_text = question_text[match.end():]
    return question_text

def normalize_subject(s: str) -> str:
    if not s:
        return ""
    s = s.lower().strip()
    if s in ("maths", "math", "mathematics"):
        return "Mathematics"
    # Keep capitalization standard for other subjects
    if s == "physics":
        return "Physics"
    if s == "chemistry":
        return "Chemistry"
    if s == "biology":
        return "Biology"
    return s

router = APIRouter(prefix="/teachers", tags=["Teacher Panel"])

@router.get("/questions")
async def get_subject_questions(
    request: Request,
    subject: str = Query(None, description="The subject of the questions"),
    chapter: str = Query(None, description="Chapter filter"),
    search: str = Query(None, description="Search term in question text"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Questions per page"),
    current_user: dict = Depends(require_role(["teacher", "admin"]))
):
    user_email = current_user["email"]
    user_role = current_user["role"]
    user_subject = current_user["subject"]
    device_id = current_user["device_id"]

    # 1. Enforce Role-Based Subject Access Control
    # If the user is a teacher, they can only view questions for their assigned subject
    target_subject = user_subject
    
    if user_role == "teacher":
        if user_subject.lower() == "all":
            if subject and subject.lower() != "all":
                target_subject = normalize_subject(subject)
            else:
                target_subject = None
        else:
            if subject and normalize_subject(subject).lower() != normalize_subject(user_subject).lower():
                # Teacher is trying to access a subject they are not assigned to!
                await log_audit_action(
                    user_email,
                    f"unauthorized_subject_access_attempt (requested: {subject}, assigned: {user_subject})",
                    request,
                    device_id
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access Denied: You are only authorized to view {user_subject} questions."
                )
            if subject:
                target_subject = normalize_subject(subject)
            else:
                target_subject = normalize_subject(user_subject)
    else:
        # Admin can view any subject
        if subject:
            if subject.lower() == "all":
                target_subject = None
            else:
                target_subject = normalize_subject(subject)
        else:
            target_subject = None

    # 2. Build Query Filters
    query_filter: Dict[str, Any] = {}
    if target_subject:
        # Case insensitive subject check
        query_filter["subject"] = {"$regex": f"^{target_subject}$", "$options": "i"}
        
    if chapter:
        query_filter["chapter"] = {"$regex": f"^{chapter}$", "$options": "i"}
        
    if search:
        # Search keyword inside question text (case-insensitive regex)
        query_filter["question"] = {"$regex": search, "$options": "i"}

    # 3. Pagination calculation
    skip = (page - 1) * limit

    # 4. Fetch questions and count from MongoDB
    cursor = questions_col.find(query_filter).skip(skip).limit(limit)
    questions = await cursor.to_list(length=limit)
    total_questions = await questions_col.count_documents(query_filter)

    # Format output
    formatted_questions = []
    for q in questions:
        formatted_questions.append({
            "_id": str(q["_id"]),
            "subject": q.get("subject", ""),
            "chapter": q.get("chapter", "General"),
            "question": clean_question_text(q.get("question", "")),
            "options": parse_jee_options(q.get("options")),
            "answer": q.get("answer", "A"),
            "image_url": q.get("image_url", "")
        })

    # Return results
    return {
        "questions": formatted_questions,
        "total": total_questions,
        "page": page,
        "limit": limit,
        "pages": (total_questions + limit - 1) // limit
    }

# Endpoint for frontend to retrieve a list of unique chapters for the subject
@router.get("/chapters")
async def get_subject_chapters(
    request: Request,
    subject: str = Query(None, description="The subject to get chapters for"),
    current_user: dict = Depends(require_role(["teacher", "admin"]))
):
    user_role = current_user["role"]
    user_subject = current_user["subject"]
    
    target_subject = user_subject
    if user_role == "teacher":
        if user_subject.lower() == "all":
            if subject and subject.lower() != "all":
                target_subject = normalize_subject(subject)
            else:
                target_subject = None
        else:
            if subject and normalize_subject(subject).lower() != normalize_subject(user_subject).lower():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access Denied: You are only authorized to view {user_subject} chapters."
                )
            if subject:
                target_subject = normalize_subject(subject)
            else:
                target_subject = normalize_subject(user_subject)
    else:
        if subject:
            if subject.lower() == "all":
                target_subject = None
            else:
                target_subject = normalize_subject(subject)
        else:
            target_subject = None

    query_filter = {}
    if target_subject:
        query_filter["subject"] = {"$regex": f"^{target_subject}$", "$options": "i"}

    chapters = await questions_col.distinct("chapter", query_filter)
    return {"chapters": sorted([c for c in chapters if c])}

# Endpoint to log restricted actions from the frontend
@router.post("/log-restricted-action")
async def log_restricted_action(
    payload: Dict[str, str],
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    email = current_user["email"]
    device_id = current_user["device_id"]
    action_type = payload.get("action", "unknown_restricted_action")
    
    await log_audit_action(
        email,
        f"restricted_action_attempt: {action_type}",
        request,
        device_id
    )
    return {"message": "Restricted action logged."}
