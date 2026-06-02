
import { Router, type Request, type Response } from 'express';
import { stations, devices } from '../data/store.js';
import type { Station, Device } from '../../shared/types.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status } = req.query;

  let filteredStations = [...stations] as Station[];

  if (status) {
    filteredStations = filteredStations.filter((s) => s.status === status);
  }

  res.json({
    success: true,
    data: filteredStations,
  });
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const station = stations.find((s) => s.id === id);

  if (!station) {
    res.status(404).json({
      success: false,
      message: '站点不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: station as Station,
  });
});

router.get('/:id/devices', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const stationDevices = devices.filter((d) => d.stationId === id);

  res.json({
    success: true,
    data: stationDevices as Device[],
  });
});

export default router;
