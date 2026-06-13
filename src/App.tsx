import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useStore } from "@/contexts/AppContext";
import Layout from "@/components/common/Layout";

import Login from "@/pages/Login";
import Home from "@/pages/Home";

import OperatorDashboard from "@/pages/operator/Dashboard";
import OperatorSettlementList from "@/pages/operator/SettlementList";
import OperatorSettlementDetail from "@/pages/operator/SettlementDetail";
import OperatorAppealList from "@/pages/operator/AppealList";
import OperatorAppealDetail from "@/pages/operator/AppealDetail";

import RecruiterDashboard from "@/pages/recruiter/Dashboard";
import RecruiterPositionList from "@/pages/recruiter/PositionList";
import RecruiterInterviewList from "@/pages/recruiter/InterviewList";
import RecruiterOnboardingList from "@/pages/recruiter/OnboardingList";
import RecruiterSettlementList from "@/pages/recruiter/SettlementList";
import RecruiterSettlementDetail from "@/pages/recruiter/SettlementDetail";
import RecruiterAppealList from "@/pages/recruiter/AppealList";
import RecruiterAppealDetail from "@/pages/recruiter/AppealDetail";

import HrDashboard from "@/pages/hr/Dashboard";
import HrPositionList from "@/pages/hr/PositionList";
import HrInterviewList from "@/pages/hr/InterviewList";
import HrOnboardingList from "@/pages/hr/OnboardingList";
import HrSettlementList from "@/pages/hr/SettlementList";
import HrSettlementDetail from "@/pages/hr/SettlementDetail";
import HrAppealList from "@/pages/hr/AppealList";
import HrAppealDetail from "@/pages/hr/AppealDetail";

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: 'operator' | 'recruiter' | 'hr' }) {
  const { user } = useStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== role) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route path="/operator" element={<ProtectedRoute role="operator"><Layout role="operator" /></ProtectedRoute>}>
        <Route index element={<OperatorDashboard />} />
        <Route path="settlements" element={<OperatorSettlementList />} />
        <Route path="settlements/:id" element={<OperatorSettlementDetail />} />
        <Route path="appeals" element={<OperatorAppealList />} />
        <Route path="appeals/:id" element={<OperatorAppealDetail />} />
      </Route>

      <Route path="/recruiter" element={<ProtectedRoute role="recruiter"><Layout role="recruiter" /></ProtectedRoute>}>
        <Route index element={<RecruiterDashboard />} />
        <Route path="positions" element={<RecruiterPositionList />} />
        <Route path="interviews" element={<RecruiterInterviewList />} />
        <Route path="onboarding" element={<RecruiterOnboardingList />} />
        <Route path="settlements" element={<RecruiterSettlementList />} />
        <Route path="settlements/:id" element={<RecruiterSettlementDetail />} />
        <Route path="appeals" element={<RecruiterAppealList />} />
        <Route path="appeals/:id" element={<RecruiterAppealDetail />} />
      </Route>

      <Route path="/hr" element={<ProtectedRoute role="hr"><Layout role="hr" /></ProtectedRoute>}>
        <Route index element={<HrDashboard />} />
        <Route path="positions" element={<HrPositionList />} />
        <Route path="interviews" element={<HrInterviewList />} />
        <Route path="onboarding" element={<HrOnboardingList />} />
        <Route path="settlements" element={<HrSettlementList />} />
        <Route path="settlements/:id" element={<HrSettlementDetail />} />
        <Route path="appeals" element={<HrAppealList />} />
        <Route path="appeals/:id" element={<HrAppealDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}