import { useState } from 'react';
import { LogAnalysisResponse, LogSource } from '@healthit-care/shared';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.startsWith('http') ? import.meta.env.VITE_API_URL : `https://${import.meta.env.VITE_API_URL}`}/api/v1`
  : '/api/v1';

export default function AuditLogAnalyzer() {
  const [logs, setLogs] = useState('');
  const [source, setSource] = useState<LogSource>('cloverleaf');
  const [filterLevel, setFilterLevel] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<'hour' | 'day'>('hour');
  const [result, setResult] = useState<LogAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'entries' | 'patterns' | 'report'>('summary');

  const loadSample = async () => {
    try {
      const response = await fetch(`${API_BASE}/logs/sample`);
      const data = await response.json();
      if (data.success) {
        setLogs(data.data.logs);
      }
    } catch (err) {
      setError('Failed to load sample');
    }
  };

  const analyze = async () => {
    if (!logs.trim()) {
      setError('Please enter log data');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/logs/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs,
          source,
          filterLevel: filterLevel.length > 0 ? filterLevel : undefined,
          groupBy,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error?.message || 'Analysis failed');
      }
    } catch (err) {
      setError('Failed to analyze logs');
    } finally {
      setLoading(false);
    }
  };

  const toggleLevel = (level: string) => {
    setFilterLevel(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Audit Log Analyzer</h1>
      <p>Analyze integration engine logs to find patterns, errors, and generate reports.</p>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={loadSample} style={{ marginRight: '10px' }}>
          Load Sample Logs
        </button>
        <button onClick={analyze} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Logs'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', marginBottom: '20px' }}>
        <div>
          <h3>Log Input</h3>
          <textarea
            value={logs}
            onChange={(e) => setLogs(e.target.value)}
            placeholder="Paste your log data here..."
            style={{
              width: '100%',
              height: '250px',
              fontFamily: 'monospace',
              fontSize: '11px',
            }}
          />
        </div>

        <div>
          <h3>Options</h3>
          <div style={{ marginBottom: '15px' }}>
            <label>Log Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as LogSource)}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              <option value="cloverleaf">Cloverleaf</option>
              <option value="mirth">Mirth Connect</option>
              <option value="rhapsody">Rhapsody</option>
              <option value="syslog">Syslog</option>
              <option value="generic">Generic</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'hour' | 'day')}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              <option value="hour">Hour</option>
              <option value="day">Day</option>
            </select>
          </div>

          <div>
            <label>Filter by Level</label>
            <div style={{ marginTop: '5px' }}>
              {['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'].map(level => (
                <label key={level} style={{ display: 'block', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    checked={filterLevel.includes(level)}
                    onChange={() => toggleLevel(level)}
                  />
                  <span style={{ marginLeft: '5px' }}>{level}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ color: 'red', marginTop: '10px', padding: '10px', background: '#fee' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            {['summary', 'entries', 'patterns', 'report'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                style={{
                  marginRight: '10px',
                  padding: '8px 16px',
                  fontWeight: activeTab === tab ? 'bold' : 'normal',
                  background: activeTab === tab ? '#007bff' : '#f0f0f0',
                  color: activeTab === tab ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'summary' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
                <h4>Overview</h4>
                <p><strong>Total Entries:</strong> {result.summary.totalEntries}</p>
                <p><strong>Time Range:</strong></p>
                <p style={{ fontSize: '12px' }}>{result.summary.timeRange.start}</p>
                <p style={{ fontSize: '12px' }}>to {result.summary.timeRange.end}</p>
                <p><strong>Error Count:</strong> <span style={{ color: 'red' }}>{result.errors.count}</span></p>
              </div>

              <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
                <h4>By Log Level</h4>
                {Object.entries(result.summary.byLevel).map(([level, count]) => (
                  <p key={level}>
                    <span style={{
                      color: level === 'ERROR' || level === 'FATAL' ? 'red' :
                             level === 'WARN' ? 'orange' : 'inherit'
                    }}>
                      {level}: {count as number}
                    </span>
                  </p>
                ))}
              </div>

              <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
                <h4>Top Errors</h4>
                {result.errors.topErrors.slice(0, 5).map((err, i) => (
                  <p key={i} style={{ fontSize: '11px', marginBottom: '8px' }}>
                    <strong>{err.count}x</strong> {err.message.substring(0, 50)}...
                  </p>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'entries' && (
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f0f0f0', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Timestamp</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Level</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Source</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {result.entries.map((entry, i) => (
                    <tr key={i} style={{
                      background: entry.level === 'ERROR' || entry.level === 'FATAL' ? '#ffebee' :
                                  entry.level === 'WARN' ? '#fff3e0' : 'transparent'
                    }}>
                      <td style={{ padding: '6px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                        {entry.timestamp}
                      </td>
                      <td style={{
                        padding: '6px',
                        border: '1px solid #ddd',
                        color: entry.level === 'ERROR' || entry.level === 'FATAL' ? 'red' :
                               entry.level === 'WARN' ? 'orange' : 'inherit'
                      }}>
                        {entry.level}
                      </td>
                      <td style={{ padding: '6px', border: '1px solid #ddd' }}>{entry.source}</td>
                      <td style={{ padding: '6px', border: '1px solid #ddd' }}>{entry.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'patterns' && (
            <div>
              {result.patterns.length === 0 ? (
                <p>No patterns detected.</p>
              ) : (
                result.patterns.map((pattern, i) => (
                  <div key={i} style={{
                    background: pattern.severity === 'critical' ? '#ffebee' :
                                pattern.severity === 'warning' ? '#fff3e0' : '#f5f5f5',
                    padding: '15px',
                    borderRadius: '5px',
                    marginBottom: '10px',
                  }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>
                      {pattern.name.substring(0, 80)}...
                      <span style={{
                        marginLeft: '10px',
                        fontSize: '12px',
                        color: pattern.severity === 'critical' ? 'red' :
                               pattern.severity === 'warning' ? 'orange' : 'green'
                      }}>
                        [{pattern.severity}]
                      </span>
                    </h4>
                    <p><strong>Occurrences:</strong> {pattern.count}</p>
                    <p><strong>First:</strong> {pattern.firstOccurrence}</p>
                    <p><strong>Last:</strong> {pattern.lastOccurrence}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'report' && (
            <pre style={{
              background: '#fafafa',
              padding: '15px',
              borderRadius: '5px',
              overflow: 'auto',
              maxHeight: '500px',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
            }}>
              {result.report}
            </pre>
          )}
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: '#007bff' }}>← Back to Dashboard</a>
      </div>
    </div>
  );
}
