import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfigDiffResponse } from '@healthit-care/shared';

type ConfigType = 'xlt' | 'properties' | 'json' | 'xml' | 'tcl';
type Environment = 'dev' | 'test' | 'staging' | 'prod';

const ConfigDiff: React.FC = () => {
  const [sourceConfig, setSourceConfig] = useState({
    name: '',
    environment: 'dev' as Environment,
    content: '',
    type: 'properties' as ConfigType,
  });
  const [targetConfig, setTargetConfig] = useState({
    name: '',
    environment: 'prod' as Environment,
    content: '',
    type: 'properties' as ConfigType,
  });
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(true);
  const [ignoreComments, setIgnoreComments] = useState(true);
  const [result, setResult] = useState<ConfigDiffResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'diff' | 'script' | 'report'>('diff');

  const handleCompare = async () => {
    if (!sourceConfig.content.trim()) {
      setError('Source configuration is required');
      return;
    }

    if (!targetConfig.content.trim()) {
      setError('Target configuration is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/configdiff/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceConfig: {
            ...sourceConfig,
            name: sourceConfig.name || `source.${sourceConfig.type}`,
          },
          targetConfig: {
            ...targetConfig,
            name: targetConfig.name || `target.${targetConfig.type}`,
          },
          ignoreWhitespace,
          ignoreComments,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to compare configurations');
      }

      setResult(data.data);
      setActiveTab('diff');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return 'var(--text-secondary)';
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'added': return '#10b981';
      case 'removed': return '#ef4444';
      case 'modified': return '#f59e0b';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="back-link">← Back to Dashboard</Link>
        <h1>Configuration Diff / Migration Tool</h1>
        <p>Compare configurations and generate migration scripts</p>
      </header>

      <div className="container">
        {/* Input Panel */}
        <div className="panel">
          <h2>Configuration Comparison</h2>

          {/* Source Config */}
          <div className="form-section">
            <h3>Source Configuration</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Environment:</label>
                <select
                  value={sourceConfig.environment}
                  onChange={(e) => setSourceConfig({ ...sourceConfig, environment: e.target.value as Environment })}
                >
                  <option value="dev">Development</option>
                  <option value="test">Test</option>
                  <option value="staging">Staging</option>
                  <option value="prod">Production</option>
                </select>
              </div>

              <div className="form-group">
                <label>Config Type:</label>
                <select
                  value={sourceConfig.type}
                  onChange={(e) => {
                    const type = e.target.value as ConfigType;
                    setSourceConfig({ ...sourceConfig, type });
                    setTargetConfig({ ...targetConfig, type });
                  }}
                >
                  <option value="properties">Properties</option>
                  <option value="json">JSON</option>
                  <option value="xml">XML</option>
                  <option value="tcl">TCL</option>
                  <option value="xlt">Cloverleaf XLT</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Configuration Content:</label>
              <textarea
                value={sourceConfig.content}
                onChange={(e) => setSourceConfig({ ...sourceConfig, content: e.target.value })}
                placeholder={sourceConfig.type === 'properties'
                  ? 'db.host=localhost\ndb.port=5432\ndb.name=dev_db'
                  : sourceConfig.type === 'json'
                  ? '{\n  "host": "localhost",\n  "port": 5432\n}'
                  : 'Paste configuration content here...'}
                style={{ minHeight: '120px', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {/* Target Config */}
          <div className="form-section">
            <h3>Target Configuration</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Environment:</label>
                <select
                  value={targetConfig.environment}
                  onChange={(e) => setTargetConfig({ ...targetConfig, environment: e.target.value as Environment })}
                >
                  <option value="dev">Development</option>
                  <option value="test">Test</option>
                  <option value="staging">Staging</option>
                  <option value="prod">Production</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Configuration Content:</label>
              <textarea
                value={targetConfig.content}
                onChange={(e) => setTargetConfig({ ...targetConfig, content: e.target.value })}
                placeholder="Paste target configuration content here..."
                style={{ minHeight: '120px', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {/* Options */}
          <div className="form-section">
            <h3>Comparison Options</h3>
            <div className="checkbox-group">
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="ignoreWhitespace"
                  checked={ignoreWhitespace}
                  onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                />
                <label htmlFor="ignoreWhitespace">Ignore Whitespace</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="ignoreComments"
                  checked={ignoreComments}
                  onChange={(e) => setIgnoreComments(e.target.checked)}
                />
                <label htmlFor="ignoreComments">Ignore Comments</label>
              </div>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button
            className="btn btn-primary"
            onClick={handleCompare}
            disabled={loading}
          >
            {loading ? 'Comparing...' : 'Compare Configurations'}
          </button>
        </div>

        {/* Result Panel */}
        <div className="panel">
          <h2>Comparison Results</h2>

          {loading && (
            <div className="loading">Comparing configurations...</div>
          )}

          {result && !loading && (
            <>
              <div className="result-section">
                <div className="metadata">
                  <div className="metadata-item">
                    <div className="value" style={{ color: '#10b981' }}>{result.summary.added}</div>
                    <div className="label">Added</div>
                  </div>
                  <div className="metadata-item">
                    <div className="value" style={{ color: '#ef4444' }}>{result.summary.removed}</div>
                    <div className="label">Removed</div>
                  </div>
                  <div className="metadata-item">
                    <div className="value" style={{ color: '#f59e0b' }}>{result.summary.modified}</div>
                    <div className="label">Modified</div>
                  </div>
                  <div className="metadata-item">
                    <div className="value">{result.summary.unchanged}</div>
                    <div className="label">Unchanged</div>
                  </div>
                </div>
              </div>

              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'diff' ? 'active' : ''}`}
                  onClick={() => setActiveTab('diff')}
                >
                  Differences ({result.differences.length})
                </button>
                <button
                  className={`tab ${activeTab === 'script' ? 'active' : ''}`}
                  onClick={() => setActiveTab('script')}
                >
                  Migration Script
                </button>
                <button
                  className={`tab ${activeTab === 'report' ? 'active' : ''}`}
                  onClick={() => setActiveTab('report')}
                >
                  Report
                </button>
              </div>

              {activeTab === 'diff' && (
                <div className="result-section">
                  {result.differences.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                      No differences found. Configurations are identical.
                    </p>
                  ) : (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {result.differences.map((diff, idx) => (
                        <div key={idx} className="diff-item" style={{
                          padding: '0.75rem',
                          borderBottom: '1px solid var(--border-color)',
                          borderLeft: `3px solid ${getImpactColor(diff.impact)}`,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.875rem' }}>{diff.field}</strong>
                            <div>
                              <span style={{
                                fontSize: '0.625rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '4px',
                                background: getChangeTypeColor(diff.changeType),
                                color: 'white',
                                marginRight: '0.25rem',
                              }}>
                                {diff.changeType}
                              </span>
                              <span style={{
                                fontSize: '0.625rem',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '4px',
                                background: '#f1f5f9',
                                color: getImpactColor(diff.impact),
                              }}>
                                {diff.impact} impact
                              </span>
                            </div>
                          </div>
                          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                            {diff.sourceValue && (
                              <div style={{ color: '#ef4444' }}>
                                - {diff.sourceValue}
                              </div>
                            )}
                            {diff.targetValue && (
                              <div style={{ color: '#10b981' }}>
                                + {diff.targetValue}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'script' && result.migrationScript && (
                <div className="result-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3>Migration Script</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => handleCopy(result.migrationScript!)}>
                        Copy
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleDownload(result.migrationScript!, 'migration.sh')}>
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className="schema-output" style={{ maxHeight: '400px' }}>
                    {result.migrationScript}
                  </pre>
                </div>
              )}

              {activeTab === 'report' && (
                <div className="result-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3>Comparison Report</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => handleCopy(result.report)}>
                        Copy
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleDownload(result.report, 'config-comparison-report.md')}>
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className="schema-output" style={{ maxHeight: '400px' }}>
                    {result.report}
                  </pre>
                </div>
              )}
            </>
          )}

          {!result && !loading && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              Enter configurations and click "Compare Configurations" to see results
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigDiff;
