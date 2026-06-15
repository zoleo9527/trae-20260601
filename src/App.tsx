import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import OrderList from "./pages/OrderList";
import OrderDetail from "./pages/OrderDetail";
import Inspection from "./pages/Inspection";
import Warranty from "./pages/Warranty";
import SpareParts from "./pages/SpareParts";
import ResetData from "./pages/ResetData";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/orders/:id/inspection" element={<Inspection />} />
          <Route path="/orders/:id/warranty" element={<Warranty />} />
          <Route path="/spare-parts" element={<SpareParts />} />
          <Route path="/reset-data" element={<ResetData />} />
        </Routes>
      </Layout>
    </Router>
  );
}