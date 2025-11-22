import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>HealthIT-Care</h1>
        <p>Healthcare IT utility applications for integration professionals</p>
      </header>

      <div className="app-grid">
        <Link to="/schema-generator" className="app-card">
          <div className="app-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </div>
          <h2>SQL Schema Generator</h2>
          <p>Generate optimized, healthcare-compliant database schemas from requirements or existing schemas.</p>
          <ul className="app-features">
            <li>HIPAA-compliant audit fields</li>
            <li>Soft delete patterns</li>
            <li>PHI encryption markers</li>
            <li>Detailed explanations</li>
          </ul>
          <span className="app-cta">Open Application</span>
        </Link>

        <Link to="/message-transformer" className="app-card">
          <div className="app-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
          <h2>Message Transformer</h2>
          <p>Transform healthcare messages between formats and generate translation files for integration engines.</p>
          <ul className="app-features">
            <li>HL7v2 to FHIR conversion</li>
            <li>XSLT/JSONata generation</li>
            <li>Cloverleaf XLT export</li>
            <li>Field mapping documentation</li>
          </ul>
          <span className="app-cta">Open Application</span>
        </Link>

        <Link to="/interface-docs" className="app-card">
          <div className="app-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2>Interface Documentation</h2>
          <p>Generate comprehensive documentation for healthcare interfaces with data flow diagrams.</p>
          <ul className="app-features">
            <li>Markdown/HTML/JSON output</li>
            <li>Data flow diagrams</li>
            <li>Endpoint catalogs</li>
            <li>Data element mapping</li>
          </ul>
          <span className="app-cta">Open Application</span>
        </Link>

        <Link to="/code-mapper" className="app-card">
          <div className="app-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
            </svg>
          </div>
          <h2>Code Set Mapper</h2>
          <p>Map healthcare codes between standard terminologies like ICD-10, SNOMED, and LOINC.</p>
          <ul className="app-features">
            <li>Multi-system support</li>
            <li>Cloverleaf table export</li>
            <li>CSV/JSON output</li>
            <li>Mapping accuracy stats</li>
          </ul>
          <span className="app-cta">Open Application</span>
        </Link>

        <Link to="/test-generator" className="app-card">
          <div className="app-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2>Test Case Generator</h2>
          <p>Generate comprehensive test cases for healthcare integration interfaces.</p>
          <ul className="app-features">
            <li>Happy path scenarios</li>
            <li>Edge case testing</li>
            <li>Validation rules</li>
            <li>Test suite export</li>
          </ul>
          <span className="app-cta">Open Application</span>
        </Link>

        <Link to="/config-diff" className="app-card">
          <div className="app-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <h2>Config Diff Tool</h2>
          <p>Compare configuration files and generate migration scripts between environments.</p>
          <ul className="app-features">
            <li>Multi-format support</li>
            <li>Impact assessment</li>
            <li>Migration scripts</li>
            <li>Detailed reports</li>
          </ul>
          <span className="app-cta">Open Application</span>
        </Link>

        <Link to="/change-tracker" className="app-card">
          <div className="app-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h2>Change Request Tracker</h2>
          <p>Track and manage interface change requests with status updates and activity logs.</p>
          <ul className="app-features">
            <li>Priority management</li>
            <li>Status workflow</li>
            <li>Activity logging</li>
            <li>Report generation</li>
          </ul>
          <span className="app-cta">Open Application</span>
        </Link>

        <Link to="/message-validator" className="app-card">
          <div className="app-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2>Message Validator</h2>
          <p>Validate HL7 v2 and FHIR messages against standards and custom profiles.</p>
          <ul className="app-features">
            <li>HL7v2/FHIR/CDA support</li>
            <li>Validation scoring</li>
            <li>Issue categorization</li>
            <li>Structure parsing</li>
          </ul>
          <span className="app-cta">Open Application</span>
        </Link>

        <Link to="/hl7-parser" className="app-card">
          <div className="app-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h2>HL7v2 Message Viewer</h2>
          <p>Parse and visualize HL7v2 messages with field names, segments, and component structure.</p>
          <ul className="app-features">
            <li>Segment tree view</li>
            <li>Field name lookup</li>
            <li>Component breakdown</li>
            <li>Error highlighting</li>
          </ul>
          <span className="app-cta">Open Application</span>
        </Link>

        <Link to="/translation-table" className="app-card">
          <div className="app-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10h18M3 14h18M3 18h18M3 6h18" />
            </svg>
          </div>
          <h2>Translation Table Generator</h2>
          <p>Generate translation tables for Cloverleaf and other integration engines.</p>
          <ul className="app-features">
            <li>Cloverleaf XLT export</li>
            <li>JSON/CSV/XML formats</li>
            <li>Category grouping</li>
            <li>Comments support</li>
          </ul>
          <span className="app-cta">Open Application</span>
        </Link>

        <Link to="/fhir-explorer" className="app-card">
          <div className="app-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m-3-3h6" />
            </svg>
          </div>
          <h2>FHIR Resource Explorer</h2>
          <p>Visualize and validate FHIR resources with tree view and reference tracking.</p>
          <ul className="app-features">
            <li>Interactive tree view</li>
            <li>Reference extraction</li>
            <li>Profile validation</li>
            <li>JSON/XML support</li>
          </ul>
          <span className="app-cta">Open Application</span>
        </Link>

        <Link to="/audit-logs" className="app-card">
          <div className="app-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2>Audit Log Analyzer</h2>
          <p>Analyze integration engine logs to find patterns, errors, and generate reports.</p>
          <ul className="app-features">
            <li>Multi-source support</li>
            <li>Error pattern detection</li>
            <li>Timeline visualization</li>
            <li>Report generation</li>
          </ul>
          <span className="app-cta">Open Application</span>
        </Link>

        <Link to="/azure-architect" className="app-card">
          <div className="app-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <h2>Azure Architect Hub</h2>
          <p>Get architecture guidance, best practices, and service recommendations for healthcare workloads in Azure.</p>
          <ul className="app-features">
            <li>Healthcare architectures</li>
            <li>HIPAA compliance guidance</li>
            <li>Service recommendations</li>
            <li>Cost estimation</li>
          </ul>
          <span className="app-cta">Open Application</span>
        </Link>
      </div>

      <footer className="dashboard-footer">
        <p>
          These applications generate artifacts and configuration files for integration engines.
          <br />
          They do not directly process patient data.
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
