import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Workbench from "@/pages/Workbench";
import OrderDetail from "@/pages/OrderDetail";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Workbench />} />
        <Route path="/order/:id" element={<OrderDetail />} />
      </Routes>
    </Router>
  );
}
