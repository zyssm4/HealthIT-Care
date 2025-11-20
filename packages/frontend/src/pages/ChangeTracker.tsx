import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChangeRequest, ChangeRequestStats } from '@healthit-care/shared';

type Priority = 'low' | 'medium' | 'high' | 'critical';
type Status = 'new' | 'analysis' | 'approved' | 'in-progress' | 'testing' | 'deployed' | 'closed';

const ChangeTracker: React.FC = () => {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [stats, setStats] = useState<ChangeRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ status: '', priority: '' });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requestor: '',
    priority: 'medium' as Priority,
    affectedSystems: '',
    affectedInterfaces: '',
    estimatedEffort: '',
    targetDate: '',
  });

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.priority) params.append('priority', filter.priority);

      const [requestsRes, statsRes] = await Promise.all([
        fetch(`/api/v1/changes?${params}`),
        fetch('/api/v1/changes/stats'),
      ]);

      const requestsData = await requestsRes.json();
      const statsData = await statsRes.json();

      if (requestsData.success) setRequests(requestsData.data);
      if (statsData.success) setStats(statsData.data);
    } catch (err) {
      setError('Failed to load change requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      const response = await fetch('/api/v1/changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          affectedSystems: formData.affectedSystems.split(',').map(s => s.trim()).filter(Boolean),
          affectedInterfaces: formData.affectedInterfaces.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowForm(false);
        setFormData({
          title: '',
          description: '',
          requestor: '',
          priority: 'medium',
          affectedSystems: '',
          affectedInterfaces: '',
          estimatedEffort: '',
          targetDate: '',
        });
        loadData();
      } else {
        throw new Error(data.error?.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create change request');
    }
  };

  const handleStatusChange = async (id: string, status: Status) => {
    try {
      const response = await fetch(`/api/v1/changes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (data.success) {
        loadData();
        if (selectedRequest?.id === id) {
          setSelectedRequest(data.data);
        }
      }
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#6b7280';
      case 'analysis': return '#8b5cf6';
      case 'approved': return '#3b82f6';
      case 'in-progress': return '#f59e0b';
      case 'testing': return '#ec4899';
      case 'deployed': return '#10b981';
      case 'closed': return '#374151';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="back-link">← Back to Dashboard</Link>
        <h1>Change Request Tracker</h1>
        <p>Track and manage interface change requests</p>
      </header>

      <div className="container">
        {/* Left Panel - List */}
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Change Requests</h2>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + New Request
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="result-section" style={{ marginBottom: '1rem' }}>
              <div className="metadata">
                <div className="metadata-item">
                  <div className="value">{stats.total}</div>
                  <div className="label">Total</div>
                </div>
                <div className="metadata-item">
                  <div className="value">{stats.byStatus['in-progress'] || 0}</div>
                  <div className="label">In Progress</div>
                </div>
                <div className="metadata-item">
                  <div className="value">{stats.byPriority['critical'] || 0}</div>
                  <div className="label">Critical</div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="form-row" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Status:</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="">All</option>
                <option value="new">New</option>
                <option value="analysis">Analysis</option>
                <option value="approved">Approved</option>
                <option value="in-progress">In Progress</option>
                <option value="testing">Testing</option>
                <option value="deployed">Deployed</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority:</label>
              <select
                value={filter.priority}
                onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
              >
                <option value="">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Request List */}
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {requests.map(req => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`request-item ${selectedRequest?.id === req.id ? 'selected' : ''}`}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    background: selectedRequest?.id === req.id ? 'var(--primary-light)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <strong style={{ fontSize: '0.875rem' }}>{req.title}</strong>
                    <span style={{
                      fontSize: '0.5rem',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '4px',
                      background: getPriorityColor(req.priority),
                      color: 'white',
                    }}>
                      {req.priority}
                    </span>
                  </div>
                  <div style={{ marginTop: '0.25rem' }}>
                    <span style={{
                      fontSize: '0.625rem',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '4px',
                      background: getStatusColor(req.status),
                      color: 'white',
                    }}>
                      {req.status}
                    </span>
                    <span style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                      {req.requestor}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <div className="error">{error}</div>}
        </div>

        {/* Right Panel - Details or Form */}
        <div className="panel">
          {showForm ? (
            <>
              <h2>New Change Request</h2>
              <div className="form-section">
                <div className="form-group">
                  <label>Title:</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief title for the change"
                  />
                </div>

                <div className="form-group">
                  <label>Description:</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed description of the change"
                    style={{ minHeight: '80px' }}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Requestor:</label>
                    <input
                      type="text"
                      value={formData.requestor}
                      onChange={(e) => setFormData({ ...formData, requestor: e.target.value })}
                      placeholder="Name or department"
                    />
                  </div>

                  <div className="form-group">
                    <label>Priority:</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Affected Systems (comma-separated):</label>
                  <input
                    type="text"
                    value={formData.affectedSystems}
                    onChange={(e) => setFormData({ ...formData, affectedSystems: e.target.value })}
                    placeholder="e.g., EHR, Lab System, PACS"
                  />
                </div>

                <div className="form-group">
                  <label>Affected Interfaces (comma-separated):</label>
                  <input
                    type="text"
                    value={formData.affectedInterfaces}
                    onChange={(e) => setFormData({ ...formData, affectedInterfaces: e.target.value })}
                    placeholder="e.g., ADT_OUT_01, LAB_IN_01"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Estimated Effort:</label>
                    <input
                      type="text"
                      value={formData.estimatedEffort}
                      onChange={(e) => setFormData({ ...formData, estimatedEffort: e.target.value })}
                      placeholder="e.g., 40 hours"
                    />
                  </div>

                  <div className="form-group">
                    <label>Target Date:</label>
                    <input
                      type="date"
                      value={formData.targetDate}
                      onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={handleCreate}>
                  Create Request
                </button>
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </>
          ) : selectedRequest ? (
            <>
              <h2>{selectedRequest.title}</h2>

              <div className="result-section">
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    background: getPriorityColor(selectedRequest.priority),
                    color: 'white',
                    marginRight: '0.5rem',
                  }}>
                    {selectedRequest.priority}
                  </span>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    background: getStatusColor(selectedRequest.status),
                    color: 'white',
                  }}>
                    {selectedRequest.status}
                  </span>
                </div>

                <p style={{ marginBottom: '1rem' }}>{selectedRequest.description}</p>

                <table style={{ width: '100%', fontSize: '0.75rem' }}>
                  <tbody>
                    <tr>
                      <td><strong>Requestor</strong></td>
                      <td>{selectedRequest.requestor}</td>
                    </tr>
                    <tr>
                      <td><strong>Affected Systems</strong></td>
                      <td>{selectedRequest.affectedSystems.join(', ')}</td>
                    </tr>
                    <tr>
                      <td><strong>Affected Interfaces</strong></td>
                      <td>{selectedRequest.affectedInterfaces.join(', ') || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td><strong>Estimated Effort</strong></td>
                      <td>{selectedRequest.estimatedEffort || 'TBD'}</td>
                    </tr>
                    <tr>
                      <td><strong>Target Date</strong></td>
                      <td>{selectedRequest.targetDate || 'TBD'}</td>
                    </tr>
                    <tr>
                      <td><strong>Created</strong></td>
                      <td>{new Date(selectedRequest.createdAt).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td><strong>Updated</strong></td>
                      <td>{new Date(selectedRequest.updatedAt).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Status Actions */}
              <div className="form-section">
                <h3>Update Status</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['new', 'analysis', 'approved', 'in-progress', 'testing', 'deployed', 'closed'].map(status => (
                    <button
                      key={status}
                      className={`btn ${selectedRequest.status === status ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleStatusChange(selectedRequest.id, status as Status)}
                      style={{ fontSize: '0.625rem', padding: '0.25rem 0.5rem' }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.notes.length > 0 && (
                <div className="form-section">
                  <h3>Activity Log</h3>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {selectedRequest.notes.map((note, idx) => (
                      <div key={idx} style={{
                        padding: '0.5rem',
                        borderBottom: '1px solid var(--border-color)',
                        fontSize: '0.75rem',
                      }}>
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              Select a change request to view details
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeTracker;
