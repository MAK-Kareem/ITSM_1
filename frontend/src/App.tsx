import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import AssetList from './pages/Assets/AssetList';
import IncidentList from './pages/Incidents/IncidentList';
import ChangeRequestList from './pages/ChangeRequests/ChangeRequestList';
import CreateChangeRequestForm from './pages/ChangeRequests/CreateChangeRequestForm';
import ChangeRequestDetailPage from './pages/ChangeRequests/ChangeRequestDetailPage';
import TicketList from './pages/Helpdesk/TicketList';
import DocumentList from './pages/Documents/DocumentList';
import EmployeeList from './pages/HR/EmployeeList';
import SIMList from './pages/SIM/SIMList';
import AlertList from './pages/NOC/AlertList';
import PolicyList from './pages/Policies/PolicyList';
import TransactionList from './pages/Hub/TransactionList';
import MainLayout from './components/Layout/MainLayout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import authService from './services/auth.service';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* If authenticated, redirect to dashboard. Otherwise, show Login page. */}
        <Route
          path="/login"
          element={!authService.isAuthenticated() ? <Login /> : <Navigate to="/dashboard" />}
        />

        {/* Protected Routes: All routes within MainLayout require authentication */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Default route is dashboard */}
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="assets" element={<AssetList />} />
          <Route path="incidents" element={<IncidentList />} />

          {/* Change Request Routes */}
          <Route path="change-requests" element={<ChangeRequestList />} />
          <Route path="change-requests/create" element={<CreateChangeRequestForm />} />
          <Route path="change-requests/:id" element={<ChangeRequestDetailPage />} />

          <Route path="helpdesk" element={<TicketList />} />
          <Route path="documents" element={<DocumentList />} />
          <Route path="hr" element={<EmployeeList />} />
          <Route path="sim" element={<SIMList />} />
          <Route path="noc" element={<AlertList />} />
          <Route path="policies" element={<PolicyList />} />
          <Route path="hub" element={<TransactionList />} />
        </Route>

        {/* Fallback route for any other path */}
        <Route path="*" element={<Navigate to={authService.isAuthenticated() ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
