import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TransformResponse,
  TransformOptions,
  MessageFormat,
} from '@healthit-care/shared';
import { transformMessage } from '../services/api';

type ResultTab = 'output' | 'translation' | 'mappings' | 'warnings';

const DEFAULT_TRANSFORM_OPTIONS: TransformOptions = {
  generateTranslationFile: true,
  translationFileFormat: 'xslt',
  includeComments: true,
  prettyPrint: true,
  validateOutput: true,
  preserveExtensions: false,
};

const MESSAGE_FORMATS: { id: MessageFormat; name: string; description: string }[] = [
  { id: 'hl7v2', name: 'HL7 v2.x', description: 'HL7 Version 2 messages' },
  { id: 'fhir-json', name: 'FHIR JSON', description: 'FHIR R4 in JSON format' },
  { id: 'fhir-xml', name: 'FHIR XML', description: 'FHIR R4 in XML format' },
  { id: 'cda', name: 'CDA', description: 'Clinical Document Architecture' },
  { id: 'csv', name: 'CSV', description: 'Comma-separated values' },
];

const SUPPORTED_TRANSFORMATIONS: { from: MessageFormat; to: MessageFormat[] }[] = [
  { from: 'hl7v2', to: ['fhir-json', 'fhir-xml', 'cda', 'csv'] },
  { from: 'fhir-json', to: ['hl7v2', 'fhir-xml', 'cda', 'csv'] },
  { from: 'fhir-xml', to: ['hl7v2', 'fhir-json', 'cda'] },
  { from: 'cda', to: ['fhir-json', 'fhir-xml'] },
  { from: 'csv', to: ['fhir-json', 'hl7v2'] },
];

const MessageTransformer = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [inputFormat, setInputFormat] = useState<MessageFormat>('hl7v2');
  const [outputFormat, setOutputFormat] = useState<MessageFormat>('fhir-json');
  const [options, setOptions] = useState<TransformOptions>(DEFAULT_TRANSFORM_OPTIONS);
  const [result, setResult] = useState<TransformResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>('output');

  const getAvailableOutputFormats = (): MessageFormat[] => {
    const supported = SUPPORTED_TRANSFORMATIONS.find(t => t.from === inputFormat);
    return supported?.to || [];
  };

  const handleInputFormatChange = (format: MessageFormat) => {
    setInputFormat(format);
    const available = SUPPORTED_TRANSFORMATIONS.find(t => t.from === format)?.to || [];
    if (!available.includes(outputFormat) && available.length > 0) {
      setOutputFormat(available[0]);
    }
  };

  const handleTransform = async () => {
    if (!inputMessage.trim()) {
      setError('Please enter a message to transform');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await transformMessage(inputMessage, inputFormat, outputFormat, options);
      setResult(response);
      setActiveTab('output');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (key: keyof TransformOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
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

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="back-link">← Back to Dashboard</Link>
        <h1>Message Transformer</h1>
        <p>Transform healthcare messages and generate translation files</p>
      </header>

      <div className="container">
        {/* Input Panel */}
        <div className="panel">
          <h2>Input</h2>

          {/* Format Selection */}
          <div className="format-selection">
            <div className="form-group">
              <label>Input Format:</label>
              <select
                value={inputFormat}
                onChange={(e) => handleInputFormatChange(e.target.value as MessageFormat)}
              >
                {Object.entries(MESSAGE_FORMATS).map(([key, value]) => (
                  <option key={key} value={key}>{value.name}</option>
                ))}
              </select>
            </div>

            <div className="format-arrow">→</div>

            <div className="form-group">
              <label>Output Format:</label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as MessageFormat)}
              >
                {getAvailableOutputFormats().map(format => (
                  <option key={format} value={format}>
                    {MESSAGE_FORMATS.find(f => f.id === format)?.name || format}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Message Input */}
          <div className="form-group">
            <label>Input Message:</label>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={inputFormat === 'hl7v2'
                ? `MSH|^~\\&|SENDER|FACILITY|RECEIVER|DEST|20231201120000||ADT^A01|MSG001|P|2.5.1
PID|||12345^^^MRN||Doe^John^A||19800115|M|||123 Main St^^City^ST^12345||555-1234
PV1||I|ICU^101^A`
                : inputFormat === 'fhir-json' || inputFormat === 'json'
                ? `{
  "resourceType": "Patient",
  "id": "example",
  "identifier": [{
    "value": "12345"
  }],
  "name": [{
    "family": "Doe",
    "given": ["John"]
  }],
  "gender": "male",
  "birthDate": "1980-01-15"
}`
                : 'Enter your message here...'
              }
            />
          </div>

          {/* Translation File Options */}
          <div className="form-group">
            <label>Translation File Format:</label>
            <select
              value={options.translationFileFormat}
              onChange={(e) => handleOptionChange('translationFileFormat', e.target.value)}
            >
              <option value="xslt">XSLT Stylesheet</option>
              <option value="jsonata">JSONata Expression</option>
              <option value="cloverleaf-xlt">Cloverleaf XLT (TCL)</option>
              <option value="mapping-table">Mapping Table (Markdown)</option>
            </select>
          </div>

          {/* Options */}
          <div className="form-group">
            <label>Options:</label>
            <div className="checkbox-group">
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="generateTranslation"
                  checked={options.generateTranslationFile}
                  onChange={(e) => handleOptionChange('generateTranslationFile', e.target.checked)}
                />
                <label htmlFor="generateTranslation">Generate Translation File</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="prettyPrint"
                  checked={options.prettyPrint}
                  onChange={(e) => handleOptionChange('prettyPrint', e.target.checked)}
                />
                <label htmlFor="prettyPrint">Pretty Print</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="includeComments"
                  checked={options.includeComments}
                  onChange={(e) => handleOptionChange('includeComments', e.target.checked)}
                />
                <label htmlFor="includeComments">Include Comments</label>
              </div>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button
            className="btn btn-primary"
            onClick={handleTransform}
            disabled={loading}
          >
            {loading ? 'Transforming...' : 'Transform Message'}
          </button>
        </div>

        {/* Result Panel */}
        <div className="panel">
          <h2>Result</h2>

          {loading && (
            <div className="loading">
              Transforming message...
            </div>
          )}

          {result && !loading && (
            <>
              {/* Metadata */}
              <div className="result-section">
                <div className="metadata">
                  <div className="metadata-item">
                    <div className="value">{result.metadata.fieldsMapped}</div>
                    <div className="label">Fields Mapped</div>
                  </div>
                  <div className="metadata-item">
                    <div className="value">{result.metadata.estimatedAccuracy}%</div>
                    <div className="label">Accuracy</div>
                  </div>
                  <div className="metadata-item">
                    <div className="value">{result.metadata.transformationComplexity}</div>
                    <div className="label">Complexity</div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'output' ? 'active' : ''}`}
                  onClick={() => setActiveTab('output')}
                >
                  Output
                </button>
                <button
                  className={`tab ${activeTab === 'translation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('translation')}
                >
                  Translation File
                </button>
                <button
                  className={`tab ${activeTab === 'mappings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('mappings')}
                >
                  Mappings ({result.mappings.length})
                </button>
                <button
                  className={`tab ${activeTab === 'warnings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('warnings')}
                >
                  Warnings ({result.warnings.length})
                </button>
              </div>

              {/* Output Tab */}
              {activeTab === 'output' && (
                <div className="result-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3>Transformed Message</h3>
                    <button className="btn btn-secondary" onClick={() => handleCopy(result.transformedMessage)}>
                      Copy
                    </button>
                  </div>
                  <pre className="schema-output">{result.transformedMessage}</pre>
                </div>
              )}

              {/* Translation File Tab */}
              {activeTab === 'translation' && (
                <div className="result-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3>{result.translationFile.filename}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => handleCopy(result.translationFile.content)}>
                        Copy
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleDownload(result.translationFile.content, result.translationFile.filename)}>
                        Download
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Format: {result.translationFile.format} | {result.translationFile.description}
                  </p>
                  <pre className="schema-output">{result.translationFile.content}</pre>
                </div>
              )}

              {/* Mappings Tab */}
              {activeTab === 'mappings' && (
                <div className="result-section">
                  {result.mappings.map((mapping, idx) => (
                    <div key={idx} className="mapping-card">
                      <div className="mapping-fields">
                        <span className="source">{mapping.sourceField}</span>
                        <span className="arrow">→</span>
                        <span className="target">{mapping.targetField}</span>
                      </div>
                      <p className="transformation">{mapping.transformation}</p>
                      {mapping.notes && (
                        <p className="notes">{mapping.notes}</p>
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
                        {warn.recommendation && <p>{warn.recommendation}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          {!result && !loading && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              Enter a message and click "Transform Message" to see results
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageTransformer;
