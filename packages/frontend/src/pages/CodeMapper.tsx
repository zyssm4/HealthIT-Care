import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CodeSystem, CodeMapperResponse } from '@healthit-care/shared';

const CODE_SYSTEMS: { system: CodeSystem; name: string }[] = [
  { system: 'ICD10', name: 'ICD-10' },
  { system: 'ICD9', name: 'ICD-9' },
  { system: 'SNOMED', name: 'SNOMED CT' },
  { system: 'LOINC', name: 'LOINC' },
  { system: 'CPT', name: 'CPT' },
  { system: 'HCPCS', name: 'HCPCS' },
  { system: 'RxNorm', name: 'RxNorm' },
  { system: 'NDC', name: 'NDC' },
  { system: 'LOCAL', name: 'Local Codes' },
];

const CodeMapper: React.FC = () => {
  const [sourceCodes, setSourceCodes] = useState<Array<{ code: string; system: CodeSystem; display?: string }>>([]);
  const [targetSystem, setTargetSystem] = useState<CodeSystem>('SNOMED');
  const [outputFormat, setOutputFormat] = useState<'json' | 'csv' | 'cloverleaf-table'>('json');
  const [result, setResult] = useState<CodeMapperResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mappings' | 'output' | 'stats'>('mappings');

  // Form state for adding codes
  const [newCode, setNewCode] = useState('');
  const [newSystem, setNewSystem] = useState<CodeSystem>('ICD10');
  const [newDisplay, setNewDisplay] = useState('');
  const [bulkInput, setBulkInput] = useState('');

  const handleAddCode = () => {
    if (!newCode.trim()) {
      setError('Code is required');
      return;
    }

    setSourceCodes([...sourceCodes, {
      code: newCode.trim(),
      system: newSystem,
      display: newDisplay.trim() || undefined,
    }]);
    setNewCode('');
    setNewDisplay('');
    setError(null);
  };

  const handleBulkAdd = () => {
    const lines = bulkInput.split('\n').filter(line => line.trim());
    const codes = lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      return {
        code: parts[0],
        system: newSystem,
        display: parts[1] || undefined,
      };
    }).filter(c => c.code);

    setSourceCodes([...sourceCodes, ...codes]);
    setBulkInput('');
  };

  const handleRemoveCode = (index: number) => {
    setSourceCodes(sourceCodes.filter((_, i) => i !== index));
  };

  const handleMap = async () => {
    if (sourceCodes.length === 0) {
      setError('Please add at least one code to map');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/codemap/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCodes,
          targetSystem,
          outputFormat,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to map codes');
      }

      setResult(data.data);
      setActiveTab('mappings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleDownload = () => {
    if (result?.outputFile) {
      const extension = outputFormat === 'csv' ? 'csv' : outputFormat === 'cloverleaf-table' ? 'tcl' : 'json';
      const blob = new Blob([result.outputFile], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `code-mappings.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="back-link">← Back to Dashboard</Link>
        <h1>Code Set / Terminology Mapper</h1>
        <p>Map healthcare codes between standard terminologies</p>
      </header>

      <div className="container">
        {/* Input Panel */}
        <div className="panel">
          <h2>Source Codes</h2>

          {/* Add Single Code */}
          <div className="form-section">
            <h3>Add Code</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Source System:</label>
                <select
                  value={newSystem}
                  onChange={(e) => setNewSystem(e.target.value as CodeSystem)}
                >
                  {CODE_SYSTEMS.map(cs => (
                    <option key={cs.system} value={cs.system}>{cs.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Code:</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g., E11.9"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Display Name (optional):</label>
              <input
                type="text"
                value={newDisplay}
                onChange={(e) => setNewDisplay(e.target.value)}
                placeholder="e.g., Type 2 diabetes mellitus"
              />
            </div>

            <button className="btn btn-primary" onClick={handleAddCode}>
              Add Code
            </button>
          </div>

          {/* Bulk Add */}
          <div className="form-section">
            <h3>Bulk Add (CSV format: code,display)</h3>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="E11.9,Type 2 diabetes
I10,Essential hypertension
J06.9,Upper respiratory infection"
              style={{ minHeight: '80px' }}
            />
            <button className="btn btn-secondary" onClick={handleBulkAdd} disabled={!bulkInput.trim()}>
              Add All
            </button>
          </div>

          {/* Code List */}
          {sourceCodes.length > 0 && (
            <div className="form-section">
              <h3>Codes to Map ({sourceCodes.length})</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {sourceCodes.map((code, idx) => (
                  <div key={idx} className="code-item" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem',
                    borderBottom: '1px solid var(--border-color)',
                  }}>
                    <div>
                      <strong>{code.code}</strong>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                        ({code.system})
                      </span>
                      {code.display && (
                        <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0' }}>{code.display}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveCode(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => setSourceCodes([])}
                style={{ marginTop: '0.5rem' }}
              >
                Clear All
              </button>
            </div>
          )}

          {/* Target Options */}
          <div className="form-section">
            <h3>Target Options</h3>

            <div className="form-group">
              <label>Target Code System:</label>
              <select
                value={targetSystem}
                onChange={(e) => setTargetSystem(e.target.value as CodeSystem)}
              >
                {CODE_SYSTEMS.map(cs => (
                  <option key={cs.system} value={cs.system}>{cs.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Output Format:</label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as any)}
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="cloverleaf-table">Cloverleaf Translation Table (TCL)</option>
              </select>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button
            className="btn btn-primary"
            onClick={handleMap}
            disabled={loading || sourceCodes.length === 0}
          >
            {loading ? 'Mapping...' : 'Map Codes'}
          </button>
        </div>

        {/* Result Panel */}
        <div className="panel">
          <h2>Mapping Results</h2>

          {loading && (
            <div className="loading">Mapping codes...</div>
          )}

          {result && !loading && (
            <>
              {/* Statistics */}
              <div className="result-section">
                <div className="metadata">
                  <div className="metadata-item">
                    <div className="value">{result.statistics.mapped}</div>
                    <div className="label">Mapped</div>
                  </div>
                  <div className="metadata-item">
                    <div className="value">{result.statistics.unmapped}</div>
                    <div className="label">Unmapped</div>
                  </div>
                  <div className="metadata-item">
                    <div className="value">{result.statistics.accuracy}%</div>
                    <div className="label">Accuracy</div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'mappings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('mappings')}
                >
                  Mappings ({result.mappings.length})
                </button>
                <button
                  className={`tab ${activeTab === 'output' ? 'active' : ''}`}
                  onClick={() => setActiveTab('output')}
                >
                  Output File
                </button>
                <button
                  className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stats')}
                >
                  Details
                </button>
              </div>

              {/* Mappings Tab */}
              {activeTab === 'mappings' && (
                <div className="result-section">
                  {result.mappings.map((mapping, idx) => (
                    <div key={idx} className={`mapping-card ${mapping.equivalence === 'unmatched' ? 'unmatched' : ''}`}>
                      <div className="mapping-fields">
                        <div>
                          <span className="source">{mapping.sourceCode}</span>
                          <span style={{ fontSize: '0.625rem', display: 'block' }}>{mapping.sourceSystem}</span>
                        </div>
                        <span className="arrow">→</span>
                        <div>
                          <span className="target">{mapping.targetCode || 'N/A'}</span>
                          <span style={{ fontSize: '0.625rem', display: 'block' }}>{mapping.targetSystem}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        {mapping.sourceDisplay} → {mapping.targetDisplay}
                      </p>
                      <span className={`equivalence-badge ${mapping.equivalence}`}>
                        {mapping.equivalence}
                      </span>
                      {mapping.notes && (
                        <p className="notes">{mapping.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Output File Tab */}
              {activeTab === 'output' && (
                <div className="result-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3>Generated Output</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => handleCopy(result.outputFile)}>
                        Copy
                      </button>
                      <button className="btn btn-secondary" onClick={handleDownload}>
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className="schema-output">{result.outputFile}</pre>
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'stats' && (
                <div className="result-section">
                  <h3>Mapping Details</h3>
                  <table style={{ width: '100%', fontSize: '0.75rem' }}>
                    <tbody>
                      <tr>
                        <td>Total Codes</td>
                        <td><strong>{result.statistics.total}</strong></td>
                      </tr>
                      <tr>
                        <td>Successfully Mapped</td>
                        <td><strong>{result.statistics.mapped}</strong></td>
                      </tr>
                      <tr>
                        <td>Unmapped</td>
                        <td><strong>{result.statistics.unmapped}</strong></td>
                      </tr>
                      <tr>
                        <td>Mapping Accuracy</td>
                        <td><strong>{result.statistics.accuracy}%</strong></td>
                      </tr>
                    </tbody>
                  </table>

                  {result.unmappedCodes.length > 0 && (
                    <>
                      <h4 style={{ marginTop: '1rem' }}>Unmapped Codes</h4>
                      <ul>
                        {result.unmappedCodes.map((code, idx) => (
                          <li key={idx}>{code}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {!result && !loading && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              Add codes and click "Map Codes" to see results
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeMapper;
