import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  InterfaceDoc,
  DocGeneratorResponse,
  EndpointConfig,
  DataElement,
} from '@healthit-care/shared';

const InterfaceDocGenerator: React.FC = () => {
  const [interfaces, setInterfaces] = useState<InterfaceDoc[]>([]);
  const [outputFormat, setOutputFormat] = useState<'markdown' | 'html' | 'json'>('markdown');
  const [includeDataFlow, setIncludeDataFlow] = useState(true);
  const [includeEndpointCatalog, setIncludeEndpointCatalog] = useState(true);
  const [result, setResult] = useState<DocGeneratorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for adding new interface
  const [newInterface, setNewInterface] = useState<Partial<InterfaceDoc>>({
    name: '',
    description: '',
    sourceSystem: '',
    targetSystem: '',
    protocol: 'HL7v2',
    direction: 'outbound',
    messageTypes: [],
    endpoints: [],
    dataElements: [],
  });
  const [messageTypeInput, setMessageTypeInput] = useState('');

  const handleAddInterface = () => {
    if (!newInterface.name || !newInterface.sourceSystem || !newInterface.targetSystem) {
      setError('Name, source system, and target system are required');
      return;
    }

    const iface: InterfaceDoc = {
      id: `iface_${Date.now()}`,
      name: newInterface.name!,
      description: newInterface.description || '',
      sourceSystem: newInterface.sourceSystem!,
      targetSystem: newInterface.targetSystem!,
      protocol: newInterface.protocol as any,
      direction: newInterface.direction as any,
      messageTypes: newInterface.messageTypes || [],
      endpoints: newInterface.endpoints || [],
      dataElements: newInterface.dataElements || [],
    };

    setInterfaces([...interfaces, iface]);
    setNewInterface({
      name: '',
      description: '',
      sourceSystem: '',
      targetSystem: '',
      protocol: 'HL7v2',
      direction: 'outbound',
      messageTypes: [],
      endpoints: [],
      dataElements: [],
    });
    setError(null);
  };

  const handleAddMessageType = () => {
    if (messageTypeInput.trim()) {
      setNewInterface({
        ...newInterface,
        messageTypes: [...(newInterface.messageTypes || []), messageTypeInput.trim()],
      });
      setMessageTypeInput('');
    }
  };

  const handleRemoveInterface = (index: number) => {
    setInterfaces(interfaces.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (interfaces.length === 0) {
      setError('Please add at least one interface definition');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/docs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interfaces,
          outputFormat,
          includeDataFlowDiagram: includeDataFlow,
          includeEndpointCatalog,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to generate documentation');
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.documentation) {
      navigator.clipboard.writeText(result.documentation);
    }
  };

  const handleDownload = () => {
    if (result?.documentation) {
      const extension = outputFormat === 'html' ? 'html' : outputFormat === 'json' ? 'json' : 'md';
      const blob = new Blob([result.documentation], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interface-documentation.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="back-link">← Back to Dashboard</Link>
        <h1>Interface Documentation Generator</h1>
        <p>Generate comprehensive documentation for healthcare interfaces</p>
      </header>

      <div className="container">
        {/* Input Panel */}
        <div className="panel">
          <h2>Interface Definitions</h2>

          {/* Add Interface Form */}
          <div className="form-section">
            <h3>Add New Interface</h3>

            <div className="form-group">
              <label>Interface Name:</label>
              <input
                type="text"
                value={newInterface.name}
                onChange={(e) => setNewInterface({ ...newInterface, name: e.target.value })}
                placeholder="e.g., ADT Feed"
              />
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={newInterface.description}
                onChange={(e) => setNewInterface({ ...newInterface, description: e.target.value })}
                placeholder="Brief description of the interface purpose"
                style={{ minHeight: '60px' }}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Source System:</label>
                <input
                  type="text"
                  value={newInterface.sourceSystem}
                  onChange={(e) => setNewInterface({ ...newInterface, sourceSystem: e.target.value })}
                  placeholder="e.g., Epic EHR"
                />
              </div>

              <div className="form-group">
                <label>Target System:</label>
                <input
                  type="text"
                  value={newInterface.targetSystem}
                  onChange={(e) => setNewInterface({ ...newInterface, targetSystem: e.target.value })}
                  placeholder="e.g., Lab System"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Protocol:</label>
                <select
                  value={newInterface.protocol}
                  onChange={(e) => setNewInterface({ ...newInterface, protocol: e.target.value as any })}
                >
                  <option value="HL7v2">HL7 v2.x</option>
                  <option value="FHIR">FHIR</option>
                  <option value="REST">REST API</option>
                  <option value="SOAP">SOAP</option>
                  <option value="FILE">File Transfer</option>
                  <option value="DATABASE">Database</option>
                </select>
              </div>

              <div className="form-group">
                <label>Direction:</label>
                <select
                  value={newInterface.direction}
                  onChange={(e) => setNewInterface({ ...newInterface, direction: e.target.value as any })}
                >
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                  <option value="bidirectional">Bidirectional</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Message Types:</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={messageTypeInput}
                  onChange={(e) => setMessageTypeInput(e.target.value)}
                  placeholder="e.g., ADT^A01"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMessageType()}
                />
                <button className="btn btn-secondary" onClick={handleAddMessageType}>Add</button>
              </div>
              {newInterface.messageTypes && newInterface.messageTypes.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  {newInterface.messageTypes.map((type, idx) => (
                    <span key={idx} className="tag">
                      {type}
                      <button
                        onClick={() => setNewInterface({
                          ...newInterface,
                          messageTypes: newInterface.messageTypes?.filter((_, i) => i !== idx)
                        })}
                        style={{ marginLeft: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button className="btn btn-primary" onClick={handleAddInterface}>
              Add Interface
            </button>
          </div>

          {/* Interface List */}
          {interfaces.length > 0 && (
            <div className="form-section">
              <h3>Added Interfaces ({interfaces.length})</h3>
              {interfaces.map((iface, idx) => (
                <div key={iface.id} className="interface-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <strong>{iface.name}</strong>
                      <p style={{ fontSize: '0.75rem', margin: '0.25rem 0' }}>
                        {iface.sourceSystem} → {iface.targetSystem} ({iface.protocol})
                      </p>
                      {iface.messageTypes.length > 0 && (
                        <p style={{ fontSize: '0.625rem', color: 'var(--text-secondary)' }}>
                          Messages: {iface.messageTypes.join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleRemoveInterface(idx)}
                      style={{ padding: '0.25rem 0.5rem' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Output Options */}
          <div className="form-section">
            <h3>Output Options</h3>

            <div className="form-group">
              <label>Output Format:</label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as any)}
              >
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
                <option value="json">JSON</option>
              </select>
            </div>

            <div className="checkbox-group">
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="dataFlow"
                  checked={includeDataFlow}
                  onChange={(e) => setIncludeDataFlow(e.target.checked)}
                />
                <label htmlFor="dataFlow">Include Data Flow Diagram</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="endpointCatalog"
                  checked={includeEndpointCatalog}
                  onChange={(e) => setIncludeEndpointCatalog(e.target.checked)}
                />
                <label htmlFor="endpointCatalog">Include Endpoint Catalog</label>
              </div>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading || interfaces.length === 0}
          >
            {loading ? 'Generating...' : 'Generate Documentation'}
          </button>
        </div>

        {/* Result Panel */}
        <div className="panel">
          <h2>Generated Documentation</h2>

          {loading && (
            <div className="loading">Generating documentation...</div>
          )}

          {result && !loading && (
            <>
              <div className="result-section">
                <div className="metadata">
                  <div className="metadata-item">
                    <div className="value">{result.interfaceCount}</div>
                    <div className="label">Interfaces</div>
                  </div>
                  <div className="metadata-item">
                    <div className="value">{result.format.toUpperCase()}</div>
                    <div className="label">Format</div>
                  </div>
                </div>
              </div>

              <div className="result-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3>Output</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={handleCopy}>Copy</button>
                    <button className="btn btn-secondary" onClick={handleDownload}>Download</button>
                  </div>
                </div>
                <pre className="schema-output" style={{ maxHeight: '500px' }}>
                  {result.documentation}
                </pre>
              </div>
            </>
          )}

          {!result && !loading && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              Add interfaces and click "Generate Documentation" to see results
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterfaceDocGenerator;
