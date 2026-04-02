/**
 * AbsentAlert — Send email alerts to absent students via EmailJS.
 */
import { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AbsentAlert() {
  const [absentees, setAbsentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState({});
  const [sendingAll, setSendingAll] = useState(false);

  useEffect(() => {
    fetchAbsentees();
  }, []);

  const fetchAbsentees = async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getAbsentees();
      setAbsentees(res.data);
    } catch (err) {
      toast.error('Failed to load absentees');
    }
    setLoading(false);
  };

  const handleSendAlert = async (student) => {
    if (!student.email) {
      toast.error(`No email registered for ${student.name}`);
      return;
    }

    setSending((prev) => ({ ...prev, [student.id]: true }));
    try {
      const today = new Date().toLocaleDateString();
      await attendanceAPI.notifyAbsentees({
        students: [student],
        date: today
      });
      
      toast.success(`Email sent to ${student.name}`, {
        style: {
          background: '#0f1629',
          color: '#f1f5f9',
          border: '1px solid rgba(0, 230, 118, 0.3)',
        },
      });
    } catch (err) {
      toast.error(`Failed to send email to ${student.name}: ${err.message}`);
    }
    setSending((prev) => ({ ...prev, [student.id]: false }));
  };

  const handleSendAll = async () => {
    const withEmail = absentees.filter((s) => s.email);
    if (withEmail.length === 0) {
      toast.error('No absentees have registered emails');
      return;
    }

    setSendingAll(true);
    const today = new Date().toLocaleDateString();
    
    try {
      const res = await attendanceAPI.notifyAbsentees({
        students: withEmail,
        date: today
      });

      const success = res.data.success_count;
      const failed = res.data.failure_count;

      if (success > 0) toast.success(`Sent ${success} alert(s) successfully`);
      if (failed > 0) toast.error(`Failed to send ${failed} alert(s)`);
    } catch (err) {
      toast.error('Bulk email sending failed');
    }

    setSendingAll(false);
  };

  return (
    <div className="absent-alert-section glass-card-static p-6">
      <div className="alert-header">
        <h3 className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Absent Alerts
        </h3>

        <button
          className="btn btn-primary"
          onClick={handleSendAll}
          disabled={sendingAll || absentees.length === 0}
          id="send-all-alerts-btn"
        >
          {sendingAll ? 'Sending...' : `📧 Send All (${absentees.filter((s) => s.email).length})`}
        </button>
      </div>

      {loading ? (
        <div className="absent-loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '56px', marginBottom: '8px' }} />
          ))}
        </div>
      ) : absentees.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p>Everyone is present today! 🎉</p>
          <span>No absent alerts needed</span>
        </div>
      ) : (
        <ul className="absentee-list">
          {absentees.map((student) => (
            <li key={student.id} className="absentee-item">
              <div className="absentee-avatar absent-avatar">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div className="absentee-info">
                <span className="absentee-name">{student.name}</span>
                <span className="absentee-id">{student.student_id}</span>
                {student.email && (
                  <span className="absentee-email">{student.email}</span>
                )}
              </div>
              <div className="absentee-actions">
                {student.email ? (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleSendAlert(student)}
                    disabled={sending[student.id]}
                    id={`send-alert-${student.student_id}`}
                  >
                    {sending[student.id] ? '⏳' : '📧'} Send
                  </button>
                ) : (
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                    No email
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
