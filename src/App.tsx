import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import ScheduleList from '@/pages/Schedule';
import NewSchedule from '@/pages/Schedule/NewSchedule';
import ScheduleDetail from '@/pages/Schedule/ScheduleDetail';
import HallList from '@/pages/Hall';
import HallDetail from '@/pages/Hall/HallDetail';
import TicketCenter from '@/pages/Ticket';
import HistoryCenter from '@/pages/History';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="schedule" element={<ScheduleList />} />
          <Route path="schedule/new" element={<NewSchedule />} />
          <Route path="schedule/:id" element={<ScheduleDetail />} />
          <Route path="hall" element={<HallList />} />
          <Route path="hall/:id" element={<HallDetail />} />
          <Route path="ticket" element={<TicketCenter />} />
          <Route path="history" element={<HistoryCenter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
