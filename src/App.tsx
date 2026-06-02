import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "@/pages/Login";
import TeacherDashboard from "@/pages/TeacherDashboard";
import PrincipalDashboard from "@/pages/PrincipalDashboard";
import ChildDetail from "@/pages/ChildDetail";
import { useAppStore } from "@/store";

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const currentUser = useAppStore((state) => state.currentUser);
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const currentUser = useAppStore((state) => state.currentUser);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && location.pathname === "/login") {
      const redirectTo = currentUser.role === "teacher" ? "/teacher" : "/principal";
      navigate(redirectTo, { replace: true });
    }
  }, [currentUser, location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/child/:id"
        element={
          <ProtectedRoute allowedRoles={["teacher", "principal"]}>
            <ChildDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/principal"
        element={
          <ProtectedRoute allowedRoles={["principal"]}>
            <PrincipalDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/principal/child/:id"
        element={
          <ProtectedRoute allowedRoles={["principal", "teacher"]}>
            <ChildDetail />
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
