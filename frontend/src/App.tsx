import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import {
  Dashboard,
  ScheduleListPage,
  ScheduleDetailPage,
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
          <Route path="materials" element={<MaterialListPage />} />
          <Route path="materials/:id" element={<MaterialDetailPage />} />
          <Route path="notifications" element={<NotificationPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
