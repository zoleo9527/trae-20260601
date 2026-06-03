import { Router, Request, Response } from 'express';
import { mockBanquets, mockAlerts } from '../../src/data/mockData';
import { compareVersions } from '../../src/utils/compareUtils';
import type { Banquet, BanquetSummary, Alert, CompareResult, ConfirmRecord, UserRole, CreateVersionRequest } from '@shared/types';

const router = Router();

router.get('/banquets', (req: Request, res: Response) => {
  const { type, status, search, role } = req.query;
  
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

  const isKitchenRole = role === 'kitchen_manager';
  
  const summaries: BanquetSummary[] = banquets.map(b => {
    const visibleAlerts = isKitchenRole
      ? b.alerts.filter(a => a.scope === 'kitchen' || a.scope === 'both')
      : b.alerts;
    const unhandledAlerts = visibleAlerts.filter(a => !a.acknowledged);
    const highPriorityUnhandled = unhandledAlerts.filter(a => a.priority === 'high' || a.priority === 'urgent');
    return {
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
      hasUnacknowledgedAlerts: unhandledAlerts.length > 0,
      unhandledAlertCount: unhandledAlerts.length,
      highPriorityUnhandledCount: highPriorityUnhandled.length,
    };
  });
  
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

router.post('/banquets/:id/versions', (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body as CreateVersionRequest;

  const banquet = mockBanquets.find(b => b.id === id);
  if (!banquet) {
    return res.status(404).json({ error: 'Banquet not found' });
  }

  const newVersion: number = banquet.versions.length > 0
    ? Math.max(...banquet.versions.map(v => v.version)) + 1
    : 1;

  const version = {
    id: `v${newVersion}-${Date.now()}`,
    banquetId: id,
    version: newVersion,
    hall: body.hall || banquet.hall,
    tableLayout: body.tableLayout || [],
    materials: body.materials || [],
    tableCards: body.tableCards || [],
    soundSystem: body.soundSystem || [],
    motionLines: body.motionLines || [],
    remark: body.remark || '',
    changeDescription: body.changeDescription || `方案 v${newVersion} 创建`,
    createdAt: new Date().toISOString(),
    createdBy: body.createdBy || '系统',
  };

  banquet.versions.push(version);
  banquet.currentVersion = newVersion;
  banquet.status = 'modified';
  banquet.tableCount = version.tableLayout.length;
  banquet.guestCount = version.tableLayout.reduce((sum, t) => sum + t.seats, 0);

  if (version.hall !== banquet.hall) {
    banquet.hall = version.hall;
  }

  const changedFields: string[] = [];
  if (banquet.versions.length >= 2) {
    const prev = banquet.versions[banquet.versions.length - 2];
    if (prev.hall !== version.hall) changedFields.push('hall');
    if (prev.tableLayout.length !== version.tableLayout.length) changedFields.push('table_count');
    const prevChildrenChair = prev.materials.find(m => m.name === '儿童椅');
    const currChildrenChair = version.materials.find(m => m.name === '儿童椅');
    if (prevChildrenChair && currChildrenChair && prevChildrenChair.quantity !== currChildrenChair.quantity) {
      changedFields.push('children_chair');
    }
    const missingEquipment = version.soundSystem.filter(s => s.status === 'missing');
    if (missingEquipment.length > 0) {
      changedFields.push('equipment');
    }
  }

  const newAlerts: Alert[] = [];
  changedFields.forEach((field, idx) => {
    const scope = field === 'hall' ? 'both' : 
                  field === 'equipment' ? 'hall' : 
                  field === 'table_count' ? 'both' :
                  field === 'children_chair' ? 'both' : 'both';
    const alert: Alert = {
      id: `alert-auto-${Date.now()}-${idx}`,
      banquetId: id,
      banquetName: banquet.name,
      type: field as Alert['type'],
      description: body.changeDescription || `方案 v${newVersion} 变更`,
      scope,
      priority: field === 'hall' ? 'urgent' : field === 'table_count' ? 'high' : 'medium',
      acknowledged: false,
      fromVersion: newVersion - 1,
      toVersion: newVersion,
      createdAt: new Date().toISOString(),
    };
    newAlerts.push(alert);
    banquet.alerts.push(alert);
    mockAlerts.push(alert);
  });

  res.json({ success: true, version, alerts: newAlerts, banquet });
});

router.post('/banquets/:id/confirm', (req: Request, res: Response) => {
  const { id } = req.params;
  const { version, role, confirmer, remark, signature, confirmItem } = req.body;

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
    confirmItem: confirmItem || 'plan',
  };

  banquet.confirmRecords.push(newConfirm);

  const allConfirmItems: Array<{ role: UserRole; item: string }> = [
    { role: 'hall_manager', item: 'table_cards' },
    { role: 'hall_manager', item: 'sound_system' },
    { role: 'hall_manager', item: 'motion_lines' },
    { role: 'hall_manager', item: 'materials' },
    { role: 'kitchen_manager', item: 'materials' },
    { role: 'sales', item: 'plan' },
  ];

  const currentVersionRecords = banquet.confirmRecords.filter(c => c.version === banquet.currentVersion);
  const confirmedKeys = new Set(currentVersionRecords.map(c => `${c.role}:${c.confirmItem}`));
  const allConfirmed = allConfirmItems.every(item => confirmedKeys.has(`${item.role}:${item.item}`));

  if (allConfirmed) {
    banquet.status = 'confirmed';
  }

  res.json({ success: true, confirm: newConfirm, banquet });
});

router.get('/alerts', (req: Request, res: Response) => {
  const { scope, priority, acknowledged, role } = req.query;
  
  let alerts = [...mockAlerts];

  if (role === 'kitchen_manager') {
    alerts = alerts.filter(a => a.scope === 'kitchen' || a.scope === 'both');
  } else if (role === 'hall_manager' || role === 'sales') {
    alerts = alerts.filter(a => a.scope === 'hall' || a.scope === 'both');
  }
  
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
