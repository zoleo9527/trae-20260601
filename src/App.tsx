import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import PropertyDetail from "@/pages/PropertyDetail";
import Orders from "@/pages/Orders";
import Expenses from "@/pages/Expenses";
import Repairs from "@/pages/Repairs";
import Advances from "@/pages/Advances";
import Bills from "@/pages/Bills";
import BillDetail from "@/pages/BillDetail";
import Disputes from "@/pages/Disputes";
import DisputeDetail from "@/pages/DisputeDetail";
import LandlordSummary from "@/pages/LandlordSummary";

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/repairs" element={<Repairs />} />
            <Route path="/advances" element={<Advances />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/bills/:id" element={<BillDetail />} />
            <Route path="/disputes" element={<Disputes />} />
            <Route path="/disputes/:id" element={<DisputeDetail />} />
            <Route path="/landlord-summary" element={<LandlordSummary />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
