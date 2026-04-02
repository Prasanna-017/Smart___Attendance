/**
 * AttendanceTable — Sortable, filterable data table with CSV export.
 */
import { useState, useMemo } from 'react';

export default function AttendanceTable({ records, loading, onExport }) {
  const [sortField, setSortField] = useState('check_in');
  const [sortDir, setSortDir] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let data = [...(records || [])];

    // Filter by status
    if (filterStatus !== 'all') {
      data = data.filter((r) => r.status === filterStatus);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (r) =>
          r.student_name.toLowerCase().includes(q) ||
          r.student_id.toLowerCase().includes(q)
      );
    }

    // Sort
    data.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [records, filterStatus, searchQuery, sortField, sortDir]);

  const SortIcon = ({ field }) => (
    <span className={`sort-icon ${sortField === field ? 'active' : ''}`}>
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  if (loading) {
    return (
      <div className="table-container glass-card-static">
        <div className="table-loading">
          <div className="loading-spinner" />
          <span>Loading attendance records...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container glass-card-static">
      <div className="table-toolbar">
        <div className="table-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="form-input"
            type="text"
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="attendance-search"
          />
        </div>

        <div className="table-filters">
          <select
            className="form-input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            id="status-filter"
          >
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
          </select>

          {onExport && (
            <button className="btn btn-ghost" onClick={onExport} id="export-csv-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table" id="attendance-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('student_name')} style={{ cursor: 'pointer' }}>
                Student Name <SortIcon field="student_name" />
              </th>
              <th onClick={() => handleSort('student_id')} style={{ cursor: 'pointer' }}>
                ID <SortIcon field="student_id" />
              </th>
              <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                Date <SortIcon field="date" />
              </th>
              <th onClick={() => handleSort('check_in')} style={{ cursor: 'pointer' }}>
                Check-In <SortIcon field="check_in" />
              </th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                Status <SortIcon field="status" />
              </th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-muted" style={{ padding: '2rem' }}>
                  No attendance records found
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="student-cell">
                      <div className="student-avatar-sm">
                        {record.student_name.charAt(0).toUpperCase()}
                      </div>
                      <span>{record.student_name}</span>
                    </div>
                  </td>
                  <td><code>{record.student_id}</code></td>
                  <td>{record.date}</td>
                  <td>{new Date(record.check_in).toLocaleTimeString()}</td>
                  <td>
                    <span className={`badge badge-${record.status}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>
                    {record.confidence
                      ? `${Math.round(record.confidence * 100)}%`
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span className="text-muted">
          Showing {filteredAndSorted.length} of {records?.length || 0} records
        </span>
      </div>
    </div>
  );
}
