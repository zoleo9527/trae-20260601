import { TransferService } from './transfer.service';
import { CreateTransferDto, UpdateTransferDto, TransferActionDto, BatchApproveDto, QueryTransferDto, BatchApproveResultDto } from './dto';
import { TransferOrder } from './entities/transfer-order.entity';
import { TransferAction, TransferStatus } from './enums';
import { RequestContext } from '../../common/decorators/request-context.decorator';
import { ApiResponse as ApiResponseDto } from '../../common/dto/response.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
export declare class TransferController {
    private readonly transferService;
    constructor(transferService: TransferService);
    create(createTransferDto: CreateTransferDto, ctx: RequestContext): Promise<ApiResponseDto<TransferOrder>>;
    findAll(query: QueryTransferDto, ctx: RequestContext): Promise<ApiResponseDto<PaginatedResult<TransferOrder>>>;
    getStatistics(ctx: RequestContext): Promise<ApiResponseDto<Record<TransferStatus, number>>>;
    batchApprove(dto: BatchApproveDto, ctx: RequestContext): Promise<ApiResponseDto<BatchApproveResultDto>>;
    getAllowedActions(id: string, ctx: RequestContext): Promise<ApiResponseDto<TransferAction[]>>;
    findOne(id: string, ctx: RequestContext): Promise<ApiResponseDto<TransferOrder>>;
    update(id: string, updateTransferDto: UpdateTransferDto, ctx: RequestContext): Promise<ApiResponseDto<TransferOrder>>;
    remove(id: string): Promise<void>;
    submit(id: string, dto: TransferActionDto, ctx: RequestContext): Promise<ApiResponseDto<TransferOrder>>;
    approve(id: string, dto: TransferActionDto, ctx: RequestContext): Promise<ApiResponseDto<TransferOrder>>;
    reject(id: string, dto: TransferActionDto, ctx: RequestContext): Promise<ApiResponseDto<TransferOrder>>;
    complete(id: string, dto: TransferActionDto, ctx: RequestContext): Promise<ApiResponseDto<TransferOrder>>;
    cancel(id: string, dto: TransferActionDto, ctx: RequestContext): Promise<ApiResponseDto<TransferOrder>>;
}
