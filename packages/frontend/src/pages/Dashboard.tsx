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
