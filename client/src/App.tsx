import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import GateWorkstation from './pages/GateWorkstation';
import YardWorkstation from './pages/YardWorkstation';
import CustomerWorkstation from './pages/CustomerWorkstation';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/gate" element={<GateWorkstation />} />
          <Route path="/yard" element={<YardWorkstation />} />
          <Route path="/customer" element={<CustomerWorkstation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
