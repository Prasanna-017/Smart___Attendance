/**
 * Dashboard page — Stats overview, weekly chart, and recent activity.
 */
import { useState, useEffect, useRef } from 'react';
import StatsCards from '../components/StatsCards';
import AbsentAlert from '../components/AbsentAlert';
import { attendanceAPI } from '../services/api';

function WeeklyChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const maxVal = Math.max(...data.map((d) => d.present + d.late + d.absent), 1);
    const barGroupWidth = chartWidth / data.length;
    const barWidth = Math.min(barGroupWidth * 0.2, 16);
    const gap = 3;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Draw bars
    data.forEach((day, i) => {
      const x = padding.left + i * barGroupWidth + barGroupWidth / 2;

      // Present bar
      const presentH = (day.present / maxVal) * chartHeight;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(x - barWidth - gap, padding.top + chartHeight - presentH, barWidth, presentH, [3, 3, 0, 0]);
      ctx.fill();

      // Late bar
      const lateH = (day.late / maxVal) * chartHeight;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(x, padding.top + chartHeight - lateH, barWidth, lateH, [3, 3, 0, 0]);
      ctx.fill();

      // Absent bar
      const absentH = (day.absent / maxVal) * chartHeight;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.roundRect(x + barWidth + gap, padding.top + chartHeight - absentH, barWidth, absentH, [3, 3, 0, 0]);
      ctx.fill();

      // Day label
      ctx.fillStyle = '#64748b';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      const dayName = new Date(day.date).toLocaleDateString('en', { weekday: 'short' });
      ctx.fillText(dayName, x, height - 10);
    });
  }, [data]);

  return (
    <div className="chart-container glass-card-static p-6">
      <div className="chart-header">
        <h3 className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Weekly Overview
        </h3>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }} /> Present</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#f59e0b' }} /> Late</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#f43f5e' }} /> Absent</span>
        </div>
      </div>
      <canvas ref={canvasRef} className="weekly-chart" />
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [todayRecords, setTodayRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, weeklyRes, todayRes] = await Promise.all([
        attendanceAPI.getSummary(),
        attendanceAPI.getWeeklyStats(),
        attendanceAPI.getToday(),
      ]);
      setSummary(summaryRes.data);
      setWeeklyData(weeklyRes.data);
      setTodayRecords(todayRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={fetchDashboardData} id="refresh-dashboard-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      <StatsCards summary={summary} loading={loading} />

      <div className="dashboard-grid">
        <WeeklyChart data={weeklyData} />
        <AbsentAlert />
      </div>

      {/* Today's Recent Activity */}
      <div className="today-section glass-card-static p-6">
        <h3 className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          Today's Check-ins
        </h3>

        {todayRecords.length === 0 ? (
          <div className="empty-state">
            <p>No check-ins recorded today yet</p>
          </div>
        ) : (
          <div className="today-grid">
            {todayRecords.slice(0, 12).map((record) => (
              <div key={record.id} className="today-card">
                <div className={`today-avatar ${record.status === 'late' ? 'late-avatar' : ''}`}>
                  {record.student_name.charAt(0).toUpperCase()}
                </div>
                <span className="today-name">{record.student_name}</span>
                <span className="today-time">{new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className={`badge badge-${record.status}`}>{record.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
