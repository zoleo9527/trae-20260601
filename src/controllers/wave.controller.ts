import { Request, Response } from 'express';
import { WaveService } from '../services/wave.service';

const waveService = new WaveService();

export const createWave = async (req: Request, res: Response) => {
  try {
    const { name, orderIds, createdById } = req.body;
    const wave = await waveService.createWave(name, orderIds, createdById);
    res.json({ success: true, data: wave });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const startWave = async (req: Request, res: Response) => {
  try {
    const { waveId } = req.params;
    const { operatorId } = req.body;
    const wave = await waveService.startWave(waveId, operatorId);
    res.json({ success: true, data: wave });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const completeWave = async (req: Request, res: Response) => {
  try {
    const { waveId } = req.params;
    const wave = await waveService.completeWave(waveId);
    res.json({ success: true, data: wave });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getWave = async (req: Request, res: Response) => {
  try {
    const { waveId } = req.params;
    const wave = await waveService.getWaveById(waveId);
    if (!wave) {
      return res.status(404).json({ success: false, error: '波次不存在' });
    }
    res.json({ success: true, data: wave });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const listWaves = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await waveService.listWaves(page, pageSize);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getWaveTraceability = async (req: Request, res: Response) => {
  try {
    const { waveId } = req.params;
    const traceability = await waveService.getWaveTraceability(waveId);
    res.json({ success: true, data: traceability });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
