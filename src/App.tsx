import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import ApprovalList from "@/pages/ApprovalList";
import ApprovalDetail from "@/pages/ApprovalDetail";
import CalculationList from "@/pages/CalculationList";
import CalculationDetail from "@/pages/CalculationDetail";
import DataManagement from "@/pages/DataManagement";
import Settings from "@/pages/Settings";
import { useAppStore } from "@/store/useAppStore";

export default function App() {
  const autoBackup = useAppStore((s) => s.autoBackup);
  const cleanupExpiredBackups = useAppStore((s) => s.cleanupExpiredBackups);

  useEffect(() => {
    const initAutoBackup = async () => {
      try {
        await cleanupExpiredBackups();
        await autoBackup();
      } catch (error) {
        console.error('[App] 自动备份执行失败:', error);
      }
    };
    initAutoBackup();
  }, [autoBackup, cleanupExpiredBackups]);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/approval" element={<ApprovalList />} />
          <Route path="/approval/:id" element={<ApprovalDetail />} />
          <Route path="/calculation" element={<CalculationList />} />
          <Route path="/calculation/:id" element={<CalculationDetail />} />
          <Route path="/data" element={<DataManagement />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
