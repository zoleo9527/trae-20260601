import { TransferAction } from '../enums';
export declare class BatchApproveDto {
    ids: string[];
    action: TransferAction.APPROVE | TransferAction.REJECT;
    remark?: string;
    rejectReason?: string;
}
