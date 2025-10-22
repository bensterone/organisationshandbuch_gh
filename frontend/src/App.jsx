import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";

import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DocumentsIndex from "./pages/DocumentsIndex";   // ← add this
import DocumentView from "./pages/DocumentView";
import ProcessView from "./pages/ProcessView";
import ProcessEdit from "./pages/ProcessEdit";
import SearchResults from "./pages/SearchResults";
import ComplianceReport from "./pages/ComplianceReport";
import SmartDiscoveryPanel from "./components/discovery/SmartDiscoveryPanel";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* App pages (left tree via Layout) */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Documents */}
        <Route path="/documents" element={<ProtectedRoute><DocumentsIndex /></ProtectedRoute>} />
        <Route path="/documents/:id" element={<ProtectedRoute><DocumentView /></ProtectedRoute>} />

        {/* Processes */}
        <Route path="/processes/:id" element={<ProtectedRoute><ProcessView /></ProtectedRoute>} />
        <Route path="/processes/:id/edit" element={<ProtectedRoute><ProcessEdit /></ProtectedRoute>} />

        {/* Other */}
        <Route path="/search" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
        <Route path="/compliance" element={<ProtectedRoute><ComplianceReport /></ProtectedRoute>} />
        <Route path="/discovery" element={<ProtectedRoute><SmartDiscoveryPanel /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
