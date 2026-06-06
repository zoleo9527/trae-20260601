import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import HallList from '@/pages/Hall';
import HallDetail from '@/pages/Hall/HallDetail';
import HistoryCenter from '@/pages/History';
import ScheduleList from '@/pages/Schedule';
import BatchSchedule from '@/pages/Schedule/BatchSchedule';
import NewSchedule from '@/pages/Schedule/NewSchedule';
import ScheduleDetail from '@/pages/Schedule/ScheduleDetail';
import TicketCenter from '@/pages/Ticket';
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="schedule" element={<ScheduleList />} />
          <Route path="schedule/new" element={<NewSchedule />} />
          <Route path="schedule/batch" element={<BatchSchedule />} />
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
