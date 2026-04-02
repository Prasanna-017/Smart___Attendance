/**
 * Register page — Student registration with face photo upload.
 */
import { useState, useEffect } from 'react';
import FaceRegistration from '../components/FaceRegistration';
import EditStudentModal from '../components/EditStudentModal';
import { studentAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await studentAPI.getAll();
      setStudents(res.data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
    setLoading(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await studentAPI.delete(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      toast.success(`${name} removed`);
    } catch (err) {
      toast.error('Failed to delete student');
    }
  };

  const handleUpdateStudent = (updatedStudent) => {
    setStudents((prev) => 
      prev.map(s => s.id === updatedStudent.id ? updatedStudent : s)
    );
  };

  return (
    <div className="register-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Register Student</h1>
          <p className="page-subtitle">
            Add new students with face photos for automatic attendance recognition
          </p>
        </div>
        <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
          {students.length} registered student{students.length !== 1 ? 's' : ''}
        </span>
      </div>

      <FaceRegistration />

      {/* Registered Students List */}
      <div className="registered-students glass-card-static p-6 mt-6">
        <h3 className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Registered Students
        </h3>

        {loading ? (
          <div className="students-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: '56px', marginBottom: '8px' }} />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <p>No students registered yet</p>
            <span>Use the form above to register your first student</span>
          </div>
        ) : (
          <div className="students-grid">
            {students.map((student) => (
              <div key={student.id} className="student-card glass-card">
                <div className="student-avatar-lg">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="student-details">
                  <span className="student-name">{student.name}</span>
                  <span className="student-meta">
                    <code>{student.student_id}</code>
                    {student.email && <span> · {student.email}</span>}
                  </span>
                  <span className="student-face-status">
                    {student.face_descriptor ? (
                      <span className="badge badge-present" style={{ fontSize: '0.65rem' }}>Face Enrolled</span>
                    ) : (
                      <span className="badge badge-absent" style={{ fontSize: '0.65rem' }}>No Face Data</span>
                    )}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditingStudent(student)}
                    title="Edit student"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDelete(student.id, student.name)}
                    title="Delete student"
                    id={`delete-student-${student.student_id}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingStudent && (
        <EditStudentModal 
          student={editingStudent} 
          onClose={() => setEditingStudent(null)} 
          onUpdate={handleUpdateStudent} 
        />
      )}
    </div>
  );
}
