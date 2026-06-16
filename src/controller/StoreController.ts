import { Request, Response } from "express";
import { StoreService, CreateStoreRequest, UpdateStoreRequest } from "../service/StoreService";

export class StoreController {
  private storeService: StoreService;

  constructor() {
    this.storeService = new StoreService();
  }

  async createStore(req: Request, res: Response) {
    const request: CreateStoreRequest = req.body;
    const result = await this.storeService.createStore(request);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async getStoreById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await this.storeService.getStoreById(id);
    res.status(result.code === 0 ? 200 : 404).json(result);
  }

  async getStoreByCode(req: Request, res: Response) {
    const { storeCode } = req.params;
    const result = await this.storeService.getStoreByCode(storeCode);
    res.status(result.code === 0 ? 200 : 404).json(result);
  }

  async getStores(req: Request, res: Response) {
    const region = req.query.region as string;
    const result = await this.storeService.getStores(region);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async updateStore(req: Request, res: Response) {
    const { id } = req.params;
    const request: UpdateStoreRequest = req.body;
    const result = await this.storeService.updateStore(id, request);
    res.status(result.code === 0 ? 200 : 400).json(result);
  }

  async deleteStore(req: Request, res: Response) {
    const { id } = req.params;
    const result = await this.storeService.deleteStore(id);
    res.status(result.code === 0 ? 200 : 404).json(result);
  }
}
