import { InventoryService } from './inventory.service';
import { CreateMedicineInventoryDto, UpdateMedicineInventoryDto, MedicineInventoryQueryDto } from './dto/medicine-inventory.dto';
import { NearExpiryAlertQueryDto, AcknowledgeAlertDto, ResolveAlertDto, NearExpiryMedicineQueryDto } from './dto/near-expiry-alert.dto';
import { ApiResponse as ApiResponseWrapper } from '../../common/dto/response.dto';
import { RequestContext } from '../../common/decorators/request-context.decorator';
import { MedicineInventory } from './entities/medicine-inventory.entity';
import { NearExpiryAlert } from './entities/near-expiry-alert.entity';
import { PaginatedResult } from '../../common/dto/pagination.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    create(dto: CreateMedicineInventoryDto, requestId: string): Promise<ApiResponseWrapper<MedicineInventory>>;
    findAll(query: MedicineInventoryQueryDto, requestId: string): Promise<ApiResponseWrapper<PaginatedResult<MedicineInventory>>>;
    findNearExpiry(query: NearExpiryMedicineQueryDto, requestId: string): Promise<ApiResponseWrapper<MedicineInventory[]>>;
    findAlerts(query: NearExpiryAlertQueryDto, requestId: string): Promise<ApiResponseWrapper<PaginatedResult<NearExpiryAlert>>>;
    findAlertById(id: string, requestId: string): Promise<ApiResponseWrapper<NearExpiryAlert>>;
    acknowledgeAlert(id: string, dto: AcknowledgeAlertDto, context: RequestContext): Promise<ApiResponseWrapper<NearExpiryAlert>>;
    resolveAlert(id: string, dto: ResolveAlertDto, context: RequestContext): Promise<ApiResponseWrapper<NearExpiryAlert>>;
    generateAlerts(requestId: string): Promise<ApiResponseWrapper<{
        generated: number;
        skipped: number;
    }>>;
    findOne(id: string, requestId: string): Promise<ApiResponseWrapper<MedicineInventory>>;
    update(id: string, dto: UpdateMedicineInventoryDto, requestId: string): Promise<ApiResponseWrapper<MedicineInventory>>;
    remove(id: string): Promise<void>;
}
