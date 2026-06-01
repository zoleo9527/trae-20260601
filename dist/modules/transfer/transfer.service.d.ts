import { Repository } from 'typeorm';
import { TransferOrder } from './entities/transfer-order.entity';
import { TransferStatus, TransferAction } from './enums';
import { TransferStateMachine } from './state-machine/transfer.state-machine';
import { CreateTransferDto, UpdateTransferDto, TransferActionDto, BatchApproveDto, QueryTransferDto, BatchApproveResultDto } from './dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { InventoryService } from '../inventory/inventory.service';
export interface Operator {
    id: string;
    name: string;
    role: string;
}
export declare class TransferService {
    private readonly transferRepository;
    private readonly stateMachine;
    private readonly inventoryService;
    constructor(transferRepository: Repository<TransferOrder>, stateMachine: TransferStateMachine, inventoryService: InventoryService);
    create(createDto: CreateTransferDto, operator: Operator): Promise<TransferOrder>;
    findAll(query: QueryTransferDto): Promise<PaginatedResult<TransferOrder>>;
    findOne(id: string): Promise<TransferOrder>;
    update(id: string, updateDto: UpdateTransferDto): Promise<TransferOrder>;
    remove(id: string): Promise<void>;
    submit(id: string, dto: TransferActionDto, operator: Operator): Promise<TransferOrder>;
    approve(id: string, dto: TransferActionDto, operator: Operator): Promise<TransferOrder>;
    reject(id: string, dto: TransferActionDto, operator: Operator): Promise<TransferOrder>;
    complete(id: string, dto: TransferActionDto, operator: Operator): Promise<TransferOrder>;
    cancel(id: string, dto: TransferActionDto, operator: Operator): Promise<TransferOrder>;
    batchApprove(dto: BatchApproveDto, operator: Operator): Promise<BatchApproveResultDto>;
    getAllowedActions(id: string, operator: Operator): Promise<TransferAction[]>;
    getStatistics(): Promise<Record<TransferStatus, number>>;
    private performAction;
    private validateAndUpdateInventory;
    private generateOrderNo;
}
