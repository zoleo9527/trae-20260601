import { Routes, Route, NavLink } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Allocations from './pages/Allocations';
import Appointments from './pages/Appointments';
import AuditLog from './pages/AuditLog';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/allocations" element={<Allocations />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/audit" element={<AuditLog />} />
      </Routes>
    </Layout>
  );
}
