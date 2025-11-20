import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TestGeneratorResponse, MessageFormat } from '@healthit-care/shared';

type TestScenario = 'happy-path' | 'missing-required' | 'invalid-data' | 'edge-cases';

const TestCaseGenerator: React.FC = () => {
  const [interfaceName, setInterfaceName] = useState('');
  const [messageType, setMessageType] = useState('ADT^A01');
  const [format, setFormat] = useState<MessageFormat>('hl7v2');
  const [sampleMessage, setSampleMessage] = useState('');
  const [scenarios, setScenarios] = useState<TestScenario[]>(['happy-path']);
  const [testCount, setTestCount] = useState(10);
  const [result, setResult] = useState<TestGeneratorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cases' | 'suite'>('cases');
  const [selectedCase, setSelectedCase] = useState<number>(0);

  const handleScenarioToggle = (scenario: TestScenario) => {
    if (scenarios.includes(scenario)) {
      setScenarios(scenarios.filter(s => s !== scenario));
    } else {
      setScenarios([...scenarios, scenario]);
    }
  };

  const handleGenerate = async () => {
    if (!interfaceName.trim()) {
      setError('Interface name is required');
      return;
    }

    if (scenarios.length === 0) {
      setError('Please select at least one test scenario');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/testgen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interfaceSpec: {
            name: interfaceName,
            messageType,
            format,
            sampleMessage: sampleMessage || undefined,
          },
          testScenarios: scenarios,
          count: testCount,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to generate test cases');
      }

      setResult(data.data);
      setActiveTab('cases');
      setSelectedCase(0);
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
    if (result?.testSuite) {
      const blob = new Blob([result.testSuite], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-suite-${interfaceName.replace(/\s+/g, '-').toLowerCase()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="back-link">← Back to Dashboard</Link>
        <h1>Integration Test Case Generator</h1>
        <p>Generate comprehensive test cases for healthcare interfaces</p>
      </header>

      <div className="container">
        {/* Input Panel */}
        <div className="panel">
          <h2>Test Configuration</h2>

          <div className="form-section">
            <h3>Interface Specification</h3>

            <div className="form-group">
              <label>Interface Name:</label>
              <input
                type="text"
                value={interfaceName}
                onChange={(e) => setInterfaceName(e.target.value)}
                placeholder="e.g., ADT Feed"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Message Format:</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as MessageFormat)}
                >
                  <option value="hl7v2">HL7 v2.x</option>
                  <option value="fhir-json">FHIR JSON</option>
                  <option value="fhir-xml">FHIR XML</option>
                  <option value="cda">CDA</option>
                </select>
              </div>

              <div className="form-group">
                <label>Message Type:</label>
                <input
                  type="text"
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                  placeholder="e.g., ADT^A01"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Sample Message (optional):</label>
              <textarea
                value={sampleMessage}
                onChange={(e) => setSampleMessage(e.target.value)}
                placeholder="Paste a sample message to use as a template..."
                style={{ minHeight: '100px' }}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Test Scenarios</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Select the types of test cases to generate
            </p>

            <div className="checkbox-group">
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="happy-path"
                  checked={scenarios.includes('happy-path')}
                  onChange={() => handleScenarioToggle('happy-path')}
                />
                <label htmlFor="happy-path">
                  <strong>Happy Path</strong>
                  <span style={{ display: 'block', fontSize: '0.625rem' }}>Valid messages that should process successfully</span>
                </label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="missing-required"
                  checked={scenarios.includes('missing-required')}
                  onChange={() => handleScenarioToggle('missing-required')}
                />
                <label htmlFor="missing-required">
                  <strong>Missing Required Fields</strong>
                  <span style={{ display: 'block', fontSize: '0.625rem' }}>Messages with required fields removed</span>
                </label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="invalid-data"
                  checked={scenarios.includes('invalid-data')}
                  onChange={() => handleScenarioToggle('invalid-data')}
                />
                <label htmlFor="invalid-data">
                  <strong>Invalid Data</strong>
                  <span style={{ display: 'block', fontSize: '0.625rem' }}>Messages with malformed or invalid data</span>
                </label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="edge-cases"
                  checked={scenarios.includes('edge-cases')}
                  onChange={() => handleScenarioToggle('edge-cases')}
                />
                <label htmlFor="edge-cases">
                  <strong>Edge Cases</strong>
                  <span style={{ display: 'block', fontSize: '0.625rem' }}>Boundary conditions and special characters</span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label>Number of Test Cases:</label>
              <input
                type="number"
                value={testCount}
                onChange={(e) => setTestCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                min="1"
                max="50"
              />
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Test Cases'}
          </button>
        </div>

        {/* Result Panel */}
        <div className="panel">
          <h2>Generated Tests</h2>

          {loading && (
            <div className="loading">Generating test cases...</div>
          )}

          {result && !loading && (
            <>
              <div className="result-section">
                <div className="metadata">
                  <div className="metadata-item">
                    <div className="value">{result.testCases.length}</div>
                    <div className="label">Test Cases</div>
                  </div>
                  <div className="metadata-item">
                    <div className="value">{result.format.toUpperCase()}</div>
                    <div className="label">Format</div>
                  </div>
                </div>
              </div>

              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'cases' ? 'active' : ''}`}
                  onClick={() => setActiveTab('cases')}
                >
                  Test Cases
                </button>
                <button
                  className={`tab ${activeTab === 'suite' ? 'active' : ''}`}
                  onClick={() => setActiveTab('suite')}
                >
                  Full Test Suite
                </button>
              </div>

              {activeTab === 'cases' && (
                <div className="result-section">
                  {/* Test Case List */}
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ width: '40%', maxHeight: '400px', overflowY: 'auto' }}>
                      {result.testCases.map((tc, idx) => (
                        <div
                          key={tc.id}
                          onClick={() => setSelectedCase(idx)}
                          className={`test-case-item ${selectedCase === idx ? 'selected' : ''}`}
                          style={{
                            padding: '0.5rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-color)',
                            background: selectedCase === idx ? 'var(--primary-light)' : 'transparent',
                          }}
                        >
                          <strong style={{ fontSize: '0.75rem' }}>{tc.name}</strong>
                          <div style={{ marginTop: '0.25rem' }}>
                            {tc.tags.map(tag => (
                              <span key={tag} className="tag" style={{ fontSize: '0.5rem', marginRight: '0.25rem' }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Selected Test Case Details */}
                    <div style={{ width: '60%' }}>
                      {result.testCases[selectedCase] && (
                        <div>
                          <h4>{result.testCases[selectedCase].name}</h4>
                          <p style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                            {result.testCases[selectedCase].description}
                          </p>

                          <h5 style={{ marginTop: '1rem' }}>Input Message</h5>
                          <pre style={{
                            fontSize: '0.625rem',
                            background: '#f1f5f9',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            maxHeight: '150px',
                            overflow: 'auto',
                          }}>
                            {result.testCases[selectedCase].inputMessage}
                          </pre>

                          <h5 style={{ marginTop: '0.5rem' }}>Expected Output</h5>
                          <p style={{ fontSize: '0.75rem' }}>
                            {result.testCases[selectedCase].expectedOutput}
                          </p>

                          <h5 style={{ marginTop: '0.5rem' }}>Validation Rules</h5>
                          <ul style={{ fontSize: '0.625rem', paddingLeft: '1rem' }}>
                            {result.testCases[selectedCase].validationRules.map((rule, idx) => (
                              <li key={idx}>
                                <strong>{rule.field}</strong> {rule.operator}
                                {rule.expectedValue && ` "${rule.expectedValue}"`}
                                <br />
                                <span style={{ color: 'var(--text-secondary)' }}>{rule.description}</span>
                              </li>
                            ))}
                          </ul>

                          <button
                            className="btn btn-secondary"
                            onClick={() => handleCopy(result.testCases[selectedCase].inputMessage)}
                            style={{ marginTop: '0.5rem' }}
                          >
                            Copy Input
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'suite' && (
                <div className="result-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3>Complete Test Suite</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => handleCopy(result.testSuite)}>
                        Copy
                      </button>
                      <button className="btn btn-secondary" onClick={handleDownload}>
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className="schema-output" style={{ maxHeight: '400px' }}>
                    {result.testSuite}
                  </pre>
                </div>
              )}
            </>
          )}

          {!result && !loading && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              Configure test parameters and click "Generate Test Cases" to see results
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestCaseGenerator;
