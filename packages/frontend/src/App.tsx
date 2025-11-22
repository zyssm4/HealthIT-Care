import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SchemaGenerator from './pages/SchemaGenerator';
import MessageTransformer from './pages/MessageTransformer';
import InterfaceDocGenerator from './pages/InterfaceDocGenerator';
import CodeMapper from './pages/CodeMapper';
import TestCaseGenerator from './pages/TestCaseGenerator';
import ConfigDiff from './pages/ConfigDiff';
import ChangeTracker from './pages/ChangeTracker';
import MessageValidator from './pages/MessageValidator';
import HL7Parser from './pages/HL7Parser';
import TranslationTable from './pages/TranslationTable';
import FHIRExplorer from './pages/FHIRExplorer';
import AuditLogAnalyzer from './pages/AuditLogAnalyzer';
import AzureArchitect from './pages/AzureArchitect';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/schema-generator" element={<SchemaGenerator />} />
        <Route path="/message-transformer" element={<MessageTransformer />} />
        <Route path="/interface-docs" element={<InterfaceDocGenerator />} />
        <Route path="/code-mapper" element={<CodeMapper />} />
        <Route path="/test-generator" element={<TestCaseGenerator />} />
        <Route path="/config-diff" element={<ConfigDiff />} />
        <Route path="/change-tracker" element={<ChangeTracker />} />
        <Route path="/message-validator" element={<MessageValidator />} />
        <Route path="/hl7-parser" element={<HL7Parser />} />
        <Route path="/translation-table" element={<TranslationTable />} />
        <Route path="/fhir-explorer" element={<FHIRExplorer />} />
        <Route path="/audit-logs" element={<AuditLogAnalyzer />} />
        <Route path="/azure-architect" element={<AzureArchitect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
