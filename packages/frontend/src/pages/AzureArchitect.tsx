import { useState, useEffect } from 'react';
import {
  AzureArchitectResponse,
  ArchitectureTemplate,
  HealthcareUseCase,
} from '@healthit-care/shared';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.startsWith('http') ? import.meta.env.VITE_API_URL : `https://${import.meta.env.VITE_API_URL}`}/api/v1`
  : '/api/v1';

interface UseCase {
  id: HealthcareUseCase;
  name: string;
  description: string;
}

export default function AzureArchitect() {
  const [query, setQuery] = useState('');
  const [selectedUseCase, setSelectedUseCase] = useState<HealthcareUseCase | ''>('');
  const [result, setResult] = useState<AzureArchitectResponse | null>(null);
  const [architectures, setArchitectures] = useState<ArchitectureTemplate[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'answer' | 'architecture' | 'services' | 'practices'>('answer');
  const [selectedArch, setSelectedArch] = useState<ArchitectureTemplate | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [archRes, ucRes] = await Promise.all([
          fetch(`${API_BASE}/azure/architectures`),
          fetch(`${API_BASE}/azure/use-cases`),
        ]);

        const archData = await archRes.json();
        const ucData = await ucRes.json();

        if (archData.success) setArchitectures(archData.data);
        if (ucData.success) setUseCases(ucData.data);
      } catch (err) {
        console.error('Failed to load initial data');
      }
    };

    loadData();
  }, []);

  const suggestedQuestions = [
    'How do I set up a FHIR API in Azure?',
    'How do I make Azure HIPAA compliant?',
    'How do I host Cloverleaf in Azure?',
    'How do I connect on-premises to Azure?',
    'What does it cost to run healthcare workloads?',
  ];

  const askQuestion = async (questionText?: string) => {
    const questionToAsk = questionText || query;
    if (!questionToAsk.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/azure/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: questionToAsk,
          context: selectedUseCase ? { useCase: selectedUseCase } : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setActiveTab('answer');
      } else {
        setError(data.error?.message || 'Query failed');
      }
    } catch (err) {
      setError('Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (question: string) => {
    setQuery(question);
    askQuestion(question);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Azure Cloud Architect Hub</h1>
      <p>Get architecture guidance, best practices, and service recommendations for healthcare workloads in Azure.</p>

      {/* Query Section */}
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontWeight: 'bold' }}>Ask a Question</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
              placeholder="e.g., How do I set up a FHIR API in Azure?"
              style={{ flex: 1, padding: '10px', fontSize: '14px' }}
            />
            <select
              value={selectedUseCase}
              onChange={(e) => setSelectedUseCase(e.target.value as HealthcareUseCase)}
              style={{ padding: '10px', minWidth: '200px' }}
            >
              <option value="">All Use Cases</option>
              {useCases.map(uc => (
                <option key={uc.id} value={uc.id}>{uc.name}</option>
              ))}
            </select>
            <button onClick={() => askQuestion()} disabled={loading} style={{ padding: '10px 20px' }}>
              {loading ? 'Asking...' : 'Ask'}
            </button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#666' }}>Suggested questions:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(q)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  background: '#e3f2fd',
                  border: '1px solid #90caf9',
                  borderRadius: '15px',
                  cursor: 'pointer',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ color: 'red', padding: '10px', background: '#fee', marginBottom: '20px', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div>
          {/* Tabs */}
          <div style={{ marginBottom: '15px', borderBottom: '2px solid #e0e0e0' }}>
            {[
              { id: 'answer', label: 'Answer' },
              { id: 'architecture', label: `Architectures (${result.relevantArchitectures.length})` },
              { id: 'services', label: `Services (${result.recommendedServices.length})` },
              { id: 'practices', label: `Best Practices (${result.bestPractices.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: activeTab === tab.id ? '#1976d2' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  borderRadius: '4px 4px 0 0',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Answer Tab */}
          {activeTab === 'answer' && (
            <div style={{ background: '#fafafa', padding: '20px', borderRadius: '8px' }}>
              <pre style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '1.6',
                margin: 0,
              }}>
                {result.answer}
              </pre>

              {result.additionalResources.length > 0 && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Additional Resources</h4>
                  {result.additionalResources.map((res, i) => (
                    <a
                      key={i}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'block', marginBottom: '5px', color: '#1976d2' }}
                    >
                      {res.title} ({res.type})
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Architectures Tab */}
          {activeTab === 'architecture' && (
            <div>
              {result.relevantArchitectures.length === 0 ? (
                <p>No specific architectures found. Browse all architectures below.</p>
              ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {result.relevantArchitectures.map(arch => (
                    <div
                      key={arch.id}
                      style={{
                        background: selectedArch?.id === arch.id ? '#e3f2fd' : '#fafafa',
                        padding: '15px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: selectedArch?.id === arch.id ? '2px solid #1976d2' : '2px solid transparent',
                      }}
                      onClick={() => setSelectedArch(selectedArch?.id === arch.id ? null : arch)}
                    >
                      <h3 style={{ margin: '0 0 5px 0' }}>{arch.name}</h3>
                      <p style={{ margin: '0 0 10px 0', color: '#666' }}>{arch.description}</p>
                      <p style={{ margin: 0, fontSize: '12px' }}>
                        <strong>Est. Cost:</strong> {arch.estimatedMonthlyCost}
                      </p>

                      {selectedArch?.id === arch.id && (
                        <div style={{ marginTop: '15px' }}>
                          <h4>Architecture Diagram</h4>
                          <pre style={{
                            background: '#1e1e1e',
                            color: '#d4d4d4',
                            padding: '15px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            fontSize: '11px',
                            lineHeight: '1.3',
                          }}>
                            {arch.diagram}
                          </pre>

                          <h4>Key Considerations</h4>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {arch.considerations.map((c, i) => (
                              <li key={i} style={{ marginBottom: '5px' }}>{c}</li>
                            ))}
                          </ul>

                          <h4>Compliance Notes</h4>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {arch.complianceNotes.map((n, i) => (
                              <li key={i} style={{ marginBottom: '5px' }}>{n}</li>
                            ))}
                          </ul>

                          <h4>Required Services</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {arch.services.map(s => (
                              <span
                                key={s}
                                style={{
                                  padding: '4px 8px',
                                  background: '#e3f2fd',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                }}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
              {result.recommendedServices.map(service => (
                <div
                  key={service.id}
                  style={{
                    background: '#fafafa',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <h4 style={{ margin: '0 0 5px 0' }}>
                    {service.name}
                    {service.hipaaCompliant && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '10px',
                        background: '#4caf50',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '10px',
                      }}>
                        HIPAA
                      </span>
                    )}
                  </h4>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#666' }}>
                    {service.description}
                  </p>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px' }}>
                    <strong>Healthcare Use:</strong> {service.healthcareRelevance}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span>Pricing: {service.pricingTier}</span>
                    <a href={service.documentationUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
                      Docs →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Best Practices Tab */}
          {activeTab === 'practices' && (
            <div style={{ display: 'grid', gap: '10px' }}>
              {result.bestPractices.map(bp => (
                <div
                  key={bp.id}
                  style={{
                    background: '#fafafa',
                    padding: '15px',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${
                      bp.priority === 'critical' ? '#f44336' :
                      bp.priority === 'high' ? '#ff9800' :
                      bp.priority === 'medium' ? '#2196f3' : '#4caf50'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0 }}>{bp.title}</h4>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: bp.priority === 'critical' ? '#ffebee' :
                                  bp.priority === 'high' ? '#fff3e0' : '#e3f2fd',
                      color: bp.priority === 'critical' ? '#c62828' :
                             bp.priority === 'high' ? '#ef6c00' : '#1565c0',
                    }}>
                      {bp.priority}
                    </span>
                  </div>
                  <p style={{ margin: '10px 0', fontSize: '13px' }}>{bp.description}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                    <strong>Implementation:</strong> {bp.implementation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Architectures Browser */}
      {!result && architectures.length > 0 && (
        <div>
          <h2>Reference Architectures</h2>
          <p style={{ color: '#666' }}>Click on an architecture to view the diagram and details.</p>
          <div style={{ display: 'grid', gap: '15px' }}>
            {architectures.map(arch => (
              <div
                key={arch.id}
                style={{
                  background: selectedArch?.id === arch.id ? '#e3f2fd' : '#fafafa',
                  padding: '15px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: selectedArch?.id === arch.id ? '2px solid #1976d2' : '2px solid transparent',
                }}
                onClick={() => setSelectedArch(selectedArch?.id === arch.id ? null : arch)}
              >
                <h3 style={{ margin: '0 0 5px 0' }}>{arch.name}</h3>
                <p style={{ margin: '0 0 10px 0', color: '#666' }}>{arch.description}</p>

                {selectedArch?.id === arch.id && (
                  <div style={{ marginTop: '15px' }}>
                    <pre style={{
                      background: '#1e1e1e',
                      color: '#d4d4d4',
                      padding: '15px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '11px',
                    }}>
                      {arch.diagram}
                    </pre>
                    <p><strong>Est. Cost:</strong> {arch.estimatedMonthlyCost}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: '#007bff' }}>← Back to Dashboard</a>
      </div>
    </div>
  );
}
