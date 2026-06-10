import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Toast } from "@/components/Toast";
import Dashboard from "@/pages/Dashboard";
import Loading from "@/pages/Loading";
import Logs from "@/pages/Logs";
import Orders from "@/pages/Orders";
import Packaging from "@/pages/Packaging";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-cream-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/packaging" element={<Packaging />} />
              <Route path="/loading" element={<Loading />} />
              <Route path="/logs" element={<Logs />} />
            </Routes>
          </main>
        </div>
        <Toast />
      </div>
    </Router>
  );
}
