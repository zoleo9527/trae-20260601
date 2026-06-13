import { Repository } from 'typeorm';
import { TrainingNeed, TrainingNeedStatus, Urgency } from '../../entities/training-need.entity';
import { TrainingNeedRemark, RemarkAction } from '../../entities/training-need-remark.entity';
import { User, UserRole } from '../../entities/user.entity';
import { NotificationService } from '../notifications/notifications.service';
import { StatusChangeHistoryService } from '../status-history/status-history.service';
import { CreateTrainingNeedDto } from './dto/create-training-need.dto';
import { UpdateTrainingNeedDto } from './dto/update-training-need.dto';
import { ApproveTrainingNeedDto } from './dto/approve-training-need.dto';
import { RejectTrainingNeedDto } from './dto/reject-training-need.dto';
import { TransferTrainingNeedDto } from './dto/transfer-training-need.dto';
import { AddRemarkDto } from './dto/add-remark.dto';
import { TrainingNeedQueryDto } from './dto/training-need-query.dto';
export declare class TrainingNeedsService {
    private trainingNeedRepository;
    private remarkRepository;
    private userRepository;
    private notificationService;
    private statusHistoryService;
    constructor(trainingNeedRepository: Repository<TrainingNeed>, remarkRepository: Repository<TrainingNeedRemark>, userRepository: Repository<User>, notificationService: NotificationService, statusHistoryService: StatusChangeHistoryService);
    create(createDto: CreateTrainingNeedDto, userId: string): Promise<{
        id: string;
        title: string;
        description: string;
        department: string;
        submitter: {
            id: string;
            name: string;
            department: string;
        };
        currentHandler: {
            id: string;
            name: string;
            department: string;
        };
        expectedDate: Date;
        participantCount: number;
        budget: number;
        urgency: Urgency;
        status: TrainingNeedStatus;
        attachments: any;
        remarks: {
            id: string;
            handler: {
                id: string;
                name: string;
            };
            content: string;
            action: RemarkAction;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(queryDto: TrainingNeedQueryDto, user: User): Promise<{
        items: {
            id: string;
            title: string;
            description: string;
            department: string;
            submitter: {
                id: string;
                name: string;
                department: string;
            };
            currentHandler: {
                id: string;
                name: string;
                department: string;
            };
            expectedDate: Date;
            participantCount: number;
            budget: number;
            urgency: Urgency;
            status: TrainingNeedStatus;
            attachments: any;
            remarks: {
                id: string;
                handler: {
                    id: string;
                    name: string;
                };
                content: string;
                action: RemarkAction;
                createdAt: Date;
            }[];
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        title: string;
        description: string;
        department: string;
        submitter: {
            id: string;
            name: string;
            department: string;
        };
        currentHandler: {
            id: string;
            name: string;
            department: string;
        };
        expectedDate: Date;
        participantCount: number;
        budget: number;
        urgency: Urgency;
        status: TrainingNeedStatus;
        attachments: any;
        remarks: {
            id: string;
            handler: {
                id: string;
                name: string;
            };
            content: string;
            action: RemarkAction;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateDto: UpdateTrainingNeedDto, user: User): Promise<{
        id: string;
        title: string;
        description: string;
        department: string;
        submitter: {
            id: string;
            name: string;
            department: string;
        };
        currentHandler: {
            id: string;
            name: string;
            department: string;
        };
        expectedDate: Date;
        participantCount: number;
        budget: number;
        urgency: Urgency;
        status: TrainingNeedStatus;
        attachments: any;
        remarks: {
            id: string;
            handler: {
                id: string;
                name: string;
            };
            content: string;
            action: RemarkAction;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, user: User): Promise<{
        message: string;
    }>;
    approve(id: string, approveDto: ApproveTrainingNeedDto, handlerId: string): Promise<{
        id: string;
        title: string;
        description: string;
        department: string;
        submitter: {
            id: string;
            name: string;
            department: string;
        };
        currentHandler: {
            id: string;
            name: string;
            department: string;
        };
        expectedDate: Date;
        participantCount: number;
        budget: number;
        urgency: Urgency;
        status: TrainingNeedStatus;
        attachments: any;
        remarks: {
            id: string;
            handler: {
                id: string;
                name: string;
            };
            content: string;
            action: RemarkAction;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    reject(id: string, rejectDto: RejectTrainingNeedDto, handlerId: string): Promise<{
        id: string;
        title: string;
        description: string;
        department: string;
        submitter: {
            id: string;
            name: string;
            department: string;
        };
        currentHandler: {
            id: string;
            name: string;
            department: string;
        };
        expectedDate: Date;
        participantCount: number;
        budget: number;
        urgency: Urgency;
        status: TrainingNeedStatus;
        attachments: any;
        remarks: {
            id: string;
            handler: {
                id: string;
                name: string;
            };
            content: string;
            action: RemarkAction;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    transfer(id: string, transferDto: TransferTrainingNeedDto, handlerId: string): Promise<{
        id: string;
        title: string;
        description: string;
        department: string;
        submitter: {
            id: string;
            name: string;
            department: string;
        };
        currentHandler: {
            id: string;
            name: string;
            department: string;
        };
        expectedDate: Date;
        participantCount: number;
        budget: number;
        urgency: Urgency;
        status: TrainingNeedStatus;
        attachments: any;
        remarks: {
            id: string;
            handler: {
                id: string;
                name: string;
            };
            content: string;
            action: RemarkAction;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    addRemark(id: string, addRemarkDto: AddRemarkDto, handlerId: string): Promise<{
        id: string;
        title: string;
        description: string;
        department: string;
        submitter: {
            id: string;
            name: string;
            department: string;
        };
        currentHandler: {
            id: string;
            name: string;
            department: string;
        };
        expectedDate: Date;
        participantCount: number;
        budget: number;
        urgency: Urgency;
        status: TrainingNeedStatus;
        attachments: any;
        remarks: {
            id: string;
            handler: {
                id: string;
                name: string;
            };
            content: string;
            action: RemarkAction;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    getHistory(id: string): Promise<{
        id: string;
        handler: {
            id: string;
            name: string;
            role: UserRole;
        };
        content: string;
        action: RemarkAction;
        createdAt: Date;
    }[]>;
    getMyPendingNeeds(userId: string): Promise<{
        id: string;
        title: string;
        description: string;
        department: string;
        submitter: {
            id: string;
            name: string;
            department: string;
        };
        currentHandler: {
            id: string;
            name: string;
            department: string;
        };
        expectedDate: Date;
        participantCount: number;
        budget: number;
        urgency: Urgency;
        status: TrainingNeedStatus;
        attachments: any;
        remarks: {
            id: string;
            handler: {
                id: string;
                name: string;
            };
            content: string;
            action: RemarkAction;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    private createRemark;
    private transformNeed;
}
