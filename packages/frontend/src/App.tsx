import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SchemaGenerator from './pages/SchemaGenerator';
import MessageTransformer from './pages/MessageTransformer';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/schema-generator" element={<SchemaGenerator />} />
        <Route path="/message-transformer" element={<MessageTransformer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
