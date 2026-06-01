import { OffShelfReason } from '../enums/off-shelf-reason.enum';
import { OffShelfItemDto } from './off-shelf-item.dto';
export declare class CreateOffShelfOrderDto {
    reason: OffShelfReason;
    reasonDetail?: string;
    items: OffShelfItemDto[];
}
