import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb+srv://Roopesh:Sanjana123@cluster0.qsk7ii7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    JWT_SECRET: str = "MANCHESTER_TECH_SUPER_SECRET_KEY_12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 1 day session
    
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_EMAIL: str = "placeholder@gmail.com"
    SMTP_PASSWORD: str = ""
    
    # Use console logging for OTP when SMTP credentials are not valid or placeholder
    USE_CONSOLE_OTP: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
