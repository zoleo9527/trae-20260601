export interface InventoryEntity {
  id: string;
  storeId: string;
  medicineId: string;
  medicineName: string;
  batchNo: string;
  expiryDate: string;
  quantity: number;
  unit: string;
}

export interface AlertEntity {
  id: string;
  inventoryId: string;
  storeId: string;
  type: string;
  status: string;
}
