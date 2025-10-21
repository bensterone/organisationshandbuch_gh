import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProcessView from './pages/ProcessView';
import ProcessEdit from './pages/ProcessEdit';
import DocumentsIndex from './pages/DocumentsIndex';
import DocumentView from './pages/DocumentView';
import SearchResults from './pages/SearchResults';
import ComplianceReport from './pages/ComplianceReport';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><DocumentsIndex /></ProtectedRoute>} />
        <Route path="/documents/:id" element={<ProtectedRoute><DocumentView /></ProtectedRoute>} />
        <Route path="/processes/:id" element={<ProtectedRoute><ProcessView /></ProtectedRoute>} />
        <Route path="/processes/:id/edit" element={<ProtectedRoute><ProcessEdit /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
        <Route path="/compliance" element={<ProtectedRoute><ComplianceReport /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/discovery" element={<SmartDiscoveryPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
