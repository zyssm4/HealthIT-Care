import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SchemaResponse,
  SchemaOptions,
  DEFAULT_SCHEMA_OPTIONS,
} from '@healthit-care/shared';
import { generateSchema } from '../services/api';

type Mode = 'requirements' | 'existing';
type ResultTab = 'schema' | 'explanations' | 'warnings' | 'suggestions';

const SchemaGenerator: React.FC = () => {
  const [mode, setMode] = useState<Mode>('requirements');
  const [input, setInput] = useState('');
  const [additionalRequests, setAdditionalRequests] = useState('');
  const [options, setOptions] = useState<SchemaOptions>(DEFAULT_SCHEMA_OPTIONS);
  const [result, setResult] = useState<SchemaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>('schema');

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError('Please enter requirements or an existing schema');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await generateSchema(
        mode,
        input,
        mode === 'existing' ? additionalRequests : undefined,
        options
      );
      setResult(response);
      setActiveTab('schema');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (key: keyof SchemaOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleCopySchema = () => {
    if (result?.generatedSchema) {
      navigator.clipboard.writeText(result.generatedSchema);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="back-link">← Back to Dashboard</Link>
        <h1>SQL Schema Generator</h1>
        <p>Generate optimized, compliant database schemas from requirements</p>
      </header>

      <div className="container">
        {/* Input Panel */}
        <div className="panel">
          <h2>Input</h2>

          {/* Mode Selector */}
          <div className="mode-selector">
            <div
              className={`mode-option ${mode === 'requirements' ? 'selected' : ''}`}
              onClick={() => setMode('requirements')}
            >
              <h4>From Requirements</h4>
              <p>Describe what you need</p>
            </div>
            <div
              className={`mode-option ${mode === 'existing' ? 'selected' : ''}`}
              onClick={() => setMode('existing')}
            >
              <h4>Modify Existing</h4>
              <p>Improve an existing schema</p>
            </div>
          </div>

          {/* Input Textarea */}
          <div className="form-group">
            <label>
              {mode === 'requirements'
                ? 'Describe your database requirements:'
                : 'Paste your existing SQL schema:'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'requirements'
                  ? `Example:
Patient table:
- MRN: unique identifier
- Name: required
- Date of Birth: required
- Email: optional
- Phone: optional

Appointment table:
- Patient: references Patient
- Date: required
- Time: required
- Status: scheduled/completed/cancelled`
                  : `Paste your CREATE TABLE statements here...`
              }
            />
          </div>

          {/* Additional Requests (for existing mode) */}
          {mode === 'existing' && (
            <div className="form-group">
              <label>Modification requests (optional):</label>
              <textarea
                value={additionalRequests}
                onChange={(e) => setAdditionalRequests(e.target.value)}
                placeholder="E.g., Add audit fields, add soft delete, add index on email..."
                style={{ minHeight: '80px' }}
              />
            </div>
          )}

          {/* Options */}
          <div className="form-group">
            <label>Database Type:</label>
            <select
              value={options.databaseType}
              onChange={(e) => handleOptionChange('databaseType', e.target.value)}
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mssql">SQL Server</option>
            </select>
          </div>

          <div className="form-group">
            <label>Naming Convention:</label>
            <select
              value={options.namingConvention}
              onChange={(e) => handleOptionChange('namingConvention', e.target.value)}
            >
              <option value="snake_case">snake_case</option>
              <option value="camelCase">camelCase</option>
              <option value="PascalCase">PascalCase</option>
            </select>
          </div>

          <div className="form-group">
            <label>Healthcare Compliance Options:</label>
            <div className="checkbox-group">
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="auditFields"
                  checked={options.includeAuditFields}
                  onChange={(e) => handleOptionChange('includeAuditFields', e.target.checked)}
                />
                <label htmlFor="auditFields">Audit Fields</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="softDelete"
                  checked={options.includeSoftDelete}
                  onChange={(e) => handleOptionChange('includeSoftDelete', e.target.checked)}
                />
                <label htmlFor="softDelete">Soft Delete</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="encryption"
                  checked={options.includeEncryptionMarkers}
                  onChange={(e) => handleOptionChange('includeEncryptionMarkers', e.target.checked)}
                />
                <label htmlFor="encryption">PHI Encryption</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="indexes"
                  checked={options.includeIndexes}
                  onChange={(e) => handleOptionChange('includeIndexes', e.target.checked)}
                />
                <label htmlFor="indexes">Indexes</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="comments"
                  checked={options.includeComments}
                  onChange={(e) => handleOptionChange('includeComments', e.target.checked)}
                />
                <label htmlFor="comments">Comments</label>
              </div>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Schema'}
          </button>
        </div>

        {/* Result Panel */}
        <div className="panel">
          <h2>Result</h2>

          {loading && (
            <div className="loading">
              Generating optimized schema...
            </div>
          )}

          {result && !loading && (
            <>
              {/* Metadata */}
              <div className="result-section">
                <div className="metadata">
                  <div className="metadata-item">
                    <div className="value">{result.metadata.tableCount}</div>
                    <div className="label">Tables</div>
                  </div>
                  <div className="metadata-item">
                    <div className="value">{result.metadata.columnCount}</div>
                    <div className="label">Columns</div>
                  </div>
                  <div className="metadata-item">
                    <div className="value">{result.metadata.complianceScore}%</div>
                    <div className="label">Compliance</div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'schema' ? 'active' : ''}`}
                  onClick={() => setActiveTab('schema')}
                >
                  Schema
                </button>
                <button
                  className={`tab ${activeTab === 'explanations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('explanations')}
                >
                  Explanations ({result.explanations.length})
                </button>
                <button
                  className={`tab ${activeTab === 'warnings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('warnings')}
                >
                  Warnings ({result.warnings.length})
                </button>
                <button
                  className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('suggestions')}
                >
                  Suggestions ({result.suggestions.length})
                </button>
              </div>

              {/* Schema Tab */}
              {activeTab === 'schema' && (
                <div className="result-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3>Generated SQL</h3>
                    <button className="btn btn-secondary" onClick={handleCopySchema}>
                      Copy
                    </button>
                  </div>
                  <pre className="schema-output">{result.generatedSchema}</pre>
                </div>
              )}

              {/* Explanations Tab */}
              {activeTab === 'explanations' && (
                <div className="result-section">
                  {result.explanations.map((exp, idx) => (
                    <div key={idx} className="explanation-card">
                      <h4>{exp.section}</h4>
                      <p><strong>{exp.explanation}</strong></p>
                      <p>{exp.reasoning}</p>
                      {exp.relatedTables && (
                        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                          Applies to: {exp.relatedTables.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings Tab */}
              {activeTab === 'warnings' && (
                <div className="result-section">
                  {result.warnings.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No warnings</p>
                  ) : (
                    result.warnings.map((warn, idx) => (
                      <div key={idx} className={`warning-card ${warn.severity}`}>
                        <h4>{warn.message}</h4>
                        <p>{warn.recommendation}</p>
                        {warn.affectedElements && (
                          <p style={{ fontSize: '0.625rem', marginTop: '0.25rem' }}>
                            Affected: {warn.affectedElements.join(', ')}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Suggestions Tab */}
              {activeTab === 'suggestions' && (
                <div className="result-section">
                  {result.suggestions.map((sug, idx) => (
                    <div key={idx} className="suggestion-card">
                      <span className="type">{sug.type}</span>
                      <h4>{sug.title}</h4>
                      <p>{sug.description}</p>
                      {sug.implementation && (
                        <pre style={{
                          marginTop: '0.5rem',
                          fontSize: '0.625rem',
                          background: '#f1f5f9',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          overflow: 'auto'
                        }}>
                          {sug.implementation}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!result && !loading && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              Enter requirements and click "Generate Schema" to see results
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemaGenerator;
