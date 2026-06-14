import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import CostumeDetail from "@/pages/CostumeDetail";
import AppHeader from "@/components/layout/AppHeader";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/costumes/:id" element={<CostumeDetail />} />
            <Route
              path="/costumes/:id/student/:studentId"
              element={<CostumeDetail />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
