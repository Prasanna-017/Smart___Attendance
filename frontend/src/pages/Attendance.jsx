/**
 * Attendance page — Live attendance marking with webcam + face detection.
 */
import WebcamCapture from '../components/WebcamCapture';

export default function Attendance() {
  return (
    <div className="attendance-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mark Attendance</h1>
          <p className="page-subtitle">
            Use webcam and face recognition to automatically mark student attendance
          </p>
        </div>
        <div className="attendance-date badge badge-present" style={{ fontSize: '0.875rem', padding: '6px 14px' }}>
          {new Date().toLocaleDateString('en', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </div>

      <WebcamCapture />
    </div>
  );
}
