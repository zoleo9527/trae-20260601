import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Dashboard from './pages/Dashboard';
import Surgeries from './pages/Surgeries';
import Exceptions from './pages/Exceptions';
import Layout from './components/layout/Layout';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/surgeries" element={<Surgeries />} />
          <Route path="/exceptions" element={<Exceptions />} />
        </Route>
      </Routes>
    </Router>
  );
}
