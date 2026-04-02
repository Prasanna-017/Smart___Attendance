/**
 * WebcamCapture — Real-time face detection with webcam feed + matching overlay.
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import useWebcam from '../hooks/useWebcam';
import useFaceDetection from '../hooks/useFaceDetection';
import { loadModels, areModelsLoaded } from '../services/faceDetection';
import { studentAPI, attendanceAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function WebcamCapture() {
  const canvasRef = useRef(null);
  const { videoRef, isActive, error: webcamError, startWebcam, stopWebcam, devices, deviceId, setDeviceId } = useWebcam();

  const [modelsReady, setModelsReady] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [knownStudents, setKnownStudents] = useState([]);
  const [markedToday, setMarkedToday] = useState(new Map());
  const [recentActivity, setRecentActivity] = useState([]);

  const { isDetecting, lastMatch, fps, startDetection, stopDetection } =
    useFaceDetection(videoRef, canvasRef, knownStudents);

  // Load models on mount
  useEffect(() => {
    async function init() {
      setModelLoading(true);
      const loaded = await loadModels();
      setModelsReady(loaded);
      setModelLoading(false);
    }
    init();
  }, []);

  // Load known students' face descriptors
  useEffect(() => {
    async function fetchDescriptors() {
      try {
        const res = await studentAPI.getDescriptors();
        setKnownStudents(res.data);
      } catch (err) {
        console.error('Failed to load descriptors:', err);
      }
    }
    fetchDescriptors();

  // fetchTodayAttendance removed to rely entirely on backend session logic
  }, []);

  // Auto-mark attendance when a match is detected
  useEffect(() => {
    if (!lastMatch) return;

    const studentId = lastMatch.student.id;
    const now = Date.now();
    const lastTime = markedToday.get(studentId) || 0;
    
    // Prevent API spam: Wait at least 15 minutes (900000ms) before trying to mark the same student again.
    // This allows them to mark Morning, and then Break (which is > 15m apart), without spamming API every frame.
    if (now - lastTime < 900000) return; 

    // Mark attendance
    const markAttendance = async () => {
      // Temporarily set immediately to prevent concurrent spam
      setMarkedToday((prev) => new Map(prev).set(studentId, now));
      
      try {
        await attendanceAPI.markAttendance({
          student_uuid: lastMatch.student.id,
          student_name: lastMatch.student.name,
          student_id: lastMatch.student.student_id,
          confidence: lastMatch.confidence,
        });

        setRecentActivity((prev) => [
          {
            name: lastMatch.student.name,
            time: new Date().toLocaleTimeString(),
            confidence: Math.round(lastMatch.confidence * 100),
          },
          ...prev.slice(0, 9),
        ]);

        toast.success(`✅ ${lastMatch.student.name} marked present!`, {
          duration: 3000,
          style: {
            background: '#0f1629',
            color: '#f1f5f9',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          },
          iconTheme: {
            primary: '#10b981',
            secondary: '#0f1629',
          },
        });
      } catch (err) {
        const msg = err.response?.data?.detail || 'Failed to mark attendance';
        if (!msg.includes('already marked')) {
          if (msg.toLowerCase().includes('closed')) {
            toast.error(msg, { id: 'attendance-closed' });
            // Throttle retries heavily for "closed" state to prevent spamming the API and UI
            setTimeout(() => {
              setMarkedToday((prev) => {
                const newMap = new Map(prev);
                newMap.delete(studentId);
                return newMap;
              });
            }, 10000);
          } else {
            toast.error(msg);
            // If it failed for another reason, remove the throttle so they can try again immediately
            setMarkedToday((prev) => {
              const newMap = new Map(prev);
              newMap.delete(studentId);
              return newMap;
            });
          }
        }
      }
    };

    markAttendance();
  }, [lastMatch, markedToday]);

  const handleToggleCamera = useCallback(() => {
    if (isActive) {
      stopDetection();
      stopWebcam();
    } else {
      startWebcam();
    }
  }, [isActive, startWebcam, stopWebcam, stopDetection]);

  const handleToggleDetection = useCallback(() => {
    if (isDetecting) {
      stopDetection();
    } else {
      startDetection();
    }
  }, [isDetecting, startDetection, stopDetection]);

  return (
    <div className="webcam-section">
      {/* Webcam Feed */}
      <div className="webcam-container glass-card-static">
        <div className="webcam-header">
          <div className="webcam-status">
            <div className={`status-dot ${isActive ? (isDetecting ? 'status-detecting' : 'status-active') : 'status-inactive'}`} />
            <span>
              {!isActive ? 'Camera Off' : isDetecting ? 'Detecting Faces...' : 'Camera Active'}
            </span>
          </div>
          {isDetecting && <span className="fps-counter">{fps} FPS</span>}
        </div>

        <div className="webcam-feed">
          <video
            ref={videoRef}
            width="640"
            height="480"
            muted
            playsInline
            className={isActive ? 'visible' : 'hidden'}
          />
          <canvas
            ref={canvasRef}
            width="640"
            height="480"
            className="webcam-overlay"
          />

          {!isActive && (
            <div className="webcam-placeholder">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <p>Click "Start Camera" to begin</p>
              {webcamError && <p className="error-text">{webcamError}</p>}
            </div>
          )}

          {/* Scan line animation */}
          {isDetecting && <div className="scan-line" />}
        </div>

        <div className="webcam-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          {!isActive && devices.length > 0 && (
            <select 
              className="form-input" 
              style={{ width: 'auto', maxWidth: '200px', margin: 0 }}
              value={deviceId} 
              onChange={(e) => setDeviceId(e.target.value)}
            >
              {devices.map((device, idx) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          )}

          <button
            className={`btn ${isActive ? 'btn-danger' : 'btn-primary'} btn-lg`}
            onClick={handleToggleCamera}
            disabled={modelLoading}
            id="toggle-camera-btn"
          >
            {isActive ? '⏹ Stop Camera' : '📷 Start Camera'}
          </button>

          {isActive && (
            <button
              className={`btn ${isDetecting ? 'btn-ghost' : 'btn-success'} btn-lg`}
              onClick={handleToggleDetection}
              disabled={!modelsReady}
              id="toggle-detection-btn"
            >
              {isDetecting ? '⏸ Pause Detection' : '▶ Start Detection'}
            </button>
          )}
        </div>

        {modelLoading && (
          <div className="model-loading">
            <div className="loading-spinner" />
            <span>Loading AI models...</span>
          </div>
        )}
        
        {!modelsReady && !modelLoading && (
          <div className="model-error">
            <span>⚠️ Face detection models not found. Make sure model files are in <code>/public/models/</code></span>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="activity-panel glass-card-static">
        <h3 className="panel-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Recent Activity
        </h3>

        {recentActivity.length === 0 ? (
          <div className="empty-state">
            <p>No attendance marked yet today</p>
            <span>Start camera & detection to begin</span>
          </div>
        ) : (
          <ul className="activity-list">
            {recentActivity.map((activity, i) => (
              <li key={i} className="activity-item animate-slide-in">
                <div className="activity-avatar">
                  {activity.name.charAt(0).toUpperCase()}
                </div>
                <div className="activity-details">
                  <span className="activity-name">{activity.name}</span>
                  <span className="activity-time">{activity.time}</span>
                </div>
                <span className="badge badge-present">{activity.confidence}%</span>
              </li>
            ))}
          </ul>
        )}

        <div className="activity-stats">
          <span>Known Faces: {knownStudents.length}</span>
          <span>Marked Today: {markedToday.size}</span>
        </div>
      </div>
    </div>
  );
}
