import { Request, Response, Router } from 'express';
import { resetDemoData } from './seed';
import * as diseaseCaseService from './services/diseaseCaseService';
import * as masterDataService from './services/masterDataService';
import * as traceService from './services/traceService';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post('/demo/reset', (req: Request, res: Response) => {
  try {
    const result = resetDemoData();
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/users', (req: Request, res: Response) => {
  res.json(masterDataService.getUsers());
});

router.get('/ponds', (req: Request, res: Response) => {
  res.json(masterDataService.getPonds());
});

router.get('/ponds/:id', (req: Request, res: Response) => {
  const pond = masterDataService.getPondById(req.params.id);
  if (!pond) return res.status(404).json({ error: '塘口不存在' });
  res.json(pond);
});

router.get('/medicines', (req: Request, res: Response) => {
  res.json(masterDataService.getMedicines());
});

router.get('/inspections', (req: Request, res: Response) => {
  const { pondId } = req.query;
  res.json(masterDataService.getInspections(pondId as string | undefined));
});

router.get('/feed-records', (req: Request, res: Response) => {
  const { pondId } = req.query;
  res.json(masterDataService.getFeedRecords(pondId as string | undefined));
});

router.get('/disease-cases', (req: Request, res: Response) => {
  const { status, handlerRole, pondId } = req.query;
  const cases = diseaseCaseService.getDiseaseCases({
    status: status as string | undefined,
    handlerRole: handlerRole as string | undefined,
    pondId: pondId as string | undefined,
  });
  res.json(cases);
});

router.get('/disease-cases/:id', (req: Request, res: Response) => {
  const caseData = diseaseCaseService.getDiseaseCaseById(req.params.id);
  if (!caseData) return res.status(404).json({ error: '病害单不存在' });
  res.json(caseData);
});

router.post('/disease-cases', (req: Request, res: Response) => {
  try {
    const result = diseaseCaseService.createDiseaseCase(req.body);
    (res as any).sendIdempotent(201, result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/disease-cases/:id/draft', (req: Request, res: Response) => {
  try {
    const result = diseaseCaseService.updateDiseaseCaseDraft(req.params.id, req.body);
    (res as any).sendIdempotent(200, result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/disease-cases/:id/submit', (req: Request, res: Response) => {
  try {
    const { operatorId } = req.body;
    const result = diseaseCaseService.submitDiseaseCase(req.params.id, operatorId);
    (res as any).sendIdempotent(200, result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/disease-cases/:id/reject', (req: Request, res: Response) => {
  try {
    const result = diseaseCaseService.rejectDiseaseCase({
      caseId: req.params.id,
      ...req.body,
    });
    (res as any).sendIdempotent(200, result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/disease-cases/:id/allocate-medicine', (req: Request, res: Response) => {
  try {
    const result = diseaseCaseService.allocateMedicine({
      caseId: req.params.id,
      ...req.body,
    });
    (res as any).sendIdempotent(200, result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/disease-cases/:id/approve', (req: Request, res: Response) => {
  try {
    const result = diseaseCaseService.approveDiseaseCase({
      caseId: req.params.id,
      ...req.body,
    });
    (res as any).sendIdempotent(200, result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/disease-cases/:id/record-medication', (req: Request, res: Response) => {
  try {
    const result = diseaseCaseService.recordMedication({
      caseId: req.params.id,
      ...req.body,
    });
    (res as any).sendIdempotent(200, result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/disease-cases/:id/close', (req: Request, res: Response) => {
  try {
    const { operatorId, remark } = req.body;
    const result = diseaseCaseService.closeDiseaseCase(req.params.id, operatorId, remark);
    (res as any).sendIdempotent(200, result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/trace/ponds/:pondId/medications', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const records = traceService.getMedicationTraceByPond(
    req.params.pondId,
    startDate as string | undefined,
    endDate as string | undefined
  );
  res.json(records);
});

router.get('/trace/disease-cases/:caseId', (req: Request, res: Response) => {
  const result = traceService.getMedicationTraceByDiseaseCase(req.params.caseId);
  if (!result.diseaseCase) return res.status(404).json({ error: '病害单不存在' });
  res.json(result);
});

router.get('/trace/medicines/:medicineId/usage', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const records = traceService.getMedicationTraceByMedicine(
    req.params.medicineId,
    startDate as string | undefined,
    endDate as string | undefined
  );
  res.json(records);
});

router.get('/trace/ponds/:pondId/summary', (req: Request, res: Response) => {
  const summary = traceService.getPondMedicationSummary(req.params.pondId);
  res.json(summary);
});

export default router;
