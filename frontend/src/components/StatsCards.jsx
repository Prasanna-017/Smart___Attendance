/**
 * StatsCards component — Dashboard stat cards with animated counters.
 */
import { useState, useEffect } from 'react';

function AnimatedNumber({ target, duration = 800 }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }
    
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCurrent(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return <span>{current}</span>;
}

const statsConfig = [
  {
    key: 'total_students',
    label: 'Total Students',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: 'blue',
    gradient: 'var(--gradient-blue)',
    glow: 'var(--accent-blue-glow)',
  },
  {
    key: 'present_today',
    label: 'Present Today',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    color: 'emerald',
    gradient: 'var(--gradient-emerald)',
    glow: 'var(--accent-emerald-glow)',
  },
  {
    key: 'absent_today',
    label: 'Absent Today',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    color: 'rose',
    gradient: 'var(--gradient-rose)',
    glow: 'var(--accent-rose-glow)',
  },
  {
    key: 'late_today',
    label: 'Late Today',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    color: 'amber',
    gradient: 'var(--gradient-amber)',
    glow: 'var(--accent-amber-glow)',
  },
];

export default function StatsCards({ summary, loading }) {
  if (loading) {
    return (
      <div className="stats-grid stagger-children">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card glass-card-static">
            <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
            <div>
              <div className="skeleton" style={{ width: '80px', height: '12px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ width: '50px', height: '28px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-grid stagger-children">
      {statsConfig.map((stat) => (
        <div key={stat.key} className={`stat-card glass-card stat-card-${stat.color}`} id={`stat-${stat.key}`}>
          <div className="stat-icon" style={{ background: stat.glow }}>
            {stat.icon}
          </div>
          <div className="stat-info">
            <span className="stat-label">{stat.label}</span>
            <span className="stat-value">
              <AnimatedNumber target={summary?.[stat.key] || 0} />
            </span>
          </div>
          {stat.key === 'present_today' && summary && (
            <div className="stat-badge">
              <span className="attendance-rate">{summary.attendance_rate || 0}%</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
