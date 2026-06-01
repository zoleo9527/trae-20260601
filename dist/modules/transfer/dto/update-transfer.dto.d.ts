import { CreateTransferDto } from './create-transfer.dto';
import { TransferItemDto } from './transfer-item.dto';
declare const UpdateTransferDto_base: import("@nestjs/common").Type<Partial<CreateTransferDto>>;
export declare class UpdateTransferDto extends UpdateTransferDto_base {
    items?: TransferItemDto[];
}
export {};
