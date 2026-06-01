import { OffShelfService } from './off-shelf.service';
import { OffShelfOrder } from './entities/off-shelf-order.entity';
import { OffShelfAction } from './enums/off-shelf-action.enum';
import { CreateOffShelfOrderDto } from './dto/create-off-shelf-order.dto';
import { SubmitOffShelfDto } from './dto/submit-off-shelf.dto';
import { ConfirmOffShelfDto } from './dto/confirm-off-shelf.dto';
import { RejectOffShelfDto } from './dto/reject-off-shelf.dto';
import { CancelOffShelfDto } from './dto/cancel-off-shelf.dto';
import { QueryOffShelfDto } from './dto/query-off-shelf.dto';
import { RequestContext } from '../../common/decorators/request-context.decorator';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { ApiResponse } from '../../common/dto/response.dto';
export declare class OffShelfController {
    private readonly offShelfService;
    constructor(offShelfService: OffShelfService);
    create(dto: CreateOffShelfOrderDto, ctx: RequestContext): Promise<ApiResponse<OffShelfOrder>>;
    findAll(query: QueryOffShelfDto): Promise<ApiResponse<PaginatedResult<OffShelfOrder>>>;
    getAllowedActions(id: string, ctx: RequestContext): Promise<ApiResponse<OffShelfAction[]>>;
    findOne(id: string): Promise<ApiResponse<OffShelfOrder>>;
    update(id: string, dto: CreateOffShelfOrderDto, ctx: RequestContext): Promise<ApiResponse<OffShelfOrder>>;
    remove(id: string): Promise<ApiResponse<void>>;
    submit(id: string, dto: SubmitOffShelfDto, ctx: RequestContext): Promise<ApiResponse<OffShelfOrder>>;
    confirm(id: string, dto: ConfirmOffShelfDto, ctx: RequestContext): Promise<ApiResponse<OffShelfOrder>>;
    reject(id: string, dto: RejectOffShelfDto, ctx: RequestContext): Promise<ApiResponse<OffShelfOrder>>;
    cancel(id: string, dto: CancelOffShelfDto, ctx: RequestContext): Promise<ApiResponse<OffShelfOrder>>;
}
