import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import seed_database
from app.auth import router as auth_router
from app.teachers import router as teachers_router
from app.admin import router as admin_router

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")

app = FastAPI(
    title="Manchester Technologies - Secure Question Bank Portal",
    description="A production-grade secure web API for managing and viewing questions.",
    version="1.0.0"
)

# Configure CORS Middleware
# In production, specify exact origins. For our local setup, allow all for development ease.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(teachers_router, prefix="/api")
app.include_router(admin_router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up FastAPI application...")
    try:
        # Run database seeding
        await seed_database()
        logger.info("Database seeding checked and verified.")
    except Exception as e:
        logger.error(f"Error during startup seeding: {e}")

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Manchester Technologies Secure Question Bank API",
        "database": "MongoDB Atlas"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
