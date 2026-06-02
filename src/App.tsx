import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import CreateOrder from "@/pages/CreateOrder";
import OrderDetail from "@/pages/OrderDetail";
import Workshop from "@/pages/Workshop";
import InspectionQueue from "@/pages/InspectionQueue";
import Stats from "@/pages/Stats";
import VehicleHistory from "@/pages/VehicleHistory";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-order" element={<CreateOrder />} />
          <Route path="/order/:id" element={<OrderDetail />} />
          <Route path="/workshop" element={<Workshop />} />
          <Route path="/inspection" element={<InspectionQueue />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/vehicle/:id" element={<VehicleHistory />} />
        </Routes>
      </Layout>
    </Router>
  );
}
