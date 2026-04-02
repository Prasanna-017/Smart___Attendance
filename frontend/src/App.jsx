import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Register from './pages/Register';
import Reports from './pages/Reports';
import Timetable from './pages/Timetable';
import Welcome from './pages/Welcome';

export default function App() {
  const department = localStorage.getItem('attendance_department');

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0f1629',
            color: '#f1f5f9',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
      {!department ? (
        <Routes>
          <Route path="*" element={<Welcome />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Layout>
      )}
    </BrowserRouter>
  );
}
