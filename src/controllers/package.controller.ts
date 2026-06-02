import { Request, Response } from 'express';
import { PackageService } from '../services/package.service';

const packageService = new PackageService();

export const createPackage = async (req: Request, res: Response) => {
  try {
    const { orderId, items, weight } = req.body;
    const pkg = await packageService.createPackage(orderId, items, weight);
    res.json({ success: true, data: pkg });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const reviewPackage = async (req: Request, res: Response) => {
  try {
    const { packageId } = req.params;
    const { reviewerId, items, statusOverride, notes } = req.body;
    const review = await packageService.reviewPackage(packageId, reviewerId, items, statusOverride, notes);
    res.json({ success: true, data: review });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const shipPackage = async (req: Request, res: Response) => {
  try {
    const { packageId } = req.params;
    const pkg = await packageService.shipPackage(packageId);
    res.json({ success: true, data: pkg });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getPackage = async (req: Request, res: Response) => {
  try {
    const { packageId } = req.params;
    const pkg = await packageService.getPackageById(packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, error: '包裹不存在' });
    }
    res.json({ success: true, data: pkg });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const listPackages = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string;
    const result = await packageService.listPackages(page, pageSize, status);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updatePackageItems = async (req: Request, res: Response) => {
  try {
    const { packageId } = req.params;
    const { items } = req.body;
    const pkg = await packageService.updatePackageItems(packageId, items);
    res.json({ success: true, data: pkg });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
