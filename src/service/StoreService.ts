import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Store } from "../entity/Store";
import { ErrorCode, ErrorMessage } from "../error/ErrorCode";

export interface CreateStoreRequest {
  storeCode: string;
  storeName: string;
  region: string;
  address: string;
  managerName: string;
  managerPhone: string;
  supervisorName?: string;
  supervisorPhone?: string;
}

export interface UpdateStoreRequest {
  storeName?: string;
  region?: string;
  address?: string;
  managerName?: string;
  managerPhone?: string;
  supervisorName?: string;
  supervisorPhone?: string;
  isActive?: boolean;
}

export class StoreService {
  private storeRepository: Repository<Store>;

  constructor() {
    this.storeRepository = AppDataSource.getRepository(Store);
  }

  async createStore(request: CreateStoreRequest): Promise<{ code: ErrorCode; message: string; data?: Store }> {
    const { storeCode, storeName, region, address, managerName, managerPhone, supervisorName, supervisorPhone } = request;

    const existingStore = await this.storeRepository.findOne({ where: { storeCode } });
    if (existingStore) {
      return { code: ErrorCode.DUPLICATE_RECORD, message: ErrorMessage[ErrorCode.DUPLICATE_RECORD] };
    }

    const store = this.storeRepository.create({
      storeCode,
      storeName,
      region,
      address,
      managerName,
      managerPhone,
      supervisorName,
      supervisorPhone,
    });

    try {
      const savedStore = await this.storeRepository.save(store);
      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: savedStore };
    } catch (error) {
      console.error("Failed to create store:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async getStoreById(id: string): Promise<{ code: ErrorCode; message: string; data?: Store }> {
    try {
      const store = await this.storeRepository.findOne({ where: { id } });
      if (!store) {
        return { code: ErrorCode.STORE_NOT_FOUND, message: ErrorMessage[ErrorCode.STORE_NOT_FOUND] };
      }
      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: store };
    } catch (error) {
      console.error("Failed to get store:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async getStoreByCode(storeCode: string): Promise<{ code: ErrorCode; message: string; data?: Store }> {
    try {
      const store = await this.storeRepository.findOne({ where: { storeCode } });
      if (!store) {
        return { code: ErrorCode.STORE_NOT_FOUND, message: ErrorMessage[ErrorCode.STORE_NOT_FOUND] };
      }
      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: store };
    } catch (error) {
      console.error("Failed to get store:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async getStores(region?: string): Promise<{ code: ErrorCode; message: string; data?: Store[] }> {
    try {
      const queryBuilder = this.storeRepository.createQueryBuilder("store");
      if (region) {
        queryBuilder.where("store.region = :region", { region });
      }
      const stores = await queryBuilder.where("store.isActive = :isActive", { isActive: true }).orderBy("store.storeName").getMany();
      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: stores };
    } catch (error) {
      console.error("Failed to get stores:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async updateStore(id: string, request: UpdateStoreRequest): Promise<{ code: ErrorCode; message: string; data?: Store }> {
    const store = await this.storeRepository.findOne({ where: { id } });
    if (!store) {
      return { code: ErrorCode.STORE_NOT_FOUND, message: ErrorMessage[ErrorCode.STORE_NOT_FOUND] };
    }

    if (request.storeName !== undefined) {
      store.storeName = request.storeName;
    }
    if (request.region !== undefined) {
      store.region = request.region;
    }
    if (request.address !== undefined) {
      store.address = request.address;
    }
    if (request.managerName !== undefined) {
      store.managerName = request.managerName;
    }
    if (request.managerPhone !== undefined) {
      store.managerPhone = request.managerPhone;
    }
    if (request.supervisorName !== undefined) {
      store.supervisorName = request.supervisorName;
    }
    if (request.supervisorPhone !== undefined) {
      store.supervisorPhone = request.supervisorPhone;
    }
    if (request.isActive !== undefined) {
      store.isActive = request.isActive;
    }

    try {
      const updatedStore = await this.storeRepository.save(store);
      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: updatedStore };
    } catch (error) {
      console.error("Failed to update store:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async deleteStore(id: string): Promise<{ code: ErrorCode; message: string }> {
    const store = await this.storeRepository.findOne({ where: { id } });
    if (!store) {
      return { code: ErrorCode.STORE_NOT_FOUND, message: ErrorMessage[ErrorCode.STORE_NOT_FOUND] };
    }

    try {
      await this.storeRepository.remove(store);
      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS] };
    } catch (error) {
      console.error("Failed to delete store:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }
}
