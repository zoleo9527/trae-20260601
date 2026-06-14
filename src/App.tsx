import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAppStore } from "./store";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Review from "./pages/Review";
import Detail from "./pages/Detail";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAppStore((state) => state.user);
  if (!user) {
    return <Login />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <ProtectedRoute>
              <Register />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/register/:id" 
          element={
            <ProtectedRoute>
              <Register />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/review/:id" 
          element={
            <ProtectedRoute>
              <Review />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/detail/:id" 
          element={
            <ProtectedRoute>
              <Detail />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}
