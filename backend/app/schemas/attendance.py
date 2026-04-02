"""Pydantic schemas for Attendance model."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date


class AttendanceCreate(BaseModel):
    """Schema for marking attendance."""
    student_uuid: str
    student_name: str
    student_id: str
    confidence: Optional[float] = Field(None, ge=0, le=1)
    status: Optional[str] = "present"


class AttendanceResponse(BaseModel):
    """Schema for attendance response."""
    id: int
    student_uuid: str
    student_name: str
    student_id: str
    date: date
    check_in: datetime
    status: str
    session: str
    confidence: Optional[float] = None


class TimetableConfig(BaseModel):
    """Configuration for attendance sessions."""
    morning_start: str = "09:00"
    morning_end: str = "09:10"
    break_start: str = "11:00"
    break_end: str = "11:10"
    lunch_start: str = "13:00"
    lunch_end: str = "13:10"
    evening_break_start: str = "15:00"
    evening_break_end: str = "15:10"


class AttendanceSummary(BaseModel):
    """Summary stats for dashboard."""
    total_students: int
    present_today: int
    absent_today: int
    late_today: int
    attendance_rate: float


class AbsenteeResponse(BaseModel):
    """Student who is absent today."""
    id: str
    name: str
    student_id: str
    email: Optional[str] = None


class NotifyStudent(BaseModel):
    name: str
    student_id: str
    email: Optional[str] = None


class NotifyRequest(BaseModel):
    """Request schema for sending attendance notifications."""
    students: list[NotifyStudent]
    date: str
    message: Optional[str] = None


class NotifyResponse(BaseModel):
    """Response schema for notifications."""
    success_count: int
    failure_count: int
    errors: list[dict]
