import { useState } from 'react';
import { TranslationTableResponse } from '@healthit-care/shared';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.startsWith('http') ? import.meta.env.VITE_API_URL : `https://${import.meta.env.VITE_API_URL}`}/api/v1`
  : '/api/v1';

interface TableEntry {
  key: string;
  value: string;
  description: string;
  category: string;
}

export default function TranslationTable() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceSystem, setSourceSystem] = useState('');
  const [targetSystem, setTargetSystem] = useState('');
  const [outputFormat, setOutputFormat] = useState('cloverleaf-xlt');
  const [includeComments, setIncludeComments] = useState(true);
  const [entries, setEntries] = useState<TableEntry[]>([
    { key: '', value: '', description: '', category: '' }
  ]);
  const [result, setResult] = useState<TranslationTableResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSample = async () => {
    try {
      const response = await fetch(`${API_BASE}/xlttable/sample`);
      const data = await response.json();
      if (data.success) {
        setEntries(data.data.entries.map((e: any) => ({
          key: e.key,
          value: e.value,
          description: e.description || '',
          category: e.category || '',
        })));
        setName('Sample Translation Table');
        setSourceSystem('SourceSystem');
        setTargetSystem('TargetSystem');
      }
    } catch (err) {
      setError('Failed to load sample');
    }
  };

  const addEntry = () => {
    setEntries([...entries, { key: '', value: '', description: '', category: '' }]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof TableEntry, value: string) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    setEntries(newEntries);
  };

  const generate = async () => {
    if (!name || !sourceSystem || !targetSystem) {
      setError('Please fill in table name, source system, and target system');
      return;
    }

    const validEntries = entries.filter(e => e.key && e.value);
    if (validEntries.length === 0) {
      setError('Please add at least one key-value entry');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/xlttable/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          sourceSystem,
          targetSystem,
          entries: validEntries,
          outputFormat,
          includeComments,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error?.message || 'Generation failed');
      }
    } catch (err) {
      setError('Failed to generate translation table');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = () => {
    if (!result) return;
    const blob = new Blob([result.outputFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.outputFile.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Translation Table Generator</h1>
      <p>Generate translation tables for Cloverleaf and other integration engines.</p>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={loadSample} style={{ marginRight: '10px' }}>
          Load Sample Entries
        </button>
        <button onClick={generate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Table'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label>Table Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Gender Codes"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div>
          <label>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description of the table"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div>
          <label>Source System *</label>
          <input
            type="text"
            value={sourceSystem}
            onChange={(e) => setSourceSystem(e.target.value)}
            placeholder="e.g., Epic"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div>
          <label>Target System *</label>
          <input
            type="text"
            value={targetSystem}
            onChange={(e) => setTargetSystem(e.target.value)}
            placeholder="e.g., Cerner"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div>
          <label>Output Format</label>
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="cloverleaf-xlt">Cloverleaf XLT</option>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="xml">XML</option>
            <option value="properties">Properties</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '25px' }}>
          <input
            type="checkbox"
            checked={includeComments}
            onChange={(e) => setIncludeComments(e.target.checked)}
            id="includeComments"
          />
          <label htmlFor="includeComments" style={{ marginLeft: '8px' }}>Include Comments</label>
        </div>
      </div>

      <h3>Entries</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Key *</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Value *</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Description</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Category</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', width: '50px' }}></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={i}>
              <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                <input
                  type="text"
                  value={entry.key}
                  onChange={(e) => updateEntry(i, 'key', e.target.value)}
                  style={{ width: '100%', padding: '4px' }}
                />
              </td>
              <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                <input
                  type="text"
                  value={entry.value}
                  onChange={(e) => updateEntry(i, 'value', e.target.value)}
                  style={{ width: '100%', padding: '4px' }}
                />
              </td>
              <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                <input
                  type="text"
                  value={entry.description}
                  onChange={(e) => updateEntry(i, 'description', e.target.value)}
                  style={{ width: '100%', padding: '4px' }}
                />
              </td>
              <td style={{ padding: '4px', border: '1px solid #ddd' }}>
                <input
                  type="text"
                  value={entry.category}
                  onChange={(e) => updateEntry(i, 'category', e.target.value)}
                  style={{ width: '100%', padding: '4px' }}
                />
              </td>
              <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>
                <button onClick={() => removeEntry(i)} style={{ color: 'red' }}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addEntry}>+ Add Entry</button>

      {error && (
        <div style={{ color: 'red', marginTop: '10px', padding: '10px', background: '#fee' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Generated Output</h3>
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '10px' }}>
            <p><strong>Filename:</strong> {result.outputFile.filename}</p>
            <p><strong>Total Entries:</strong> {result.statistics.totalEntries}</p>
            <p><strong>Categories:</strong> {result.statistics.categories}</p>
            {result.statistics.duplicateKeys.length > 0 && (
              <p style={{ color: 'orange' }}>
                <strong>Warning - Duplicate Keys:</strong> {result.statistics.duplicateKeys.join(', ')}
              </p>
            )}
          </div>
          <button onClick={downloadFile} style={{ marginBottom: '10px' }}>
            Download {result.outputFile.filename}
          </button>
          <pre style={{
            background: '#1e1e1e',
            color: '#d4d4d4',
            padding: '15px',
            borderRadius: '5px',
            overflow: 'auto',
            maxHeight: '400px',
            fontSize: '12px',
          }}>
            {result.outputFile.content}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: '#007bff' }}>← Back to Dashboard</a>
      </div>
    </div>
  );
}
