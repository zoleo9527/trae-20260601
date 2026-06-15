import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import OrderList from "@/pages/OrderList";
import OrderDetail from "@/pages/OrderDetail";
import ModifyRecord from "@/pages/ModifyRecord";
import PricingReview from "@/pages/PricingReview";
import DeliveryCheck from "@/pages/DeliveryCheck";
import PartsManager from "@/pages/PartsManager";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/orders/:id/modify" element={<ModifyRecord />} />
          <Route path="/orders/:id/pricing" element={<PricingReview />} />
          <Route path="/orders/:id/delivery" element={<DeliveryCheck />} />
          <Route path="/parts" element={<PartsManager />} />
        </Routes>
      </Layout>
    </Router>
  );
}
