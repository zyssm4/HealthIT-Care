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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
