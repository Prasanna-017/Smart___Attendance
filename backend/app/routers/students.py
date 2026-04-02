"""Student management endpoints."""

from fastapi import APIRouter, HTTPException
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentDescriptor
from app.services.supabase_client import get_supabase

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.get("", response_model=list[StudentResponse])
async def list_students():
    """Get all registered students."""
    supabase = get_supabase()
    result = supabase.table("students").select("*").order("name").execute()
    return result.data


@router.get("/descriptors")
async def get_all_descriptors():
    """Get all face descriptors for browser-side matching.
    Returns minimal data: id, name, student_id, face_descriptor.
    """
    supabase = get_supabase()
    result = (
        supabase.table("students")
        .select("id, name, student_id, face_descriptor")
        .not_.is_("face_descriptor", "null")
        .execute()
    )
    return result.data


@router.get("/{student_uuid}", response_model=StudentResponse)
async def get_student(student_uuid: str):
    """Get a single student by UUID."""
    supabase = get_supabase()
    result = (
        supabase.table("students")
        .select("*")
        .eq("id", student_uuid)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Student not found")
    return result.data[0]


@router.post("", response_model=StudentResponse, status_code=201)
async def create_student(student: StudentCreate):
    """Register a new student with face descriptor."""
    supabase = get_supabase()

    # Check for duplicate student_id
    existing = (
        supabase.table("students")
        .select("id")
        .eq("student_id", student.student_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=409,
            detail=f"Student ID '{student.student_id}' already exists"
        )

    result = (
        supabase.table("students")
        .insert(student.model_dump(exclude_none=True))
        .execute()
    )
    return result.data[0]


@router.put("/{student_uuid}", response_model=StudentResponse)
async def update_student(student_uuid: str, student: StudentUpdate):
    """Update student information."""
    supabase = get_supabase()

    update_data = student.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        supabase.table("students")
        .update(update_data)
        .eq("id", student_uuid)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Student not found")
    return result.data[0]


@router.delete("/{student_uuid}", status_code=204)
async def delete_student(student_uuid: str):
    """Delete a student."""
    supabase = get_supabase()
    result = (
        supabase.table("students")
        .delete()
        .eq("id", student_uuid)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Student not found")
    return None
