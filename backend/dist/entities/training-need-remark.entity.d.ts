import { User } from './user.entity';
import { TrainingNeed } from './training-need.entity';
export declare enum RemarkAction {
    APPROVE = "approve",
    REJECT = "reject",
    TRANSFER = "transfer",
    COMMENT = "comment"
}
export declare class TrainingNeedRemark {
    id: string;
    trainingNeedId: string;
    trainingNeed: TrainingNeed;
    handlerId: string;
    handler: User;
    content: string;
    action: RemarkAction;
    createdAt: Date;
}
