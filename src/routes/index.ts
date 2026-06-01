import { Express } from 'express';
import { attendanceRoutes } from './attendance';
import { certificateRoutes } from './certificates';
import { classRoutes } from './classes';
import { exportRoutes } from './export';
import { makeupRoutes } from './makeup';
import { sessionRoutes } from './sessions';
import { shipmentRoutes } from './shipments';
import { studentRoutes } from './students';

export function setupRoutes(app: Express) {
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/classes', classRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/makeup', makeupRoutes);
  app.use('/api/certificates', certificateRoutes);
  app.use('/api/shipments', shipmentRoutes);
  app.use('/api/export', exportRoutes);
}
