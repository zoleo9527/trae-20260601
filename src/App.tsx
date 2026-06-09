import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ReferralNew from "@/pages/ReferralNew";
import ReferralDetail from "@/pages/ReferralDetail";
import ReferralEdit from "@/pages/ReferralEdit";
import Returns from "@/pages/Returns";
import ReturnDetail from "@/pages/ReturnDetail";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppInit({ children }: { children: React.ReactNode }) {
  const { restore } = useAuthStore();

  useEffect(() => {
    restore();
  }, [restore]);

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AppInit>
        <Routes>
          <Route
            path="/login"
            element={
              <AuthRedirect>
                <Login />
              </AuthRedirect>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/referral/new" element={<ReferralNew />} />
            <Route path="/referral/:id" element={<ReferralDetail />} />
            <Route path="/referral/:id/edit" element={<ReferralEdit />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/returns/:id" element={<ReturnDetail />} />
          </Route>
        </Routes>
      </AppInit>
    </Router>
  );
}
