/**
 * FaceRegistration — Register new students by uploading face photos.
 */
import { useState, useRef, useEffect } from 'react';
import { loadModels, extractDescriptorFromFile, areModelsLoaded } from '../services/faceDetection';
import { studentAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function FaceRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    student_id: '',
    email: '',
  });
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [extractionStatus, setExtractionStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function init() {
      const loaded = await loadModels();
      setModelsReady(loaded);
    }
    init();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 1);
    setPhotos(files);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return newPreviews;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.student_id) {
      toast.error('Please fill in name and student ID');
      return;
    }

    if (photos.length === 0) {
      toast.error('Please upload at least one face photo');
      return;
    }

    if (!modelsReady) {
      toast.error('Face detection models not loaded yet');
      return;
    }

    setLoading(true);
    setExtractionStatus('Extracting face features...');

    try {
      // Extract descriptors from each photo
      const descriptors = [];
      for (let i = 0; i < photos.length; i++) {
        setExtractionStatus(`Processing photo ${i + 1} of ${photos.length}...`);
        const descriptor = await extractDescriptorFromFile(photos[i]);
        if (descriptor) {
          descriptors.push(Array.from(descriptor));
        }
      }

      if (descriptors.length === 0) {
        toast.error('No face detected in any of the photos. Please try different photos.');
        setLoading(false);
        setExtractionStatus('');
        return;
      }

      // Average the descriptors for better accuracy
      setExtractionStatus('Computing face signature...');
      const avgDescriptor = descriptors[0].map((_, i) => {
        const sum = descriptors.reduce((acc, d) => acc + d[i], 0);
        return sum / descriptors.length;
      });

      // Register student via API
      setExtractionStatus('Registering student...');
      await studentAPI.create({
        name: formData.name,
        student_id: formData.student_id,
        email: formData.email || null,
        face_descriptor: avgDescriptor,
      });

      toast.success(`✅ ${formData.name} registered successfully!`, {
        style: {
          background: '#0f1629',
          color: '#f1f5f9',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        },
      });

      // Reset form
      setFormData({ name: '', student_id: '', email: '' });
      setPhotos([]);
      setPreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
      setExtractionStatus('');
    }
  };

  return (
    <div className="registration-section">
      <div className="registration-form glass-card-static p-6">
        <h3 className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Student Information
        </h3>

        <form onSubmit={handleSubmit} className="reg-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name *</label>
              <input
                id="reg-name"
                className="form-input"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-student-id">Student ID *</label>
              <input
                id="reg-student-id"
                className="form-input"
                type="text"
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                placeholder="e.g. STU001"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email (for absent alerts)</label>
            <input
              id="reg-email"
              className="form-input"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. student@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Face Photo (1 photo) *</label>
            <div
              className="photo-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
                id="reg-photos"
              />
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p>Click to upload a face photo</p>
              <span>Upload 1 clear, front-facing photo for best accuracy</span>
            </div>
          </div>

          {/* Photo Previews */}
          {previews.length > 0 && (
            <div className="photo-previews">
              {previews.map((url, i) => (
                <div key={i} className="preview-item">
                  <img src={url} alt={`Face photo ${i + 1}`} />
                  <span>Photo {i + 1}</span>
                </div>
              ))}
            </div>
          )}

          {/* Extraction Status */}
          {extractionStatus && (
            <div className="extraction-status">
              <div className="loading-spinner small" />
              <span>{extractionStatus}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading || !modelsReady}
            id="register-submit-btn"
          >
            {loading ? 'Processing...' : '🔐 Register Student'}
          </button>
        </form>
      </div>

      {/* Instructions Panel */}
      <div className="instructions-panel glass-card-static p-6">
        <h3 className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Tips for Best Results
        </h3>
        <ul className="tips-list">
          <li>
            <span className="tip-icon">📸</span>
            <div>
              <strong>Clear, well-lit photos</strong>
              <p>Ensure good lighting and a clear view of the face</p>
            </div>
          </li>
          <li>
            <span className="tip-icon">👤</span>
            <div>
              <strong>Front-facing</strong>
              <p>Photos should show the full face from the front</p>
            </div>
          </li>

          <li>
            <span className="tip-icon">🚫</span>
            <div>
              <strong>Avoid obstructions</strong>
              <p>No sunglasses, masks, or heavy shadows on the face</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
