import { Layout } from "@/components/Layout";
import AnomalyCenter from "@/pages/AnomalyCenter";
import AuditLog from "@/pages/AuditLog";
import BookingDetail from "@/pages/BookingDetail";
import BookingList from "@/pages/BookingList";
import BookingNew from "@/pages/BookingNew";
import Dashboard from "@/pages/Dashboard";
import DecorationBoard from "@/pages/DecorationBoard";
import DecorationDetail from "@/pages/DecorationDetail";
import DecorationNew from "@/pages/DecorationNew";
import MemberDetail from "@/pages/MemberDetail";
import MemberList from "@/pages/MemberList";
import PackageList from "@/pages/PackageList";
import PackageOrderDetail from "@/pages/PackageOrderDetail";
import PackageProcess from "@/pages/PackageProcess";
import Settings from "@/pages/Settings";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bookings" element={<BookingList />} />
          <Route path="/bookings/new" element={<BookingNew />} />
          <Route path="/bookings/:id" element={<BookingDetail />} />
          <Route path="/packages" element={<PackageList />} />
          <Route path="/packages/process" element={<PackageProcess />} />
          <Route path="/packages/orders/:id" element={<PackageOrderDetail />} />
          <Route path="/decorations" element={<DecorationBoard />} />
          <Route path="/decorations/new" element={<DecorationNew />} />
          <Route path="/decorations/:id" element={<DecorationDetail />} />
          <Route path="/members" element={<MemberList />} />
          <Route path="/members/:id" element={<MemberDetail />} />
          <Route path="/anomalies" element={<AnomalyCenter />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}
