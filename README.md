# Smart Attendance System — Face Recognition

An AI-powered attendance system that uses **face recognition** in the browser to automatically mark student attendance. Built with modern free-tier services for zero-cost deployment.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite) ![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)

---

## 🏗️ Architecture

```
Browser (Client)              Render.com (Backend)         Supabase (Database)
┌──────────────────┐         ┌──────────────────┐        ┌──────────────────┐
│  Webcam Feed     │         │  FastAPI REST API │        │  PostgreSQL      │
│  face-api.js     │────────>│  /api/students   │───────>│  students table  │
│  Face Detection  │  HTTP   │  /api/attendance │        │  attendance tbl  │
│  Face Matching   │         │  CSV Export      │        │  settings table  │
│  EmailJS Alerts  │         └──────────────────┘        └──────────────────┘
└──────────────────┘
    Vercel (Frontend)
```

**Key Design:** Face detection runs **entirely in the browser** using `@vladmandic/face-api`. The backend only receives match results (name + confidence), never raw images.

---

## ✨ Features

- **🔍 Real-time Face Detection** — Webcam-based face detection using TinyFaceDetector
- **📝 Auto Attendance** — Automatically marks attendance when a face is recognized
- **👤 Student Registration** — Upload 1-3 photos to register face descriptors
- **📊 Admin Dashboard** — Stats cards, weekly chart, today's check-ins, absent alerts
- **📋 Reports** — Filter by date, status; search by name/ID; sortable table
- **📥 CSV Export** — Download attendance records as CSV
- **📧 Email Alerts** — Send absent notifications via EmailJS (client-side)
- **🌙 Premium Dark UI** — Glassmorphism design with smooth animations

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+ and pip
- **Supabase** account (free tier): https://supabase.com

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd smart-attendance
```

### 2. Setup Supabase Database

1. Go to [supabase.com](https://supabase.com) → Create New Project
2. Go to **SQL Editor** → New Query
3. Paste and run the contents of `database/schema.sql`
4. Go to **Settings** → **API** → Copy your:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Service Role Key** (under "service_role" — keep this secret!)

### 3. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your Supabase credentials

# Start server
uvicorn app.main:app --reload --port 8000
```

Backend will be at: http://localhost:8000
Swagger docs at: http://localhost:8000/docs

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Download face-api.js models (~6MB)
node scripts/download-models.js

# Configure environment
copy .env.example .env
# Edit .env with your API URL

# Start dev server
npm run dev
```

Frontend will be at: http://localhost:5173

---

## 🌐 Deployment (Free Tier)

### Deploy Backend → Render.com

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
5. Add Environment Variables:
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_KEY` = your service_role key
   - `FRONTEND_URL` = your Vercel frontend URL (add after deploying frontend)

### Deploy Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → Import Project
2. Select your GitHub repo
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variables:
   - `VITE_API_URL` = your Render.com backend URL
   - `VITE_EMAILJS_SERVICE_ID` = your EmailJS service ID
   - `VITE_EMAILJS_TEMPLATE_ID` = your EmailJS template ID
   - `VITE_EMAILJS_PUBLIC_KEY` = your EmailJS public key

### Setup EmailJS (Optional)

1. Go to [emailjs.com](https://emailjs.com) → Create account
2. **Email Services** → Add New Service (e.g., Gmail)
3. **Email Templates** → Create template with variables:
   - `{{student_name}}` — Student's name
   - `{{student_id}}` — Student ID
   - `{{absence_date}}` — Date of absence
   - `{{custom_message}}` — Alert message
   - `{{to_email}}` — Recipient email
4. Copy Service ID, Template ID, and Public Key to your `.env`

---

## 📁 Project Structure

```
smart-attendance/
├── frontend/                      # React + Vite (Vercel)
│   ├── public/models/             # face-api.js model weights
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── Layout.jsx         # Sidebar navigation
│   │   │   ├── WebcamCapture.jsx  # Webcam + face detection
│   │   │   ├── FaceRegistration.jsx
│   │   │   ├── AttendanceTable.jsx
│   │   │   ├── StatsCards.jsx
│   │   │   └── AbsentAlert.jsx
│   │   ├── pages/                 # Route pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Attendance.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Reports.jsx
│   │   ├── services/              # API & external services
│   │   │   ├── api.js
│   │   │   ├── faceDetection.js
│   │   │   └── emailService.js
│   │   └── hooks/                 # Custom React hooks
│   ├── scripts/
│   │   └── download-models.js
│   └── vercel.json
├── backend/                       # FastAPI (Render.com)
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── routers/
│   │   ├── schemas/
│   │   └── services/
│   ├── requirements.txt
│   └── render.yaml
├── database/
│   └── schema.sql                 # Supabase SQL schema
└── README.md
```

---

## 🔧 API Endpoints

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List all students |
| GET | `/api/students/descriptors` | Get face descriptors for matching |
| POST | `/api/students` | Register new student |
| PUT | `/api/students/{id}` | Update student |
| DELETE | `/api/students/{id}` | Delete student |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance` | Mark attendance |
| GET | `/api/attendance` | Get records (with filters) |
| GET | `/api/attendance/today` | Today's records |
| GET | `/api/attendance/summary` | Dashboard stats |
| GET | `/api/attendance/absentees` | Absent students |
| GET | `/api/attendance/weekly` | Weekly chart data |
| GET | `/api/attendance/export` | CSV download |

---

## ⚠️ Free Tier Limits

| Service | Limit | Impact |
|---------|-------|--------|
| **Render.com** | Sleeps after 15 min inactivity | First request after sleep takes ~30s |
| **Supabase** | 500MB database, 1GB storage | Sufficient for thousands of students |
| **EmailJS** | 200 emails/month | Fine for small classes |
| **Vercel** | 100GB bandwidth/month | Models (~6MB) served per first visit |

---

## 📝 License

MIT License — Free to use, modify, and distribute.
