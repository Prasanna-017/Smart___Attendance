"""Attendance management endpoints."""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceResponse,
    AttendanceSummary,
    AbsenteeResponse,
    TimetableConfig,
    NotifyRequest,
    NotifyResponse,
)
from app.services.supabase_client import get_supabase
from app.services.email_service import send_absence_emails
from datetime import date, datetime, time
import csv
import io

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


def _get_timetable() -> TimetableConfig:
    """Get timetable configuration from settings."""
    supabase = get_supabase()
    result = (
        supabase.table("settings")
        .select("value")
        .eq("key", "timetable_config")
        .execute()
    )
    if result.data:
        config = result.data[0]["value"]
        if isinstance(config, str):
            import json
            config = json.loads(config)
        return TimetableConfig(**config)
    return TimetableConfig()


@router.get("/timetable", response_model=TimetableConfig)
async def get_timetable_config():
    """Get the current timetable configuration."""
    return _get_timetable()


@router.put("/timetable", response_model=TimetableConfig)
async def update_timetable_config(config: TimetableConfig):
    """Update timetable configuration."""
    supabase = get_supabase()
    
    result = supabase.table("settings").select("key").eq("key", "timetable_config").execute()
    if result.data:
        supabase.table("settings").update({"value": config.model_dump()}).eq("key", "timetable_config").execute()
    else:
        supabase.table("settings").insert({"key": "timetable_config", "value": config.model_dump()}).execute()
    
    return config


@router.post("", response_model=AttendanceResponse, status_code=201)
async def mark_attendance(record: AttendanceCreate):
    """Mark attendance if within the strict 10 minute boundaries of the timetable."""
    supabase = get_supabase()
    today = date.today()
    now_time = datetime.now().time()
    
    timetable = _get_timetable()
    
    def parse_t(t_str: str) -> time:
        parts = t_str.split(":")
        return time(int(parts[0]), int(parts[1]))
        
    m_start = parse_t(timetable.morning_start)
    m_end = parse_t(timetable.morning_end)
    b_start = parse_t(timetable.break_start)
    b_end = parse_t(timetable.break_end)
    l_start = parse_t(timetable.lunch_start)
    l_end = parse_t(timetable.lunch_end)
    e_start = parse_t(timetable.evening_break_start)
    e_end = parse_t(timetable.evening_break_end)
    
    session = None
    if m_start <= now_time <= m_end:
        session = "morning"
    elif b_start <= now_time <= b_end:
        session = "after_break"
    elif l_start <= now_time <= l_end:
        session = "after_lunch"
    elif e_start <= now_time <= e_end:
        session = "evening_break"
        
    if not session:
        raise HTTPException(
            status_code=403,
            detail="Attendance is currently closed. It strictly opens for 10 minutes according to your configured timetable."
        )

    # Check if already marked for THIS specific session today
    existing = (
        supabase.table("attendance")
        .select("id")
        .eq("student_uuid", record.student_uuid)
        .eq("date", today.isoformat())
        .eq("session", session)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=409,
            detail=f"Attendance already marked for {record.student_name} this {session.replace('_', ' ')}"
        )

    insert_data = {
        "student_uuid": record.student_uuid,
        "student_name": record.student_name,
        "student_id": record.student_id,
        "date": today.isoformat(),
        "check_in": datetime.now().isoformat(),
        "status": record.status,
        "session": session,
        "confidence": record.confidence,
    }

    result = supabase.table("attendance").insert(insert_data).execute()
    return result.data[0]


@router.get("", response_model=list[AttendanceResponse])
async def get_attendance(
    date_from: date | None = Query(None, description="Start date filter"),
    date_to: date | None = Query(None, description="End date filter"),
    student_id: str | None = Query(None, description="Filter by student ID"),
    status: str | None = Query(None, description="Filter by status"),
    limit: int = Query(100, ge=1, le=1000),
):
    """Get attendance records with optional filters."""
    supabase = get_supabase()
    query = supabase.table("attendance").select("*")

    if date_from:
        query = query.gte("date", date_from.isoformat())
    if date_to:
        query = query.lte("date", date_to.isoformat())
    if student_id:
        query = query.eq("student_id", student_id)
    if status:
        query = query.eq("status", status)

    result = query.order("check_in", desc=True).limit(limit).execute()
    return result.data


@router.get("/today", response_model=list[AttendanceResponse])
async def get_today_attendance():
    """Get today's attendance records."""
    supabase = get_supabase()
    today = date.today().isoformat()
    result = (
        supabase.table("attendance")
        .select("*")
        .eq("date", today)
        .order("check_in", desc=True)
        .execute()
    )
    return result.data


@router.get("/summary", response_model=AttendanceSummary)
async def get_attendance_summary():
    """Get today's attendance summary stats."""
    supabase = get_supabase()
    today = date.today().isoformat()

    # Total students
    students_result = supabase.table("students").select("id", count="exact").execute()
    total_students = students_result.count or 0

    # Today's attendance
    today_result = (
        supabase.table("attendance")
        .select("*")
        .eq("date", today)
        .execute()
    )
    today_records = today_result.data

    present_today = sum(1 for r in today_records if r["status"] == "present")
    late_today = sum(1 for r in today_records if r["status"] == "late")
    absent_today = total_students - present_today - late_today

    attendance_rate = (
        ((present_today + late_today) / total_students * 100)
        if total_students > 0
        else 0
    )

    return AttendanceSummary(
        total_students=total_students,
        present_today=present_today,
        absent_today=max(0, absent_today),
        late_today=late_today,
        attendance_rate=round(attendance_rate, 1),
    )


@router.get("/absentees", response_model=list[AbsenteeResponse])
async def get_absentees():
    """Get list of students who haven't been marked present today."""
    supabase = get_supabase()
    today = date.today().isoformat()

    # Get all students
    students_result = supabase.table("students").select("id, name, student_id, email").execute()
    all_students = {s["id"]: s for s in students_result.data}

    # Get today's marked students
    attendance_result = (
        supabase.table("attendance")
        .select("student_uuid")
        .eq("date", today)
        .execute()
    )
    marked_ids = {r["student_uuid"] for r in attendance_result.data}

    # Filter absentees
    absentees = [
        AbsenteeResponse(**student)
        for sid, student in all_students.items()
        if sid not in marked_ids
    ]
    return absentees


@router.get("/export")
async def export_attendance_csv(
    date_from: date = Query(..., description="Start date"),
    date_to: date = Query(..., description="End date"),
):
    """Export attendance records as CSV file."""
    supabase = get_supabase()
    result = (
        supabase.table("attendance")
        .select("*")
        .gte("date", date_from.isoformat())
        .lte("date", date_to.isoformat())
        .order("date")
        .order("student_name")
        .execute()
    )

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student Name", "Student ID", "Date", "Check-In Time", "Status", "Confidence"])

    for record in result.data:
        writer.writerow([
            record["student_name"],
            record["student_id"],
            record["date"],
            record["check_in"],
            record["status"],
            record.get("confidence", "N/A"),
        ])

    output.seek(0)
    filename = f"attendance_{date_from}_{date_to}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/weekly")
async def get_weekly_stats():
    """Get attendance stats for the last 7 days (for dashboard chart)."""
    supabase = get_supabase()
    from datetime import timedelta

    today = date.today()
    week_ago = today - timedelta(days=6)

    result = (
        supabase.table("attendance")
        .select("date, status")
        .gte("date", week_ago.isoformat())
        .lte("date", today.isoformat())
        .execute()
    )

    # Aggregate by date
    daily_stats = {}
    for i in range(7):
        d = (week_ago + timedelta(days=i)).isoformat()
        daily_stats[d] = {"date": d, "present": 0, "late": 0, "absent": 0}

    for record in result.data:
        d = record["date"]
        if d in daily_stats:
            status = record["status"]
            if status in daily_stats[d]:
                daily_stats[d][status] += 1

    return list(daily_stats.values())


@router.post("/notify", response_model=NotifyResponse)
async def notify_absentees(payload: NotifyRequest):
    """Send email notifications to absent students via SMTP."""
    success_count, failure_count, errors = send_absence_emails(
        students=payload.students,
        date=payload.date,
        custom_message=payload.message
    )
    
    return NotifyResponse(
        success_count=success_count,
        failure_count=failure_count,
        errors=errors
    )
