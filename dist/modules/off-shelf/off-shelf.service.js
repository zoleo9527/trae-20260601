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
exports.OffShelfService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const off_shelf_order_entity_1 = require("./entities/off-shelf-order.entity");
const off_shelf_status_enum_1 = require("./enums/off-shelf-status.enum");
const off_shelf_action_enum_1 = require("./enums/off-shelf-action.enum");
const off_shelf_reason_enum_1 = require("./enums/off-shelf-reason.enum");
const off_shelf_state_machine_1 = require("./state-machine/off-shelf.state-machine");
const business_exception_1 = require("../../common/exceptions/business.exception");
const error_codes_1 = require("../../common/error-codes");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const medicine_inventory_entity_1 = require("../inventory/entities/medicine-inventory.entity");
const near_expiry_alert_entity_1 = require("../inventory/entities/near-expiry-alert.entity");
let OffShelfService = class OffShelfService {
    constructor(offShelfRepository, stateMachine, dataSource) {
        this.offShelfRepository = offShelfRepository;
        this.stateMachine = stateMachine;
        this.dataSource = dataSource;
    }
    async create(dto, ctx) {
        const totalQuantity = dto.items.reduce((sum, item) => sum + item.quantity, 0);
        const order = this.offShelfRepository.create({
            orderNo: `OS${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            reason: dto.reason,
            reasonDetail: dto.reasonDetail,
            items: dto.items,
            totalQuantity,
            currentStatus: off_shelf_status_enum_1.OffShelfStatus.CREATED,
            storeId: ctx.storeId,
            storeName: ctx.storeName,
            auditLogs: [],
        });
        return this.offShelfRepository.save(order);
    }
    async findAll(query) {
        const { page, pageSize, sortBy, sortOrder, currentStatus, reason, storeId, startTime, endTime } = query;
        const where = {};
        if (currentStatus) {
            where.currentStatus = currentStatus;
        }
        if (reason) {
            where.reason = reason;
        }
        if (storeId) {
            where.storeId = storeId;
        }
        if (startTime && endTime) {
            where.createdAt = (0, typeorm_2.Between)(new Date(startTime), new Date(endTime));
        }
        const order = {};
        if (sortBy) {
            order[sortBy] = sortOrder || 'DESC';
        }
        else {
            order.createdAt = 'DESC';
        }
        const [items, total] = await this.offShelfRepository.findAndCount({
            where,
            order,
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return (0, pagination_dto_1.createPaginatedResult)(items, total, page, pageSize);
    }
    async findOne(id) {
        const order = await this.offShelfRepository.findOne({ where: { id } });
        if (!order) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.OFF_SHELF_NOT_FOUND, `下架单 ${id} 不存在`, { id });
        }
        return order;
    }
    async update(id, dto, ctx) {
        const order = await this.findOne(id);
        if (order.currentStatus !== off_shelf_status_enum_1.OffShelfStatus.CREATED) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.OFF_SHELF_INVALID_STATE, '仅 CREATED 状态的下架单可以修改', { id, currentStatus: order.currentStatus });
        }
        const totalQuantity = dto.items.reduce((sum, item) => sum + item.quantity, 0);
        order.reason = dto.reason;
        order.reasonDetail = dto.reasonDetail;
        order.items = dto.items;
        order.totalQuantity = totalQuantity;
        return this.offShelfRepository.save(order);
    }
    async remove(id) {
        const order = await this.findOne(id);
        if (order.currentStatus !== off_shelf_status_enum_1.OffShelfStatus.CREATED) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.OFF_SHELF_INVALID_STATE, '仅 CREATED 状态的下架单可以删除', { id, currentStatus: order.currentStatus });
        }
        await this.offShelfRepository.delete(id);
    }
    async submit(id, dto, ctx) {
        const order = await this.findOne(id);
        this.stateMachine.validateTransition(order.currentStatus, off_shelf_action_enum_1.OffShelfAction.SUBMIT, ctx.userRole);
        const fromStatus = order.currentStatus;
        const toStatus = this.stateMachine.getNextState(order.currentStatus, off_shelf_action_enum_1.OffShelfAction.SUBMIT);
        const auditLog = {
            action: off_shelf_action_enum_1.OffShelfAction.SUBMIT,
            operatorId: ctx.userId,
            operatorName: ctx.userName,
            fromStatus,
            toStatus,
            timestamp: new Date(),
            remark: dto.remark,
        };
        order.currentStatus = toStatus;
        order.submitterId = ctx.userId;
        order.submitterName = ctx.userName;
        order.submitTime = new Date();
        order.auditLogs = [...order.auditLogs, auditLog];
        return this.offShelfRepository.save(order);
    }
    async confirm(id, dto, ctx) {
        const order = await this.findOne(id);
        this.stateMachine.validateTransition(order.currentStatus, off_shelf_action_enum_1.OffShelfAction.CONFIRM, ctx.userRole);
        const fromStatus = order.currentStatus;
        const toStatus = this.stateMachine.getNextState(order.currentStatus, off_shelf_action_enum_1.OffShelfAction.CONFIRM);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await this.deductInventory(order.items, order.storeId, queryRunner);
            if (order.reason === off_shelf_reason_enum_1.OffShelfReason.NEAR_EXPIRY) {
                await this.resolveNearExpiryAlerts(order.items, order.storeId, queryRunner);
            }
            const auditLog = {
                action: off_shelf_action_enum_1.OffShelfAction.CONFIRM,
                operatorId: ctx.userId,
                operatorName: ctx.userName,
                fromStatus,
                toStatus,
                timestamp: new Date(),
                remark: dto.remark,
            };
            order.currentStatus = toStatus;
            order.reviewerId = ctx.userId;
            order.reviewerName = ctx.userName;
            order.reviewTime = new Date();
            order.reviewRemark = dto.remark;
            order.auditLogs = [...order.auditLogs, auditLog];
            const result = await queryRunner.manager.save(order);
            await queryRunner.commitTransaction();
            return result;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async reject(id, dto, ctx) {
        const order = await this.findOne(id);
        this.stateMachine.validateTransition(order.currentStatus, off_shelf_action_enum_1.OffShelfAction.REJECT, ctx.userRole);
        const fromStatus = order.currentStatus;
        const toStatus = this.stateMachine.getNextState(order.currentStatus, off_shelf_action_enum_1.OffShelfAction.REJECT);
        const auditLog = {
            action: off_shelf_action_enum_1.OffShelfAction.REJECT,
            operatorId: ctx.userId,
            operatorName: ctx.userName,
            fromStatus,
            toStatus,
            timestamp: new Date(),
            remark: dto.remark,
        };
        order.currentStatus = toStatus;
        order.reviewerId = ctx.userId;
        order.reviewerName = ctx.userName;
        order.reviewTime = new Date();
        order.reviewRemark = dto.remark;
        order.rejectReason = dto.rejectReason;
        order.auditLogs = [...order.auditLogs, auditLog];
        return this.offShelfRepository.save(order);
    }
    async cancel(id, dto, ctx) {
        const order = await this.findOne(id);
        this.stateMachine.validateTransition(order.currentStatus, off_shelf_action_enum_1.OffShelfAction.CANCEL, ctx.userRole);
        const fromStatus = order.currentStatus;
        const toStatus = this.stateMachine.getNextState(order.currentStatus, off_shelf_action_enum_1.OffShelfAction.CANCEL);
        const auditLog = {
            action: off_shelf_action_enum_1.OffShelfAction.CANCEL,
            operatorId: ctx.userId,
            operatorName: ctx.userName,
            fromStatus,
            toStatus,
            timestamp: new Date(),
            remark: dto.remark,
        };
        order.currentStatus = toStatus;
        order.auditLogs = [...order.auditLogs, auditLog];
        return this.offShelfRepository.save(order);
    }
    async getAllowedActions(id, ctx) {
        const order = await this.findOne(id);
        return this.stateMachine.getAllowedActions(order.currentStatus, ctx.userRole);
    }
    async deductInventory(items, storeId, queryRunner) {
        const inventoryIds = items.map((item) => item.inventoryId);
        const inventories = await queryRunner.manager.find(medicine_inventory_entity_1.MedicineInventory, {
            where: {
                id: (0, typeorm_2.In)(inventoryIds),
                storeId,
            },
        });
        for (const item of items) {
            const inventory = inventories.find((inv) => inv.id === item.inventoryId);
            if (!inventory) {
                throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.INVENTORY_NOT_FOUND, `库存记录不存在: inventoryId=${item.inventoryId}`, { inventoryId: item.inventoryId });
            }
            if (inventory.quantity < item.quantity) {
                throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.INVENTORY_INSUFFICIENT, `库存不足: inventoryId=${item.inventoryId}, 现有=${inventory.quantity}, 需要=${item.quantity}`, { inventoryId: item.inventoryId, available: inventory.quantity, required: item.quantity });
            }
            await queryRunner.manager.update(medicine_inventory_entity_1.MedicineInventory, { id: item.inventoryId }, { quantity: inventory.quantity - item.quantity });
        }
    }
    async resolveNearExpiryAlerts(items, storeId, queryRunner) {
        const inventoryIds = items.map((item) => item.inventoryId);
        const alerts = await queryRunner.manager.find(near_expiry_alert_entity_1.NearExpiryAlert, {
            where: {
                inventoryId: (0, typeorm_2.In)(inventoryIds),
                storeId,
                status: 'ACTIVE',
            },
        });
        for (const alert of alerts) {
            await queryRunner.manager.update(near_expiry_alert_entity_1.NearExpiryAlert, { id: alert.id }, { status: 'RESOLVED', resolvedAt: new Date() });
        }
    }
};
exports.OffShelfService = OffShelfService;
exports.OffShelfService = OffShelfService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(off_shelf_order_entity_1.OffShelfOrder)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        off_shelf_state_machine_1.OffShelfStateMachine,
        typeorm_2.DataSource])
], OffShelfService);
//# sourceMappingURL=off-shelf.service.js.map