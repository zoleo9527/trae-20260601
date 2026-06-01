import { Repository, DataSource } from 'typeorm';
import { MedicineInventory } from './entities/medicine-inventory.entity';
import { NearExpiryAlert, AlertLevel } from './entities/near-expiry-alert.entity';
import { CreateMedicineInventoryDto, UpdateMedicineInventoryDto, MedicineInventoryQueryDto } from './dto/medicine-inventory.dto';
import { NearExpiryAlertQueryDto, AcknowledgeAlertDto, ResolveAlertDto } from './dto/near-expiry-alert.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { AlertStateMachine } from './alert.state-machine';
export declare class InventoryService {
    private readonly inventoryRepository;
    private readonly alertRepository;
    private readonly alertStateMachine;
    private readonly dataSource;
    constructor(inventoryRepository: Repository<MedicineInventory>, alertRepository: Repository<NearExpiryAlert>, alertStateMachine: AlertStateMachine, dataSource: DataSource);
    create(dto: CreateMedicineInventoryDto): Promise<MedicineInventory>;
    findAll(query: MedicineInventoryQueryDto): Promise<PaginatedResult<MedicineInventory>>;
    findOne(id: string): Promise<MedicineInventory>;
    update(id: string, dto: UpdateMedicineInventoryDto): Promise<MedicineInventory>;
    remove(id: string): Promise<void>;
    findNearExpiryMedicines(daysToExpiry: number): Promise<MedicineInventory[]>;
    calculateDaysToExpiry(expiryDate: Date): number;
    calculateAlertLevel(daysToExpiry: number): AlertLevel;
    generateAlerts(): Promise<{
        generated: number;
        skipped: number;
    }>;
    findAlerts(query: NearExpiryAlertQueryDto): Promise<PaginatedResult<NearExpiryAlert>>;
    findAlertById(id: string): Promise<NearExpiryAlert>;
    acknowledgeAlert(id: string, dto: AcknowledgeAlertDto, operatorId?: string): Promise<NearExpiryAlert>;
    resolveAlert(id: string, dto: ResolveAlertDto, operatorId?: string): Promise<NearExpiryAlert>;
    findByMedicineAndBatch(medicineId: string, batchNo: string, storeId: string): Promise<MedicineInventory | null>;
    decreaseQuantity(medicineId: string, batchNo: string, storeId: string, quantity: number): Promise<void>;
    increaseQuantity(medicineId: string, batchNo: string, storeId: string, quantity: number, medicineName?: string, expiryDate?: string, sellingPrice?: number): Promise<void>;
}
