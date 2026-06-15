import type {
  Equipment,
  Contract,
  ReturnRecord,
  DamageItem,
  DispatchRecord,
  Photo,
  DatabaseStats,
} from '@shared/types';

declare global {
  interface Window {
    api: {
      getEquipment: () => Promise<Equipment[]>;
      getEquipmentById: (id: number) => Promise<Equipment | null>;
      createEquipment: (data: Partial<Equipment>) => Promise<number>;
      updateEquipment: (id: number, data: Partial<Equipment>) => Promise<boolean>;
      deleteEquipment: (id: number) => Promise<boolean>;

      getContracts: (filters?: { status?: string; search?: string }) => Promise<Contract[]>;
      getContractById: (id: number) => Promise<Contract | null>;
      createContract: (data: any) => Promise<number>;
      updateContract: (id: number, data: any) => Promise<boolean>;
      deleteContract: (id: number) => Promise<boolean>;

      getDispatchRecords: (contractId?: number) => Promise<DispatchRecord[]>;
      createDispatchRecord: (data: any) => Promise<number>;

      getReturnRecords: (filters?: { status?: string; search?: string }) => Promise<ReturnRecord[]>;
      getReturnRecordById: (id: number) => Promise<ReturnRecord | null>;
      createReturnRecord: (data: any) => Promise<number>;
      updateReturnRecord: (id: number, data: any) => Promise<boolean>;
      deleteReturnRecord: (id: number) => Promise<boolean>;

      getDamageItems: (returnRecordId: number) => Promise<DamageItem[]>;
      createDamageItem: (data: any) => Promise<number>;
      updateDamageItem: (id: number, data: any) => Promise<boolean>;
      deleteDamageItem: (id: number) => Promise<boolean>;

      uploadPhoto: (filePath: string, type: string, relatedId?: number, remark?: string) => Promise<{ id: number; filePath: string; fileName: string }>;
      getPhotos: (type?: string, relatedId?: number) => Promise<Photo[]>;
      getPhotoPath: (id: number) => Promise<string | null>;
      deletePhoto: (id: number) => Promise<boolean>;
      selectFile: (options?: any) => Promise<string | null>;
      selectDirectory: () => Promise<string | null>;

      exportSettlement: (returnRecordId: number, outputPath: string) => Promise<string | false>;

      getStats: () => Promise<DatabaseStats>;
    };
  }
}

export const api = window.api;
