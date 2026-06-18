import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import {
  Dashboard,
  ScheduleListPage,
  ScheduleDetailPage,
  ScheduleEditPage,
  ApprovalPage,
  MaterialListPage,
  MaterialDetailPage,
  NotificationPage,
} from '@/pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="schedules" element={<ScheduleListPage />} />
          <Route path="schedules/:id" element={<ScheduleDetailPage />} />
          <Route path="schedules/:id/edit" element={<ScheduleEditPage />} />
          <Route path="approval" element={<ApprovalPage />} />
          <Route path="materials" element={<MaterialListPage />} />
          <Route path="materials/:id" element={<MaterialDetailPage />} />
          <Route path="notifications" element={<NotificationPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
