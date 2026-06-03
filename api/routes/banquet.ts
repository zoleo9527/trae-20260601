import { Router, Request, Response } from 'express';
import { mockBanquets, mockAlerts } from '../../src/data/mockData';
import { compareVersions } from '../../src/utils/compareUtils';
import type { Banquet, BanquetSummary, Alert, CompareResult, ConfirmRecord, UserRole } from '@shared/types';

const router = Router();

router.get('/banquets', (req: Request, res: Response) => {
  const { type, status, search } = req.query;
  
  let banquets = [...mockBanquets];
  
  if (type && type !== 'all') {
    banquets = banquets.filter(b => b.type === type);
  }
  
  if (status && status !== 'all') {
    banquets = banquets.filter(b => b.status === status);
  }
  
  if (search) {
    const keyword = String(search).toLowerCase();
    banquets = banquets.filter(b => 
      b.name.toLowerCase().includes(keyword) ||
      b.customer.toLowerCase().includes(keyword) ||
      b.hall.toLowerCase().includes(keyword)
    );
  }
  
  const summaries: BanquetSummary[] = banquets.map(b => ({
    id: b.id,
    name: b.name,
    type: b.type,
    startTime: b.startTime,
    endTime: b.endTime,
    hall: b.hall,
    guestCount: b.guestCount,
    tableCount: b.tableCount,
    status: b.status,
    currentVersion: b.currentVersion,
    hasUnacknowledgedAlerts: b.alerts.some(a => !a.acknowledged),
    alertCount: b.alerts.length,
    highPriorityAlerts: b.alerts.filter(a => a.priority === 'high' || a.priority === 'urgent' && !a.acknowledged).length,
  }));
  
  res.json(summaries);
});

router.get('/banquets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const banquet = mockBanquets.find(b => b.id === id);
  
  if (!banquet) {
    return res.status(404).json({ error: 'Banquet not found' });
  }
  
  res.json(banquet);
});

router.get('/banquets/:id/versions', (req: Request, res: Response) => {
  const { id } = req.params;
  const banquet = mockBanquets.find(b => b.id === id);
  
  if (!banquet) {
    return res.status(404).json({ error: 'Banquet not found' });
  }
  
  const versions = banquet.versions.map(v => ({
    version: v.version,
    hall: v.hall,
    tableCount: v.tableLayout.length,
    createdAt: v.createdAt,
    createdBy: v.createdBy,
    changeDescription: v.changeDescription,
  }));
  
  res.json(versions);
});

router.get('/banquets/:id/compare', (req: Request, res: Response) => {
  const { id } = req.params;
  const { v1, v2 } = req.query;
  
  const banquet = mockBanquets.find(b => b.id === id);
  if (!banquet) {
    return res.status(404).json({ error: 'Banquet not found' });
  }
  
  const version1 = banquet.versions.find(v => v.version === Number(v1));
  const version2 = banquet.versions.find(v => v.version === Number(v2));
  
  if (!version1 || !version2) {
    return res.status(404).json({ error: 'Version not found' });
  }
  
  const result: CompareResult = compareVersions(version1, version2);
  res.json(result);
});

router.post('/banquets/:id/confirm', (req: Request, res: Response) => {
  const { id } = req.params;
  const { version, role, confirmer, remark, signature } = req.body;
  
  const banquet = mockBanquets.find(b => b.id === id);
  if (!banquet) {
    return res.status(404).json({ error: 'Banquet not found' });
  }
  
  const newConfirm: ConfirmRecord = {
    id: `confirm-${Date.now()}`,
    banquetId: id,
    version,
    role,
    confirmer,
    confirmTime: new Date().toISOString(),
    signature: signature || confirmer,
    remark: remark || '',
  };
  
  banquet.confirmRecords.push(newConfirm);
  
  const allRoles: UserRole[] = ['sales', 'hall_manager', 'kitchen_manager'];
  const confirmedRoles = banquet.confirmRecords
    .filter(c => c.version === banquet.currentVersion)
    .map(c => c.role);
  const hasAllConfirmed = allRoles.every(r => confirmedRoles.includes(r));
  
  if (hasAllConfirmed) {
    banquet.status = 'confirmed';
  }
  
  res.json({ success: true, confirm: newConfirm, banquet });
});

router.get('/alerts', (req: Request, res: Response) => {
  const { scope, priority, acknowledged } = req.query;
  
  let alerts = [...mockAlerts];
  
  if (scope && scope !== 'all') {
    alerts = alerts.filter(a => a.scope === scope || a.scope === 'both');
  }
  
  if (priority && priority !== 'all') {
    alerts = alerts.filter(a => a.priority === priority);
  }
  
  if (acknowledged !== undefined && acknowledged !== 'all') {
    alerts = alerts.filter(a => a.acknowledged === (acknowledged === 'true'));
  }
  
  alerts.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  res.json(alerts);
});

router.post('/alerts/:id/ack', (req: Request, res: Response) => {
  const { id } = req.params;
  const { acknowledgedBy } = req.body;
  
  const alert = mockAlerts.find(a => a.id === id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  
  alert.acknowledged = true;
  alert.acknowledgedAt = new Date().toISOString();
  alert.acknowledgedBy = acknowledgedBy || '系统';
  
  res.json({ success: true, alert });
});

export default router;
