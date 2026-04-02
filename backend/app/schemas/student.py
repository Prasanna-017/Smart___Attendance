"""Pydantic schemas for Student model."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class StudentCreate(BaseModel):
    """Schema for creating a new student."""
    name: str = Field(..., min_length=1, max_length=100)
    student_id: str = Field(..., min_length=1, max_length=20)
    email: Optional[str] = None
    face_descriptor: Optional[list[float]] = None
    photo_url: Optional[str] = None


class StudentUpdate(BaseModel):
    """Schema for updating a student."""
    name: Optional[str] = None
    email: Optional[str] = None
    face_descriptor: Optional[list[float]] = None
    photo_url: Optional[str] = None


class StudentResponse(BaseModel):
    """Schema for student response."""
    id: str
    name: str
    student_id: str
    email: Optional[str] = None
    face_descriptor: Optional[list[float]] = None
    photo_url: Optional[str] = None
    created_at: Optional[datetime] = None


class StudentDescriptor(BaseModel):
    """Minimal schema for face matching — only id, name, and descriptor."""
    id: str
    name: str
    student_id: str
    face_descriptor: list[float]
