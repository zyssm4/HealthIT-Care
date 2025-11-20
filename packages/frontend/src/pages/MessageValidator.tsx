import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ValidatorResponse, MessageFormat } from '@healthit-care/shared';

const MessageValidator: React.FC = () => {
  const [message, setMessage] = useState('');
  const [format, setFormat] = useState<MessageFormat>('hl7v2');
  const [result, setResult] = useState<ValidatorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'issues' | 'structure'>('issues');

  const handleValidate = async () => {
    if (!message.trim()) {
      setError('Please enter a message to validate');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/validate/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          format,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to validate message');
      }

      setResult(data.data);
      setActiveTab('issues');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return 'var(--text-secondary)';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const loadSample = () => {
    if (format === 'hl7v2') {
      setMessage(`MSH|^~\\&|SENDER|FACILITY|RECEIVER|DEST|20231201120000||ADT^A01|MSG001|P|2.5.1
EVN|A01|20231201120000
PID|||12345^^^MRN||Doe^John^A||19800115|M|||123 Main St^^City^ST^12345||555-123-4567
PV1||I|ICU^101^A||||1234^Smith^Jane|||MED||||||||V001|||||||||||||||||||||||||20231201120000`);
    } else if (format === 'fhir-json') {
      setMessage(JSON.stringify({
        resourceType: 'Patient',
        id: 'example',
        identifier: [{
          system: 'http://hospital.org/mrn',
          value: '12345',
        }],
        name: [{
          family: 'Doe',
          given: ['John', 'A'],
        }],
        gender: 'male',
        birthDate: '1980-01-15',
        address: [{
          line: ['123 Main St'],
          city: 'City',
          state: 'ST',
          postalCode: '12345',
        }],
      }, null, 2));
    }
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="back-link">← Back to Dashboard</Link>
        <h1>HL7/FHIR Message Validator</h1>
        <p>Validate healthcare messages against standards and profiles</p>
      </header>

      <div className="container">
        {/* Input Panel */}
        <div className="panel">
          <h2>Message Input</h2>

          <div className="form-section">
            <div className="form-group">
              <label>Message Format:</label>
              <select
                value={format}
                onChange={(e) => {
                  setFormat(e.target.value as MessageFormat);
                  setMessage('');
                  setResult(null);
                }}
              >
                <option value="hl7v2">HL7 v2.x</option>
                <option value="fhir-json">FHIR JSON</option>
                <option value="fhir-xml">FHIR XML</option>
                <option value="cda">CDA</option>
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Message:</label>
                <button
                  className="btn btn-secondary"
                  onClick={loadSample}
                  style={{ fontSize: '0.625rem', padding: '0.25rem 0.5rem' }}
                >
                  Load Sample
                </button>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={format === 'hl7v2'
                  ? 'Paste your HL7 v2 message here...\n\nExample:\nMSH|^~\\&|SENDER|...'
                  : format === 'fhir-json'
                  ? '{\n  "resourceType": "Patient",\n  ...\n}'
                  : 'Paste your message here...'}
                style={{
                  minHeight: '300px',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                }}
              />
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button
            className="btn btn-primary"
            onClick={handleValidate}
            disabled={loading}
          >
            {loading ? 'Validating...' : 'Validate Message'}
          </button>
        </div>

        {/* Result Panel */}
        <div className="panel">
          <h2>Validation Results</h2>

          {loading && (
            <div className="loading">Validating message...</div>
          )}

          {result && !loading && (
            <>
              {/* Summary */}
              <div className="result-section">
                <div className="metadata">
                  <div className="metadata-item">
                    <div className="value" style={{
                      color: result.isValid ? '#10b981' : '#ef4444',
                      fontSize: '1.5rem',
                    }}>
                      {result.isValid ? '✓' : '✗'}
                    </div>
                    <div className="label">{result.isValid ? 'Valid' : 'Invalid'}</div>
                  </div>
                  <div className="metadata-item">
                    <div className="value" style={{ color: getScoreColor(result.score) }}>
                      {result.score}
                    </div>
                    <div className="label">Score</div>
                  </div>
                  <div className="metadata-item">
                    <div className="value" style={{ color: '#ef4444' }}>{result.summary.errors}</div>
                    <div className="label">Errors</div>
                  </div>
                  <div className="metadata-item">
                    <div className="value" style={{ color: '#f59e0b' }}>{result.summary.warnings}</div>
                    <div className="label">Warnings</div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'issues' ? 'active' : ''}`}
                  onClick={() => setActiveTab('issues')}
                >
                  Issues ({result.issues.length})
                </button>
                {result.parsedStructure && (
                  <button
                    className={`tab ${activeTab === 'structure' ? 'active' : ''}`}
                    onClick={() => setActiveTab('structure')}
                  >
                    Parsed Structure
                  </button>
                )}
              </div>

              {/* Issues Tab */}
              {activeTab === 'issues' && (
                <div className="result-section">
                  {result.issues.length === 0 ? (
                    <p style={{ color: '#10b981', textAlign: 'center', padding: '1rem' }}>
                      No issues found. Message is valid!
                    </p>
                  ) : (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {result.issues.map((issue, idx) => (
                        <div key={idx} className="issue-item" style={{
                          padding: '0.75rem',
                          borderBottom: '1px solid var(--border-color)',
                          borderLeft: `3px solid ${getSeverityColor(issue.severity)}`,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.875rem' }}>{issue.field}</strong>
                            <span style={{
                              fontSize: '0.625rem',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '4px',
                              background: getSeverityColor(issue.severity),
                              color: 'white',
                            }}>
                              {issue.severity}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', margin: '0.5rem 0' }}>{issue.message}</p>
                          {issue.value && (
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-secondary)' }}>
                              Value: <code>{issue.value}</code>
                            </p>
                          )}
                          <p style={{ fontSize: '0.625rem', color: 'var(--text-secondary)' }}>
                            Rule: {issue.rule}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Parsed Structure Tab */}
              {activeTab === 'structure' && result.parsedStructure && (
                <div className="result-section">
                  <pre className="schema-output" style={{ maxHeight: '400px' }}>
                    {JSON.stringify(result.parsedStructure, null, 2)}
                  </pre>
                </div>
              )}

              {/* Recommendations */}
              {result.issues.length > 0 && (
                <div className="form-section">
                  <h3>Recommendations</h3>
                  <ul style={{ fontSize: '0.75rem', paddingLeft: '1.5rem' }}>
                    {result.summary.errors > 0 && (
                      <li style={{ color: '#ef4444' }}>
                        Fix {result.summary.errors} error(s) before deploying this message
                      </li>
                    )}
                    {result.summary.warnings > 0 && (
                      <li style={{ color: '#f59e0b' }}>
                        Review {result.summary.warnings} warning(s) for potential issues
                      </li>
                    )}
                    {result.score < 80 && (
                      <li>
                        Score below 80 indicates significant validation issues
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}

          {!result && !loading && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              Enter a message and click "Validate Message" to see results
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageValidator;
