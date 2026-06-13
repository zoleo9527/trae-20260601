import { TrainingNeedsService } from './training-needs.service';
import { CreateTrainingNeedDto } from './dto/create-training-need.dto';
import { UpdateTrainingNeedDto } from './dto/update-training-need.dto';
import { ApproveTrainingNeedDto } from './dto/approve-training-need.dto';
import { RejectTrainingNeedDto } from './dto/reject-training-need.dto';
import { TransferTrainingNeedDto } from './dto/transfer-training-need.dto';
import { AddRemarkDto } from './dto/add-remark.dto';
import { TrainingNeedQueryDto } from './dto/training-need-query.dto';
import { UserRole } from '../../entities/user.entity';
export declare class TrainingNeedsController {
    private trainingNeedsService;
    constructor(trainingNeedsService: TrainingNeedsService);
    create(createDto: CreateTrainingNeedDto, req: any): Promise<{
        id: string;
        title: string;
        description: string;
        department: string;
        submitter: {
            id: string;
            name: string;
            department: string;
        };
        expectedDate: Date;
        participantCount: number;
        budget: number;
        urgency: import("../../entities/training-need.entity").Urgency;
        status: import("../../entities/training-need.entity").TrainingNeedStatus;
        attachments: any;
        remarks: {
            id: string;
            handler: {
                id: string;
                name: string;
            };
            content: string;
            action: import("../../entities/training-need-remark.entity").RemarkAction;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(queryDto: TrainingNeedQueryDto, req: any): Promise<{
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
            expectedDate: Date;
            participantCount: number;
            budget: number;
            urgency: import("../../entities/training-need.entity").Urgency;
            status: import("../../entities/training-need.entity").TrainingNeedStatus;
            attachments: any;
            remarks: {
                id: string;
                handler: {
                    id: string;
                    name: string;
                };
                content: string;
                action: import("../../entities/training-need-remark.entity").RemarkAction;
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
        expectedDate: Date;
        participantCount: number;
        budget: number;
        urgency: import("../../entities/training-need.entity").Urgency;
        status: import("../../entities/training-need.entity").TrainingNeedStatus;
        attachments: any;
        remarks: {
            id: string;
            handler: {
                id: string;
                name: string;
            };
            content: string;
            action: import("../../entities/training-need-remark.entity").RemarkAction;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateDto: UpdateTrainingNeedDto, req: any): Promise<{
        id: string;
        title: string;
        description: string;
        department: string;
        submitter: {
            id: string;
            name: string;
            department: string;
        };
        expectedDate: Date;
        participantCount: number;
        budget: number;
        urgency: import("../../entities/training-need.entity").Urgency;
        status: import("../../entities/training-need.entity").TrainingNeedStatus;
        attachments: any;
        remarks: {
            id: string;
            handler: {
                id: string;
                name: string;
            };
            content: string;
            action: import("../../entities/training-need-remark.entity").RemarkAction;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    approve(id: string, approveDto: ApproveTrainingNeedDto, req: any): Promise<{
        id: string;
        title: string;
        description: string;
        department: string;
        submitter: {
            id: string;
            name: string;
            department: string;
        };
        expectedDate: Date;
        participantCount: number;
        budget: number;
        urgency: import("../../entities/training-need.entity").Urgency;
        status: import("../../entities/training-need.entity").TrainingNeedStatus;
        attachments: any;
        remarks: {
            id: string;
            handler: {
                id: string;
                name: string;
            };
            content: string;
            action: import("../../entities/training-need-remark.entity").RemarkAction;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    reject(id: string, rejectDto: RejectTrainingNeedDto, req: any): Promise<{
        id: string;
        title: string;
        description: string;
        department: string;
        submitter: {
            id: string;
            name: string;
            department: string;
        };
        expectedDate: Date;
        participantCount: number;
        budget: number;
        urgency: import("../../entities/training-need.entity").Urgency;
        status: import("../../entities/training-need.entity").TrainingNeedStatus;
        attachments: any;
        remarks: {
            id: string;
            handler: {
                id: string;
                name: string;
            };
            content: string;
            action: import("../../entities/training-need-remark.entity").RemarkAction;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    transfer(id: string, transferDto: TransferTrainingNeedDto, req: any): Promise<{
        id: string;
        title: string;
        description: string;
        department: string;
        submitter: {
            id: string;
            name: string;
            department: string;
        };
        expectedDate: Date;
        participantCount: number;
        budget: number;
        urgency: import("../../entities/training-need.entity").Urgency;
        status: import("../../entities/training-need.entity").TrainingNeedStatus;
        attachments: any;
        remarks: {
            id: string;
            handler: {
                id: string;
                name: string;
            };
            content: string;
            action: import("../../entities/training-need-remark.entity").RemarkAction;
            createdAt: Date;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    addRemark(id: string, addRemarkDto: AddRemarkDto, req: any): Promise<{
        id: string;
        title: string;
        description: string;
        department: string;
        submitter: {
            id: string;
            name: string;
            department: string;
        };
        expectedDate: Date;
        participantCount: number;
        budget: number;
        urgency: import("../../entities/training-need.entity").Urgency;
        status: import("../../entities/training-need.entity").TrainingNeedStatus;
        attachments: any;
        remarks: {
            id: string;
            handler: {
                id: string;
                name: string;
            };
            content: string;
            action: import("../../entities/training-need-remark.entity").RemarkAction;
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
        action: import("../../entities/training-need-remark.entity").RemarkAction;
        createdAt: Date;
    }[]>;
}
