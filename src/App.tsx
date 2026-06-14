import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider, useRole } from './contexts/RoleContext';
import { DataProvider } from './contexts/DataContext';

import { Home } from './pages/Home';

import { DispatcherDashboard } from './pages/dispatcher/Dashboard';
import { VehicleRegister } from './pages/dispatcher/Register';
import { DispatcherTasks } from './pages/dispatcher/Tasks';

import { InspectorDashboard } from './pages/inspector/Dashboard';
import { InspectorTasks } from './pages/inspector/Tasks';
import { InspectionForm } from './pages/inspector/InspectionForm';
import { InspectorReports } from './pages/inspector/Reports';

import { AuditorDashboard } from './pages/auditor/Dashboard';
import { AuditorReports } from './pages/auditor/Reports';
import { AuditorDistribution } from './pages/auditor/Distribution';

import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminFollowup } from './pages/admin/Followup';
import { FollowupForm } from './pages/admin/FollowupForm';
import { AdminHistory } from './pages/admin/History';
import { AdminReports } from './pages/admin/Reports';

function RoleRouteGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { currentRole } = useRole();
  
  if (!currentRole) {
    return <Navigate to="/" replace />;
  }
  
  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to={`/${currentRole}/dashboard`} replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      
      <Route path="/dispatcher">
        <Route
          path="dashboard"
          element={
            <RoleRouteGuard allowedRoles={['dispatcher']}>
              <DispatcherDashboard />
            </RoleRouteGuard>
          }
        />
        <Route
          path="register"
          element={
            <RoleRouteGuard allowedRoles={['dispatcher']}>
              <VehicleRegister />
            </RoleRouteGuard>
          }
        />
        <Route
          path="tasks"
          element={
            <RoleRouteGuard allowedRoles={['dispatcher']}>
              <DispatcherTasks />
            </RoleRouteGuard>
          }
        />
      </Route>
      
      <Route path="/inspector">
        <Route
          path="dashboard"
          element={
            <RoleRouteGuard allowedRoles={['inspector']}>
              <InspectorDashboard />
            </RoleRouteGuard>
          }
        />
        <Route
          path="tasks"
          element={
            <RoleRouteGuard allowedRoles={['inspector']}>
              <InspectorTasks />
            </RoleRouteGuard>
          }
        />
        <Route
          path="inspection/:id"
          element={
            <RoleRouteGuard allowedRoles={['inspector']}>
              <InspectionForm />
            </RoleRouteGuard>
          }
        />
        <Route
          path="reports"
          element={
            <RoleRouteGuard allowedRoles={['inspector']}>
              <InspectorReports />
            </RoleRouteGuard>
          }
        />
      </Route>
      
      <Route path="/auditor">
        <Route
          path="dashboard"
          element={
            <RoleRouteGuard allowedRoles={['auditor']}>
              <AuditorDashboard />
            </RoleRouteGuard>
          }
        />
        <Route
          path="reports"
          element={
            <RoleRouteGuard allowedRoles={['auditor']}>
              <AuditorReports />
            </RoleRouteGuard>
          }
        />
        <Route
          path="distribution"
          element={
            <RoleRouteGuard allowedRoles={['auditor']}>
              <AuditorDistribution />
            </RoleRouteGuard>
          }
        />
      </Route>
      
      <Route path="/admin">
        <Route
          path="dashboard"
          element={
            <RoleRouteGuard allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleRouteGuard>
          }
        />
        <Route
          path="followup"
          element={
            <RoleRouteGuard allowedRoles={['admin']}>
              <AdminFollowup />
            </RoleRouteGuard>
          }
        />
        <Route
          path="followup/:id"
          element={
            <RoleRouteGuard allowedRoles={['admin']}>
              <FollowupForm />
            </RoleRouteGuard>
          }
        />
        <Route
          path="history"
          element={
            <RoleRouteGuard allowedRoles={['admin']}>
              <AdminHistory />
            </RoleRouteGuard>
          }
        />
        <Route
          path="reports"
          element={
            <RoleRouteGuard allowedRoles={['admin']}>
              <AdminReports />
            </RoleRouteGuard>
          }
        />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <RoleProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </RoleProvider>
    </Router>
  );
}

export default App;
