import { Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/pages/Dashboard";
import { ReviewList } from "@/pages/ReviewList";
import { ReviewDetail } from "@/pages/ReviewDetail";
import { OrderDetail } from "@/pages/OrderDetail";
import { OperationLogs } from "@/pages/OperationLogs";

function App() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reviews" element={<ReviewList />} />
            <Route path="/reviews/:id" element={<ReviewDetail />} />
            <Route path="/reviews/:id/orders/:orderId" element={<OrderDetail />} />
            <Route path="/logs" element={<OperationLogs />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
