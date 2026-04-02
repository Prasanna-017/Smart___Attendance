import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { studentAPI } from '../services/api';

export default function EditStudentModal({ student, onClose, onUpdate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setName(student.name || '');
      setEmail(student.email || '');
    }
  }, [student]);

  if (!student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const payload = {
        name: name.trim() || undefined,
        email: email.trim() || undefined,
      };
      
      const res = await studentAPI.update(student.id, payload);
      toast.success('Student details updated successfully');
      onUpdate(res.data); // Return updated student details
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update student details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="glass-card p-6" style={{
        width: '100%',
        maxWidth: '400px',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-family-heading)' }}>Edit Student</h2>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.25rem' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-group">
          <div className="form-group mb-4">
            <label className="form-label">Student ID (Cannot be changed)</label>
            <input
              type="text"
              className="form-input"
              value={student.student_id}
              disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group mb-6">
            <label className="form-label">Email Address (Optional)</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
