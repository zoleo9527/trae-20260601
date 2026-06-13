"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingNeedsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const training_need_entity_1 = require("../../entities/training-need.entity");
const training_need_remark_entity_1 = require("../../entities/training-need-remark.entity");
const user_entity_1 = require("../../entities/user.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const status_history_service_1 = require("../status-history/status-history.service");
const status_change_history_entity_1 = require("../../entities/status-change-history.entity");
const notification_entity_1 = require("../../entities/notification.entity");
let TrainingNeedsService = class TrainingNeedsService {
    constructor(trainingNeedRepository, remarkRepository, userRepository, notificationService, statusHistoryService) {
        this.trainingNeedRepository = trainingNeedRepository;
        this.remarkRepository = remarkRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.statusHistoryService = statusHistoryService;
    }
    async create(createDto, userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        const trainingNeed = this.trainingNeedRepository.create({
            ...createDto,
            submitterId: userId,
            attachments: createDto.attachments ? JSON.stringify(createDto.attachments) : null,
        });
        await this.trainingNeedRepository.save(trainingNeed);
        return this.findOne(trainingNeed.id);
    }
    async findAll(queryDto, user) {
        const { page = 1, pageSize = 10, status, department, urgency, startDate, endDate, keyword } = queryDto;
        const query = this.trainingNeedRepository
            .createQueryBuilder('tn')
            .leftJoinAndSelect('tn.submitter', 'submitter')
            .leftJoinAndSelect('tn.remarks', 'remarks')
            .leftJoinAndSelect('remarks.handler', 'handler');
        if (status) {
            query.andWhere('tn.status = :status', { status });
        }
        if (department) {
            query.andWhere('tn.department = :department', { department });
        }
        if (urgency) {
            query.andWhere('tn.urgency = :urgency', { urgency });
        }
        if (startDate) {
            query.andWhere('tn.createdAt >= :startDate', { startDate });
        }
        if (endDate) {
            query.andWhere('tn.createdAt <= :endDate', { endDate });
        }
        if (keyword) {
            query.andWhere('(tn.title LIKE :keyword OR tn.description LIKE :keyword)', {
                keyword: `%${keyword}%`,
            });
        }
        if (user.role === user_entity_1.UserRole.DEPARTMENT_HEAD) {
            query.andWhere('tn.department = :userDepartment', { userDepartment: user.department });
        }
        query.orderBy('tn.createdAt', 'DESC');
        const [items, total] = await query
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return {
            items: items.map((item) => this.transformNeed(item)),
            total,
            page,
            pageSize,
        };
    }
    async findOne(id) {
        const trainingNeed = await this.trainingNeedRepository.findOne({
            where: { id },
            relations: ['submitter', 'remarks', 'remarks.handler'],
        });
        if (!trainingNeed) {
            throw new common_1.NotFoundException('培训需求不存在');
        }
        return this.transformNeed(trainingNeed);
    }
    async update(id, updateDto, user) {
        const trainingNeed = await this.trainingNeedRepository.findOne({ where: { id } });
        if (!trainingNeed) {
            throw new common_1.NotFoundException('培训需求不存在');
        }
        if (trainingNeed.submitterId !== user.id && user.role !== user_entity_1.UserRole.TRAINING_MANAGER) {
            throw new common_1.ForbiddenException('无权修改此培训需求');
        }
        if (trainingNeed.status === training_need_entity_1.TrainingNeedStatus.APPROVED) {
            throw new common_1.ForbiddenException('已审批通过的需求不能修改');
        }
        if (updateDto.attachments) {
            updateDto = { ...updateDto, attachments: JSON.stringify(updateDto.attachments) };
        }
        await this.trainingNeedRepository.update(id, updateDto);
        return this.findOne(id);
    }
    async remove(id, user) {
        const trainingNeed = await this.trainingNeedRepository.findOne({ where: { id } });
        if (!trainingNeed) {
            throw new common_1.NotFoundException('培训需求不存在');
        }
        if (trainingNeed.submitterId !== user.id && user.role !== user_entity_1.UserRole.TRAINING_MANAGER) {
            throw new common_1.ForbiddenException('无权删除此培训需求');
        }
        if (trainingNeed.status === training_need_entity_1.TrainingNeedStatus.APPROVED) {
            throw new common_1.ForbiddenException('已审批通过的需求不能删除');
        }
        await this.trainingNeedRepository.delete(id);
        return { message: '删除成功' };
    }
    async approve(id, approveDto, handlerId) {
        const trainingNeed = await this.trainingNeedRepository.findOne({
            where: { id },
            relations: ['submitter'],
        });
        if (!trainingNeed) {
            throw new common_1.NotFoundException('培训需求不存在');
        }
        if (trainingNeed.status !== training_need_entity_1.TrainingNeedStatus.PENDING) {
            throw new common_1.ForbiddenException('只能审批待审批状态的需求');
        }
        const fromStatus = trainingNeed.status;
        await this.trainingNeedRepository.update(id, { status: training_need_entity_1.TrainingNeedStatus.APPROVED });
        await this.statusHistoryService.recordStatusChange(status_change_history_entity_1.EntityType.TRAINING_NEED, id, fromStatus, training_need_entity_1.TrainingNeedStatus.APPROVED, handlerId, undefined, approveDto.remarks);
        if (approveDto.remarks) {
            await this.createRemark(id, handlerId, approveDto.remarks, training_need_remark_entity_1.RemarkAction.APPROVE);
        }
        await this.notificationService.sendNotification(notification_entity_1.NotificationType.TRAINING_NEED_APPROVED, trainingNeed.submitterId, '培训需求已审批通过', `您提交的培训需求「${trainingNeed.title}」已审批通过，将进入课程立项阶段。`, 'training_need', id);
        return this.findOne(id);
    }
    async reject(id, rejectDto, handlerId) {
        const trainingNeed = await this.trainingNeedRepository.findOne({
            where: { id },
            relations: ['submitter'],
        });
        if (!trainingNeed) {
            throw new common_1.NotFoundException('培训需求不存在');
        }
        if (trainingNeed.status !== training_need_entity_1.TrainingNeedStatus.PENDING) {
            throw new common_1.ForbiddenException('只能驳回待审批状态的需求');
        }
        const remarks = rejectDto.reason + (rejectDto.remarks ? `\n${rejectDto.remarks}` : '');
        const fromStatus = trainingNeed.status;
        await this.trainingNeedRepository.update(id, { status: training_need_entity_1.TrainingNeedStatus.REJECTED });
        await this.statusHistoryService.recordStatusChange(status_change_history_entity_1.EntityType.TRAINING_NEED, id, fromStatus, training_need_entity_1.TrainingNeedStatus.REJECTED, handlerId, rejectDto.reason, rejectDto.remarks);
        await this.createRemark(id, handlerId, remarks, training_need_remark_entity_1.RemarkAction.REJECT);
        await this.notificationService.sendNotification(notification_entity_1.NotificationType.TRAINING_NEED_REJECTED, trainingNeed.submitterId, '培训需求已被驳回', `您提交的培训需求「${trainingNeed.title}」已被驳回，原因：${rejectDto.reason}`, 'training_need', id);
        return this.findOne(id);
    }
    async transfer(id, transferDto, handlerId) {
        const trainingNeed = await this.trainingNeedRepository.findOne({
            where: { id },
            relations: ['submitter'],
        });
        if (!trainingNeed) {
            throw new common_1.NotFoundException('培训需求不存在');
        }
        const targetManager = await this.userRepository.findOne({
            where: { id: transferDto.targetManagerId, role: user_entity_1.UserRole.TRAINING_MANAGER },
        });
        if (!targetManager) {
            throw new common_1.NotFoundException('目标培训经理不存在');
        }
        if (trainingNeed.status !== training_need_entity_1.TrainingNeedStatus.PENDING) {
            throw new common_1.ForbiddenException('只能转派待审批状态的需求');
        }
        const fromStatus = trainingNeed.status;
        await this.trainingNeedRepository.update(id, { status: training_need_entity_1.TrainingNeedStatus.TRANSFERRED });
        await this.statusHistoryService.recordStatusChange(status_change_history_entity_1.EntityType.TRAINING_NEED, id, fromStatus, training_need_entity_1.TrainingNeedStatus.TRANSFERRED, handlerId, `转派给${targetManager.name}`, transferDto.remarks);
        if (transferDto.remarks) {
            await this.createRemark(id, handlerId, transferDto.remarks, training_need_remark_entity_1.RemarkAction.TRANSFER);
        }
        await this.notificationService.sendNotification(notification_entity_1.NotificationType.TRAINING_NEED_TRANSFERRED, targetManager.id, '培训需求已转派给您', `培训需求「${trainingNeed.title}」已转派给您，请及时处理。`, 'training_need', id);
        return this.findOne(id);
    }
    async addRemark(id, addRemarkDto, handlerId) {
        const trainingNeed = await this.trainingNeedRepository.findOne({ where: { id } });
        if (!trainingNeed) {
            throw new common_1.NotFoundException('培训需求不存在');
        }
        await this.createRemark(id, handlerId, addRemarkDto.content, training_need_remark_entity_1.RemarkAction.COMMENT);
        return this.findOne(id);
    }
    async getHistory(id) {
        const remarks = await this.remarkRepository.find({
            where: { trainingNeedId: id },
            relations: ['handler'],
            order: { createdAt: 'ASC' },
        });
        return remarks.map((remark) => ({
            id: remark.id,
            handler: {
                id: remark.handler.id,
                name: remark.handler.name,
                role: remark.handler.role,
            },
            content: remark.content,
            action: remark.action,
            createdAt: remark.createdAt,
        }));
    }
    async createRemark(trainingNeedId, handlerId, content, action) {
        const remark = this.remarkRepository.create({
            trainingNeedId,
            handlerId,
            content,
            action,
        });
        await this.remarkRepository.save(remark);
    }
    transformNeed(trainingNeed) {
        return {
            id: trainingNeed.id,
            title: trainingNeed.title,
            description: trainingNeed.description,
            department: trainingNeed.department,
            submitter: {
                id: trainingNeed.submitter.id,
                name: trainingNeed.submitter.name,
                department: trainingNeed.submitter.department,
            },
            expectedDate: trainingNeed.expectedDate,
            participantCount: trainingNeed.participantCount,
            budget: trainingNeed.budget,
            urgency: trainingNeed.urgency,
            status: trainingNeed.status,
            attachments: trainingNeed.attachments ? JSON.parse(trainingNeed.attachments) : [],
            remarks: trainingNeed.remarks?.map((remark) => ({
                id: remark.id,
                handler: {
                    id: remark.handler?.id,
                    name: remark.handler?.name,
                },
                content: remark.content,
                action: remark.action,
                createdAt: remark.createdAt,
            })) || [],
            createdAt: trainingNeed.createdAt,
            updatedAt: trainingNeed.updatedAt,
        };
    }
};
exports.TrainingNeedsService = TrainingNeedsService;
exports.TrainingNeedsService = TrainingNeedsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(training_need_entity_1.TrainingNeed)),
    __param(1, (0, typeorm_1.InjectRepository)(training_need_remark_entity_1.TrainingNeedRemark)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationService,
        status_history_service_1.StatusChangeHistoryService])
], TrainingNeedsService);
//# sourceMappingURL=training-needs.service.js.map