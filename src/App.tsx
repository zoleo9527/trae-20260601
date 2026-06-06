import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Dashboard } from "@/pages/Dashboard";
import { ReviewList } from "@/pages/ReviewList";
import { ReviewDetail } from "@/pages/ReviewDetail";
import { OrderDetail } from "@/pages/OrderDetail";
import { OperationLogs } from "@/pages/OperationLogs";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reviews" element={<ReviewList />} />
          <Route path="/reviews/:id" element={<ReviewDetail />} />
          <Route path="/reviews/:id/orders/:orderId" element={<OrderDetail />} />
          <Route path="/logs" element={<OperationLogs />} />
        </Route>
      </Routes>
    </Router>
  );
}
