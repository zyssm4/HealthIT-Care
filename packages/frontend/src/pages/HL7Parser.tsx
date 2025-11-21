import { useState } from 'react';
import { HL7v2ParseResponse, HL7v2Segment } from '@healthit-care/shared';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.startsWith('http') ? import.meta.env.VITE_API_URL : `https://${import.meta.env.VITE_API_URL}`}/api/v1`
  : '/api/v1';

export default function HL7Parser() {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<HL7v2ParseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<HL7v2Segment | null>(null);

  const loadSample = async () => {
    try {
      const response = await fetch(`${API_BASE}/hl7parser/sample`);
      const data = await response.json();
      if (data.success) {
        setMessage(data.data.message);
      }
    } catch (err) {
      setError('Failed to load sample');
    }
  };

  const parseMessage = async () => {
    if (!message.trim()) {
      setError('Please enter an HL7v2 message');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setSelectedSegment(null);

    try {
      const response = await fetch(`${API_BASE}/hl7parser/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          includeFieldNames: true,
          highlightErrors: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error?.message || 'Parse failed');
      }
    } catch (err) {
      setError('Failed to parse message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>HL7v2 Message Viewer/Parser</h1>
      <p>Parse and visualize HL7v2 messages with field names and structure.</p>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={loadSample} style={{ marginRight: '10px' }}>
          Load Sample Message
        </button>
        <button onClick={parseMessage} disabled={loading}>
          {loading ? 'Parsing...' : 'Parse Message'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3>Input Message</h3>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste your HL7v2 message here..."
            style={{
              width: '100%',
              height: '300px',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
          />
        </div>

        <div>
          <h3>Message Info</h3>
          {result && (
            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
              <p><strong>Message Type:</strong> {result.messageType}^{result.triggerEvent}</p>
              <p><strong>Version:</strong> {result.version}</p>
              <p><strong>Control ID:</strong> {result.controlId}</p>
              <p><strong>Timestamp:</strong> {result.timestamp}</p>
              <p><strong>Sending:</strong> {result.sendingApp} / {result.sendingFacility}</p>
              <p><strong>Receiving:</strong> {result.receivingApp} / {result.receivingFacility}</p>
              <p><strong>Segments:</strong> {result.segmentCount}</p>
              {result.errors.length > 0 && (
                <div style={{ color: 'red', marginTop: '10px' }}>
                  <strong>Errors:</strong>
                  {result.errors.map((err, i) => (
                    <p key={i}>• {err.segment}-{err.field}: {err.message}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ color: 'red', marginTop: '10px', padding: '10px', background: '#fee' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Segment Tree</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px' }}>
            <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
              {result.segments.map((seg, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedSegment(seg)}
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    background: selectedSegment === seg ? '#007bff' : 'transparent',
                    color: selectedSegment === seg ? 'white' : 'black',
                    borderRadius: '3px',
                    marginBottom: '2px',
                  }}
                >
                  {seg.name} ({seg.fields.length} fields)
                </div>
              ))}
            </div>

            <div>
              {selectedSegment && (
                <div>
                  <h4>{selectedSegment.name} Fields</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f0f0f0' }}>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Position</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Name</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSegment.fields.map((field, i) => (
                        <tr key={i}>
                          <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                            {selectedSegment.name}-{field.position}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #ddd' }}>{field.name}</td>
                          <td style={{ padding: '8px', border: '1px solid #ddd', fontFamily: 'monospace' }}>
                            {field.value || <em style={{ color: '#999' }}>empty</em>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: '#007bff' }}>← Back to Dashboard</a>
      </div>
    </div>
  );
}
