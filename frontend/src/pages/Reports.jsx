/**
 * Reports page — View, filter, and export attendance records.
 */
import { useState, useEffect } from 'react';
import AttendanceTable from '../components/AttendanceTable';
import { attendanceAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Reports() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    // Default: last 7 days
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    setDateFrom(weekAgo.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchRecords();
    }
  }, [dateFrom, dateTo]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getAll({
        date_from: dateFrom,
        date_to: dateTo,
        limit: 500,
      });
      setRecords(res.data);
    } catch (err) {
      toast.error('Failed to load attendance records');
    }
    setLoading(false);
  };

  const handleExport = async () => {
    if (!dateFrom || !dateTo) {
      toast.error('Please select date range');
      return;
    }

    try {
      const res = await attendanceAPI.exportCSV(dateFrom, dateTo);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${dateFrom}_${dateTo}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded!');
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Reports</h1>
          <p className="page-subtitle">
            View, filter, and export attendance records
          </p>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="date-filters glass-card-static p-4">
        <div className="filter-row">
          <div className="form-group">
            <label className="form-label" htmlFor="date-from">From</label>
            <input
              id="date-from"
              className="form-input"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="date-to">To</label>
            <input
              id="date-to"
              className="form-input"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={fetchRecords} id="apply-filter-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Apply
          </button>
        </div>
      </div>

      {/* Summary Stats for selected date range */}
      {!loading && records.length > 0 && (
        <div className="report-summary">
          <div className="summary-chip">
            <span className="chip-label">Total Records</span>
            <span className="chip-value">{records.length}</span>
          </div>
          <div className="summary-chip present-chip">
            <span className="chip-label">Present</span>
            <span className="chip-value">{records.filter((r) => r.status === 'present').length}</span>
          </div>
          <div className="summary-chip late-chip">
            <span className="chip-label">Late</span>
            <span className="chip-value">{records.filter((r) => r.status === 'late').length}</span>
          </div>
          <div className="summary-chip absent-chip">
            <span className="chip-label">Absent</span>
            <span className="chip-value">{records.filter((r) => r.status === 'absent').length}</span>
          </div>
        </div>
      )}

      <AttendanceTable records={records} loading={loading} onExport={handleExport} />
    </div>
  );
}
