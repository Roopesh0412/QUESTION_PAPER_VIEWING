from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

# Authentication schemas
class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str
    device_id: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    device_id: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str
    subject: str

# Teacher schemas
class TeacherBase(BaseModel):
    email: EmailStr
    subject: str
    role: str = "teacher"
    is_active: bool = True

class TeacherCreate(TeacherBase):
    pass

class TeacherUpdate(BaseModel):
    subject: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class TeacherResponse(TeacherBase):
    id: str = Field(alias="_id")
    created_at: str

    class Config:
        populate_by_name = True

# Question schemas
class QuestionBase(BaseModel):
    subject: str
    chapter: str
    question: str
    options: List[str]
    answer: str
    image_url: Optional[str] = ""
    image_urls: Optional[List[str]] = Field(default_factory=list)
    class_level: Optional[str] = Field(default="11th", alias="class")
    exam_type: Optional[str] = "JEE"
    question_type: Optional[str] = "Multiple Choice"
    difficulty_level: Optional[str] = "Medium"
    concept: Optional[str] = ""
    detailed_solution: Optional[str] = ""
    solution_image_url: Optional[str] = ""
    option_images: Optional[List[str]] = Field(default_factory=lambda: ["", "", "", ""])

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(BaseModel):
    subject: Optional[str] = None
    chapter: Optional[str] = None
    question: Optional[str] = None
    options: Optional[List[str]] = None
    answer: Optional[str] = None
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    class_level: Optional[str] = Field(default=None, alias="class")
    exam_type: Optional[str] = None
    question_type: Optional[str] = None
    difficulty_level: Optional[str] = None
    concept: Optional[str] = None
    detailed_solution: Optional[str] = None
    solution_image_url: Optional[str] = None
    option_images: Optional[List[str]] = None

class QuestionResponse(QuestionBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True

# Session schemas
class SessionSchema(BaseModel):
    email: str
    session_id: str
    device_id: str
    login_time: str
    logout_time: Optional[str] = None

class ActiveSessionResponse(BaseModel):
    id: str = Field(alias="_id")
    email: str
    session_id: str
    device_id: str
    login_time: str
    logout_time: Optional[str] = None

    class Config:
        populate_by_name = True

# Audit log schema
class AuditLogSchema(BaseModel):
    email: str
    action: str
    timestamp: str
    ip_address: str
    device_id: str

class AuditLogResponse(AuditLogSchema):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True

# Front-end Restricted Action Logging payload
class RestrictedActionLogPayload(BaseModel):
    action: str
    device_id: str
