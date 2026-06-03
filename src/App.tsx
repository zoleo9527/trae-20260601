import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import Home from "@/pages/Home";
import OrderDetail from "@/pages/OrderDetail";
import ColorConfirm from "@/pages/ColorConfirm";
import ReworkPage from "@/pages/ReworkPage";
import ColorPending from "@/pages/ColorPending";
import ReworkList from "@/pages/ReworkList";
import DelayedOrders from "@/pages/DelayedOrders";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/color-pending" element={<ColorPending />} />
          <Route path="/rework" element={<ReworkList />} />
          <Route path="/delayed" element={<DelayedOrders />} />
          <Route path="/order/:id" element={<OrderDetail />} />
          <Route path="/order/:id/color" element={<ColorConfirm />} />
          <Route path="/order/:id/rework" element={<ReworkPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
