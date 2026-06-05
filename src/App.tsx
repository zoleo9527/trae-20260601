import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import RoleSwitcher from "@/components/RoleSwitcher";
import Dashboard from "@/pages/Dashboard";
import ComplaintList from "@/pages/ComplaintList";
import ComplaintDetail from "@/pages/ComplaintDetail";
import NewComplaint from "@/pages/NewComplaint";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm text-gray-500">球馆运营管理系统</h2>
          </div>
          <RoleSwitcher />
        </header>
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/complaints" element={<ComplaintList />} />
          <Route path="/complaints/new" element={<NewComplaint />} />
          <Route path="/complaints/:id" element={<ComplaintDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
}
