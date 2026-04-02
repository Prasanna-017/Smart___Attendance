import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Welcome() {
  const [department, setDepartment] = useState('');
  const navigate = useNavigate();

  const handleContinue = (e) => {
    e.preventDefault();
    if (!department.trim()) {
      toast.error('Please enter your department name');
      return;
    }
    
    // Save to localStorage
    localStorage.setItem('attendance_department', department.trim());
    toast.success(`Welcome to ${department.trim()} Dashboard`);
    
    // Navigate to dashboard
    navigate('/');
    
    // Force a reload so App.jsx picks up the change if needed,
    // or just let routing handle it normally.
    window.location.reload();
  };

  return (
    <div className="welcome-page" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="glass-card-static p-8" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--accent-blue)' }}>Smart</span> Attendance
          </h1>
          <p className="text-secondary">AI-Powered Face Recognition System</p>
        </div>

        <form onSubmit={handleContinue} className="form-group" style={{ textAlign: 'left' }}>
          <label className="form-label">Department / Class Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Computer Science CS-101"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            autoFocus
          />
          <button 
            type="submit" 
            className="btn btn-primary btn-lg mt-4 w-full"
            style={{ justifyContent: 'center' }}
          >
            Get Started
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </form>
        
        <div className="mt-6 text-muted" style={{ fontSize: '0.875rem' }}>
          This will be set as your global workspace. You can change it later in the settings or header.
        </div>
      </div>
    </div>
  );
}
