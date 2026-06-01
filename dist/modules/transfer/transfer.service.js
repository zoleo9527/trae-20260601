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
exports.TransferService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const transfer_order_entity_1 = require("./entities/transfer-order.entity");
const enums_1 = require("./enums");
const transfer_state_machine_1 = require("./state-machine/transfer.state-machine");
const business_exception_1 = require("../../common/exceptions/business.exception");
const error_codes_1 = require("../../common/error-codes");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const inventory_service_1 = require("../inventory/inventory.service");
let TransferService = class TransferService {
    constructor(transferRepository, stateMachine, inventoryService) {
        this.transferRepository = transferRepository;
        this.stateMachine = stateMachine;
        this.inventoryService = inventoryService;
    }
    async create(createDto, operator) {
        const { items, priority, ...rest } = createDto;
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
        const order = this.transferRepository.create({
            ...rest,
            items: items,
            totalQuantity,
            totalAmount,
            priority: priority || enums_1.TransferPriority.MEDIUM,
            currentStatus: enums_1.TransferStatus.DRAFT,
            auditLogs: [],
            orderNo: this.generateOrderNo(),
        });
        return this.transferRepository.save(order);
    }
    async findAll(query) {
        const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC', currentStatus, transferType, priority, fromStoreId, toStoreId, startTime, endTime, } = query;
        const where = {};
        if (currentStatus)
            where.currentStatus = currentStatus;
        if (transferType)
            where.transferType = transferType;
        if (priority)
            where.priority = priority;
        if (fromStoreId)
            where.fromStoreId = fromStoreId;
        if (toStoreId)
            where.toStoreId = toStoreId;
        if (startTime && endTime) {
            where.createdAt = (0, typeorm_2.Between)(new Date(startTime), new Date(endTime));
        }
        const [items, total] = await this.transferRepository.findAndCount({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            order: { [sortBy]: sortOrder },
        });
        return (0, pagination_dto_1.createPaginatedResult)(items, total, page, pageSize);
    }
    async findOne(id) {
        const order = await this.transferRepository.findOne({ where: { id } });
        if (!order) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.TRANSFER_NOT_FOUND, `调拨单不存在: ${id}`);
        }
        return order;
    }
    async update(id, updateDto) {
        const order = await this.findOne(id);
        if (order.currentStatus !== enums_1.TransferStatus.DRAFT) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.TRANSFER_INVALID_STATE, '只有草稿状态的调拨单可以修改', { currentStatus: order.currentStatus });
        }
        const { items, ...rest } = updateDto;
        if (items) {
            const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
            const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
            Object.assign(order, {
                ...rest,
                items: items,
                totalQuantity,
                totalAmount,
            });
        }
        else {
            Object.assign(order, rest);
        }
        return this.transferRepository.save(order);
    }
    async remove(id) {
        const order = await this.findOne(id);
        if (order.currentStatus !== enums_1.TransferStatus.DRAFT) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.TRANSFER_INVALID_STATE, '只有草稿状态的调拨单可以删除', { currentStatus: order.currentStatus });
        }
        await this.transferRepository.remove(order);
    }
    async submit(id, dto, operator) {
        return this.performAction(id, enums_1.TransferAction.SUBMIT, dto, operator);
    }
    async approve(id, dto, operator) {
        if (operator.role !== 'MANAGER') {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.TRANSFER_MANAGER_REQUIRED);
        }
        return this.performAction(id, enums_1.TransferAction.APPROVE, dto, operator);
    }
    async reject(id, dto, operator) {
        if (operator.role !== 'MANAGER') {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.TRANSFER_MANAGER_REQUIRED);
        }
        if (!dto.rejectReason) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.INVALID_PARAMETER, '拒绝原因不能为空');
        }
        return this.performAction(id, enums_1.TransferAction.REJECT, dto, operator);
    }
    async complete(id, dto, operator) {
        const order = await this.findOne(id);
        this.stateMachine.validateTransition(order.currentStatus, enums_1.TransferAction.COMPLETE, operator.role);
        await this.validateAndUpdateInventory(order);
        return this.performAction(id, enums_1.TransferAction.COMPLETE, dto, operator);
    }
    async cancel(id, dto, operator) {
        return this.performAction(id, enums_1.TransferAction.CANCEL, dto, operator);
    }
    async batchApprove(dto, operator) {
        const { ids, action, remark, rejectReason } = dto;
        if (ids.length === 0) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.TRANSFER_BATCH_EMPTY);
        }
        if (operator.role !== 'MANAGER') {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.TRANSFER_MANAGER_REQUIRED);
        }
        if (action === enums_1.TransferAction.REJECT && !rejectReason) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.INVALID_PARAMETER, '批量拒绝时拒绝原因不能为空');
        }
        const results = [];
        let successCount = 0;
        let failCount = 0;
        for (const id of ids) {
            try {
                await this.performAction(id, action, { remark, rejectReason }, operator);
                results.push({ id, success: true });
                successCount++;
            }
            catch (error) {
                const code = error instanceof business_exception_1.BusinessException ? error.getCode() : error_codes_1.ErrorCode.INTERNAL_ERROR;
                const message = error instanceof Error ? error.message : '未知错误';
                results.push({ id, success: false, code, message });
                failCount++;
            }
        }
        return { successCount, failCount, results };
    }
    async getAllowedActions(id, operator) {
        const order = await this.findOne(id);
        return this.stateMachine.getAllowedActions(order.currentStatus, operator.role);
    }
    async getStatistics() {
        const statuses = Object.values(enums_1.TransferStatus);
        const result = {};
        for (const status of statuses) {
            result[status] = await this.transferRepository.count({ where: { currentStatus: status } });
        }
        return result;
    }
    async performAction(id, action, dto, operator) {
        const order = await this.findOne(id);
        const fromStatus = order.currentStatus;
        this.stateMachine.validateTransition(fromStatus, action, operator.role);
        const toStatus = this.stateMachine.getNextState(fromStatus, action);
        const now = new Date();
        const auditLog = {
            action,
            fromStatus,
            toStatus,
            operatorId: operator.id,
            operatorName: operator.name,
            operateTime: now,
            remark: dto.remark,
            rejectReason: dto.rejectReason,
        };
        order.auditLogs = [...order.auditLogs, auditLog];
        order.currentStatus = toStatus;
        switch (action) {
            case enums_1.TransferAction.SUBMIT:
                order.submitterId = operator.id;
                order.submitterName = operator.name;
                order.submitTime = now;
                break;
            case enums_1.TransferAction.APPROVE:
                order.approverId = operator.id;
                order.approverName = operator.name;
                order.approveTime = now;
                order.approveRemark = dto.remark;
                break;
            case enums_1.TransferAction.REJECT:
                order.approverId = operator.id;
                order.approverName = operator.name;
                order.approveTime = now;
                order.rejectReason = dto.rejectReason;
                break;
            case enums_1.TransferAction.COMPLETE:
                order.completedBy = operator.id;
                order.completedAt = now;
                break;
        }
        return this.transferRepository.save(order);
    }
    async validateAndUpdateInventory(order) {
        for (const item of order.items) {
            const sourceInventory = await this.inventoryService.findByMedicineAndBatch(item.medicineCode, item.batchNo, order.fromStoreId);
            await this.inventoryService.decreaseQuantity(item.medicineCode, item.batchNo, order.fromStoreId, item.quantity);
            await this.inventoryService.increaseQuantity(item.medicineCode, item.batchNo, order.toStoreId, item.quantity, item.medicineName, item.expiryDate, item.sellingPrice, item.unit, order.toStoreName, sourceInventory?.specification, sourceInventory?.manufacturer, sourceInventory?.location, sourceInventory?.purchasePrice);
        }
    }
    generateOrderNo() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = (0, uuid_1.v4)().substring(0, 8).toUpperCase();
        return `TR${year}${month}${day}${random}`;
    }
};
exports.TransferService = TransferService;
exports.TransferService = TransferService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transfer_order_entity_1.TransferOrder)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transfer_state_machine_1.TransferStateMachine,
        inventory_service_1.InventoryService])
], TransferService);
//# sourceMappingURL=transfer.service.js.map