import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { attendanceAPI } from '../services/api';

export default function Timetable() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    morning_start: '09:00',
    morning_end: '09:10',
    break_start: '11:00',
    break_end: '11:10',
    lunch_start: '13:00',
    lunch_end: '13:10',
    evening_break_start: '15:00',
    evening_break_end: '15:10',
  });

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const res = await attendanceAPI.getTimetable();
      setConfig(res.data);
    } catch (err) {
      toast.error('Failed to load timetable config');
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await attendanceAPI.updateTimetable(config);
      toast.success('Timetable updated successfully!');
    } catch (err) {
      toast.error('Failed to update timetable');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="timetable-page p-6">
        <h1 className="page-title">Loading Timetable...</h1>
      </div>
    );
  }

  return (
    <div className="timetable-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Timetable</h1>
          <p className="page-subtitle">
            Configure the strict 10-minute windows for multi-session attendance.
          </p>
        </div>
      </div>

      <div className="glass-card-static p-8 mt-6">
        <form onSubmit={handleSave} className="timetable-form">
          {/* Morning Session */}
          <h3 className="section-title mb-4" style={{ color: 'var(--accent-emerald)' }}>🌅 Morning Session</h3>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div className="form-group flex-1">
              <label className="form-label">Check-in Opens At</label>
              <input type="time" name="morning_start" className="form-input" value={config.morning_start} onChange={handleChange} required />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Check-in Closes At</label>
              <input type="time" name="morning_end" className="form-input" value={config.morning_end} onChange={handleChange} required />
            </div>
          </div>

          {/* After Break Session */}
          <h3 className="section-title mb-4" style={{ color: 'var(--accent-amber)' }}>☕ After Break Session</h3>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div className="form-group flex-1">
              <label className="form-label">Check-in Opens At</label>
              <input type="time" name="break_start" className="form-input" value={config.break_start} onChange={handleChange} required />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Check-in Closes At</label>
              <input type="time" name="break_end" className="form-input" value={config.break_end} onChange={handleChange} required />
            </div>
          </div>

          {/* After Lunch Session */}
          <h3 className="section-title mb-4" style={{ color: 'var(--accent-rose)' }}>🍔 After Lunch Session</h3>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div className="form-group flex-1">
              <label className="form-label">Check-in Opens At</label>
              <input type="time" name="lunch_start" className="form-input" value={config.lunch_start} onChange={handleChange} required />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Check-in Closes At</label>
              <input type="time" name="lunch_end" className="form-input" value={config.lunch_end || ''} onChange={handleChange} required />
            </div>
          </div>

          {/* Evening Break Session */}
          <h3 className="section-title mb-4" style={{ color: 'var(--accent-purple, #a855f7)' }}>🫖 Evening Break Session</h3>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div className="form-group flex-1">
              <label className="form-label">Check-in Opens At</label>
              <input type="time" name="evening_break_start" className="form-input" value={config.evening_break_start || ''} onChange={handleChange} required />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Check-in Closes At</label>
              <input type="time" name="evening_break_end" className="form-input" value={config.evening_break_end || ''} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
              <strong>Note:</strong> Students must check in strictly within these time configurations. Any attempt outside these times will be rejected automatically.
            </p>
          </div>

          <button type="submit" className="btn btn-primary mt-6 w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save Timetable Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
}
