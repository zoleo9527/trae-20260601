import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import SaleControlPage from "@/pages/SaleControlPage";
import ApprovalPage from "@/pages/ApprovalPage";
import HistoryPage from "@/pages/HistoryPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout>
              <SaleControlPage />
            </AppLayout>
          }
        />
        <Route
          path="/approval"
          element={
            <AppLayout>
              <ApprovalPage />
            </AppLayout>
          }
        />
        <Route
          path="/history"
          element={
            <AppLayout>
              <HistoryPage />
            </AppLayout>
          }
        />
      </Routes>
    </Router>
  );
}
