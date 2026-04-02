/**
 * Axios instance for FastAPI backend communication.
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Something went wrong';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

// ==================== Student APIs ====================

export const studentAPI = {
  getAll: () => api.get('/api/students'),
  getOne: (id) => api.get(`/api/students/${id}`),
  create: (data) => api.post('/api/students', data),
  update: (id, data) => api.put(`/api/students/${id}`, data),
  delete: (id) => api.delete(`/api/students/${id}`),
  getDescriptors: () => api.get('/api/students/descriptors'),
};

// ==================== Attendance APIs ====================

export const attendanceAPI = {
  markAttendance: (data) => api.post('/api/attendance', data),
  getAll: (params) => api.get('/api/attendance', { params }),
  getToday: () => api.get('/api/attendance/today'),
  getSummary: () => api.get('/api/attendance/summary'),
  getAbsentees: () => api.get('/api/attendance/absentees'),
  getWeeklyStats: () => api.get('/api/attendance/weekly'),
  exportCSV: (dateFrom, dateTo) =>
    api.get('/api/attendance/export', {
      params: { date_from: dateFrom, date_to: dateTo },
      responseType: 'blob',
    }),
  getTimetable: () => api.get('/api/attendance/timetable'),
  updateTimetable: (data) => api.put('/api/attendance/timetable', data),
  notifyAbsentees: (data) => api.post('/api/attendance/notify', data),
};

export default api;
