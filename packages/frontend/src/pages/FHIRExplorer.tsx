import { useState } from 'react';
import { FHIRExploreResponse, FHIRResourceNode } from '@healthit-care/shared';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.startsWith('http') ? import.meta.env.VITE_API_URL : `https://${import.meta.env.VITE_API_URL}`}/api/v1`
  : '/api/v1';

function TreeNode({ node, depth = 0 }: { node: FHIRResourceNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        style={{
          cursor: hasChildren ? 'pointer' : 'default',
          padding: '4px',
          borderRadius: '3px',
          background: node.isReference ? '#e3f2fd' : 'transparent',
        }}
      >
        {hasChildren && <span>{expanded ? '▼ ' : '▶ '}</span>}
        <strong>{node.name}</strong>
        {node.value !== null && (
          <span style={{ color: '#666', marginLeft: '8px' }}>
            {typeof node.value === 'string' ? `"${node.value}"` : String(node.value)}
          </span>
        )}
        <span style={{ color: '#999', marginLeft: '8px', fontSize: '11px' }}>
          ({node.dataType})
        </span>
        {node.isReference && (
          <span style={{ color: '#1976d2', marginLeft: '8px', fontSize: '11px' }}>
            → {node.referenceTarget}
          </span>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child, i) => (
            <TreeNode key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FHIRExplorer() {
  const [resource, setResource] = useState('');
  const [format, setFormat] = useState<'json' | 'xml'>('json');
  const [result, setResult] = useState<FHIRExploreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'tree' | 'raw'>('tree');

  const loadSample = async () => {
    try {
      const response = await fetch(`${API_BASE}/fhir/sample`);
      const data = await response.json();
      if (data.success) {
        setResource(data.data.resource);
        setFormat('json');
      }
    } catch (err) {
      setError('Failed to load sample');
    }
  };

  const explore = async () => {
    if (!resource.trim()) {
      setError('Please enter a FHIR resource');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/fhir/explore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource,
          format,
          resolveReferences: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error?.message || 'Explore failed');
      }
    } catch (err) {
      setError('Failed to explore resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>FHIR Resource Explorer</h1>
      <p>Visualize and validate FHIR resources with tree view and reference tracking.</p>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={loadSample} style={{ marginRight: '10px' }}>
          Load Sample Patient
        </button>
        <button onClick={explore} disabled={loading}>
          {loading ? 'Exploring...' : 'Explore Resource'}
        </button>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as 'json' | 'xml')}
          style={{ marginLeft: '10px', padding: '8px' }}
        >
          <option value="json">JSON</option>
          <option value="xml">XML</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3>Input Resource</h3>
          <textarea
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            placeholder={`Paste your FHIR ${format.toUpperCase()} resource here...`}
            style={{
              width: '100%',
              height: '400px',
              fontFamily: 'monospace',
              fontSize: '11px',
            }}
          />
        </div>

        <div>
          {result && (
            <>
              <h3>Resource Info</h3>
              <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
                <p><strong>Type:</strong> {result.resourceType}</p>
                <p><strong>ID:</strong> {result.resourceId}</p>
                <p><strong>Version:</strong> {result.version}</p>
                {result.lastUpdated && <p><strong>Last Updated:</strong> {result.lastUpdated}</p>}
                <p><strong>Elements:</strong> {result.metadata.elementCount}</p>
                <p><strong>References:</strong> {result.metadata.referenceCount}</p>
                <p><strong>Extensions:</strong> {result.metadata.extensionCount}</p>
              </div>

              <h4>Validation</h4>
              <div style={{
                background: result.validation.isValid ? '#e8f5e9' : '#ffebee',
                padding: '10px',
                borderRadius: '5px',
                marginBottom: '15px',
              }}>
                <p><strong>Status:</strong> {result.validation.isValid ? '✓ Valid' : '✗ Invalid'}</p>
                {result.validation.issues.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    {result.validation.issues.map((issue, i) => (
                      <p key={i} style={{
                        color: issue.severity === 'error' ? 'red' : issue.severity === 'warning' ? 'orange' : 'blue',
                        fontSize: '12px',
                      }}>
                        [{issue.severity}] {issue.field}: {issue.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {result.references.length > 0 && (
                <>
                  <h4>References</h4>
                  <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '5px' }}>
                    {result.references.map((ref, i) => (
                      <p key={i} style={{ fontSize: '12px' }}>
                        → {ref.reference} {ref.display && `(${ref.display})`}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </>
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
          <div style={{ marginBottom: '10px' }}>
            <button
              onClick={() => setView('tree')}
              style={{
                marginRight: '10px',
                fontWeight: view === 'tree' ? 'bold' : 'normal',
              }}
            >
              Tree View
            </button>
            <button
              onClick={() => setView('raw')}
              style={{
                fontWeight: view === 'raw' ? 'bold' : 'normal',
              }}
            >
              Raw View
            </button>
          </div>

          {view === 'tree' ? (
            <div style={{
              background: '#fafafa',
              padding: '15px',
              borderRadius: '5px',
              maxHeight: '500px',
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}>
              <TreeNode node={result.tree} />
            </div>
          ) : (
            <pre style={{
              background: '#1e1e1e',
              color: '#d4d4d4',
              padding: '15px',
              borderRadius: '5px',
              overflow: 'auto',
              maxHeight: '500px',
              fontSize: '11px',
            }}>
              {result.raw}
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
