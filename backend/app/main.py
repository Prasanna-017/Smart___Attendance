"""Smart Attendance System — FastAPI Backend."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import students, attendance


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - initialize resources."""
    # Startup: verify Supabase connection
    from app.services.supabase_client import get_supabase
    try:
        client = get_supabase()
        print("[OK] Supabase client initialized successfully")
    except Exception as e:
        print(f"[WARNING] Supabase connection issue: {e}")
    yield
    # Shutdown
    print("[INFO] Shutting down Smart Attendance API")


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="REST API for Smart Attendance System with Face Recognition",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
origins = [
    settings.frontend_url,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(students.router)
app.include_router(attendance.router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Smart Attendance System API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    """Health check for Render.com monitoring."""
    return {"status": "healthy"}
