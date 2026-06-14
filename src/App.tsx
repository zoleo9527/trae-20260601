import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import StatusBar from './components/layout/StatusBar';
import WorkbenchPage from './pages/workbench/page';
import DispatchPage from './pages/workbench/dispatch/page';
import ExceptionsPage from './pages/workbench/exceptions/page';
import DashboardPage from './pages/workbench/dashboard/page';

function App() {
  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col bg-[#1a1a2e]">
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-hidden">
              <Routes>
                <Route path="/" element={<Navigate to="/workbench" replace />} />
                <Route path="/workbench" element={<WorkbenchPage />} />
                <Route path="/workbench/dispatch" element={<DispatchPage />} />
                <Route path="/workbench/exceptions" element={<ExceptionsPage />} />
                <Route path="/workbench/dashboard" element={<DashboardPage />} />
              </Routes>
            </main>
            <StatusBar />
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
