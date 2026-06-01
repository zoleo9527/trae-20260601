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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const medicine_inventory_entity_1 = require("./entities/medicine-inventory.entity");
const near_expiry_alert_entity_1 = require("./entities/near-expiry-alert.entity");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const business_exception_1 = require("../../common/exceptions/business.exception");
const error_codes_1 = require("../../common/error-codes");
const alert_state_machine_1 = require("./alert.state-machine");
let InventoryService = class InventoryService {
    constructor(inventoryRepository, alertRepository, alertStateMachine, dataSource) {
        this.inventoryRepository = inventoryRepository;
        this.alertRepository = alertRepository;
        this.alertStateMachine = alertStateMachine;
        this.dataSource = dataSource;
    }
    async create(dto) {
        const existing = await this.inventoryRepository.findOne({
            where: { medicineCode: dto.medicineCode, batchNo: dto.batchNo },
        });
        if (existing) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.INVENTORY_NOT_FOUND, '该药品批次已存在库存记录');
        }
        const inventory = this.inventoryRepository.create(dto);
        return this.inventoryRepository.save(inventory);
    }
    async findAll(query) {
        const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC', medicineName, batchNo, expiryDateStart, expiryDateEnd, storeId } = query;
        const where = {};
        if (medicineName) {
            where.medicineName = (0, typeorm_2.Like)(`%${medicineName}%`);
        }
        if (batchNo) {
            where.batchNo = batchNo;
        }
        if (expiryDateStart && expiryDateEnd) {
            where.expiryDate = (0, typeorm_2.Between)(expiryDateStart, expiryDateEnd);
        }
        else if (expiryDateStart) {
            where.expiryDate = (0, typeorm_2.MoreThanOrEqual)(expiryDateStart);
        }
        else if (expiryDateEnd) {
            where.expiryDate = (0, typeorm_2.LessThanOrEqual)(expiryDateEnd);
        }
        if (storeId) {
            where.storeId = storeId;
        }
        const [items, total] = await this.inventoryRepository.findAndCount({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            order: { [sortBy]: sortOrder },
        });
        return (0, pagination_dto_1.createPaginatedResult)(items, total, page, pageSize);
    }
    async findOne(id) {
        const inventory = await this.inventoryRepository.findOne({ where: { id } });
        if (!inventory) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.INVENTORY_NOT_FOUND);
        }
        return inventory;
    }
    async update(id, dto) {
        const inventory = await this.findOne(id);
        Object.assign(inventory, dto);
        return this.inventoryRepository.save(inventory);
    }
    async remove(id) {
        const result = await this.inventoryRepository.delete(id);
        if (result.affected === 0) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.INVENTORY_NOT_FOUND);
        }
    }
    async findNearExpiryMedicines(daysToExpiry) {
        const today = new Date();
        const expiryThreshold = new Date();
        expiryThreshold.setDate(today.getDate() + daysToExpiry);
        return this.inventoryRepository.find({
            where: {
                expiryDate: (0, typeorm_2.LessThanOrEqual)(expiryThreshold),
                quantity: (0, typeorm_2.MoreThanOrEqual)(1),
            },
            order: { expiryDate: 'ASC' },
        });
    }
    calculateDaysToExpiry(expiryDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    calculateAlertLevel(daysToExpiry) {
        if (daysToExpiry <= 30) {
            return near_expiry_alert_entity_1.AlertLevel.HIGH;
        }
        else if (daysToExpiry <= 60) {
            return near_expiry_alert_entity_1.AlertLevel.MEDIUM;
        }
        else {
            return near_expiry_alert_entity_1.AlertLevel.LOW;
        }
    }
    async generateAlerts() {
        const today = new Date();
        const expiryThreshold = new Date();
        expiryThreshold.setDate(today.getDate() + 90);
        const inventories = await this.inventoryRepository.find({
            where: {
                expiryDate: (0, typeorm_2.LessThanOrEqual)(expiryThreshold),
                quantity: (0, typeorm_2.MoreThanOrEqual)(1),
            },
        });
        let generatedCount = 0;
        let skippedCount = 0;
        for (const inventory of inventories) {
            const daysToExpiry = this.calculateDaysToExpiry(inventory.expiryDate);
            if (daysToExpiry > 90) {
                skippedCount++;
                continue;
            }
            const existingAlert = await this.alertRepository.findOne({
                where: {
                    inventoryId: inventory.id,
                    status: (0, typeorm_2.In)([near_expiry_alert_entity_1.AlertStatus.ACTIVE, near_expiry_alert_entity_1.AlertStatus.ACKNOWLEDGED]),
                },
            });
            if (existingAlert) {
                existingAlert.daysToExpiry = daysToExpiry;
                existingAlert.alertLevel = this.calculateAlertLevel(daysToExpiry);
                existingAlert.currentQuantity = inventory.quantity;
                await this.alertRepository.save(existingAlert);
                skippedCount++;
                continue;
            }
            const alertLevel = this.calculateAlertLevel(daysToExpiry);
            const alert = this.alertRepository.create({
                inventoryId: inventory.id,
                medicineCode: inventory.medicineCode,
                medicineName: inventory.medicineName,
                batchNo: inventory.batchNo,
                expiryDate: inventory.expiryDate,
                currentQuantity: inventory.quantity,
                daysToExpiry,
                alertLevel,
                status: near_expiry_alert_entity_1.AlertStatus.ACTIVE,
                storeId: inventory.storeId,
                storeName: inventory.storeName,
            });
            await this.alertRepository.save(alert);
            generatedCount++;
        }
        return { generated: generatedCount, skipped: skippedCount };
    }
    async findAlerts(query) {
        const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC', alertLevel, status, minDaysToExpiry, maxDaysToExpiry, storeId } = query;
        const where = {};
        if (alertLevel) {
            where.alertLevel = alertLevel;
        }
        if (status) {
            where.status = status;
        }
        if (minDaysToExpiry !== undefined && maxDaysToExpiry !== undefined) {
            where.daysToExpiry = (0, typeorm_2.Between)(minDaysToExpiry, maxDaysToExpiry);
        }
        else if (minDaysToExpiry !== undefined) {
            where.daysToExpiry = (0, typeorm_2.MoreThanOrEqual)(minDaysToExpiry);
        }
        else if (maxDaysToExpiry !== undefined) {
            where.daysToExpiry = (0, typeorm_2.LessThanOrEqual)(maxDaysToExpiry);
        }
        if (storeId) {
            where.storeId = storeId;
        }
        const [items, total] = await this.alertRepository.findAndCount({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            order: { [sortBy]: sortOrder },
        });
        return (0, pagination_dto_1.createPaginatedResult)(items, total, page, pageSize);
    }
    async findAlertById(id) {
        const alert = await this.alertRepository.findOne({ where: { id } });
        if (!alert) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.ALERT_NOT_FOUND);
        }
        return alert;
    }
    async acknowledgeAlert(id, dto, operatorId) {
        const alert = await this.findAlertById(id);
        this.alertStateMachine.validateTransition(alert.status, near_expiry_alert_entity_1.AlertAction.ACKNOWLEDGE);
        const nextStatus = this.alertStateMachine.getNextState(alert.status, near_expiry_alert_entity_1.AlertAction.ACKNOWLEDGE);
        alert.status = nextStatus;
        alert.acknowledgedBy = operatorId;
        alert.acknowledgedAt = new Date();
        alert.acknowledgedRemark = dto.remark;
        return this.alertRepository.save(alert);
    }
    async resolveAlert(id, dto, operatorId) {
        const alert = await this.findAlertById(id);
        this.alertStateMachine.validateTransition(alert.status, near_expiry_alert_entity_1.AlertAction.RESOLVE);
        const nextStatus = this.alertStateMachine.getNextState(alert.status, near_expiry_alert_entity_1.AlertAction.RESOLVE);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const inventory = await queryRunner.manager.findOne(medicine_inventory_entity_1.MedicineInventory, {
                where: { id: alert.inventoryId },
            });
            if (!inventory) {
                throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.INVENTORY_NOT_FOUND);
            }
            if (inventory.quantity < alert.currentQuantity) {
                throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.INVENTORY_INSUFFICIENT);
            }
            inventory.quantity = Number((inventory.quantity - alert.currentQuantity).toFixed(2));
            await queryRunner.manager.save(inventory);
            alert.status = nextStatus;
            alert.resolvedBy = operatorId;
            alert.resolvedAt = new Date();
            alert.resolvedRemark = dto.remark;
            await queryRunner.manager.save(alert);
            await queryRunner.commitTransaction();
            return alert;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async findByMedicineAndBatch(medicineId, batchNo, storeId) {
        return this.inventoryRepository.findOne({
            where: {
                medicineCode: medicineId,
                batchNo,
                storeId,
            },
        });
    }
    async decreaseQuantity(medicineId, batchNo, storeId, quantity) {
        const inventory = await this.findByMedicineAndBatch(medicineId, batchNo, storeId);
        if (!inventory) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.INVENTORY_NOT_FOUND, `库存记录不存在: 药品=${medicineId}, 批号=${batchNo}, 门店=${storeId}`);
        }
        if (inventory.quantity < quantity) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.INVENTORY_INSUFFICIENT, `库存不足: 药品=${inventory.medicineName}, 批号=${batchNo}, 现有库存=${inventory.quantity}, 需要=${quantity}`, {
                medicineId,
                medicineName: inventory.medicineName,
                batchNo,
                storeId,
                available: inventory.quantity,
                required: quantity,
            });
        }
        inventory.quantity = Number(inventory.quantity) - quantity;
        await this.inventoryRepository.save(inventory);
    }
    async increaseQuantity(medicineId, batchNo, storeId, quantity, medicineName, expiryDate, sellingPrice, unit, storeName, specification, manufacturer, location, purchasePrice) {
        let inventory = await this.findByMedicineAndBatch(medicineId, batchNo, storeId);
        if (inventory) {
            inventory.quantity = Number(inventory.quantity) + quantity;
            if (medicineName && inventory.medicineName !== medicineName) {
                inventory.medicineName = medicineName;
            }
            if (expiryDate) {
                const newExpiryTime = new Date(expiryDate).getTime();
                const currentExpiryTime = new Date(inventory.expiryDate).getTime();
                if (currentExpiryTime !== newExpiryTime) {
                    inventory.expiryDate = new Date(expiryDate);
                }
            }
            if (sellingPrice !== undefined && inventory.sellingPrice !== sellingPrice) {
                inventory.sellingPrice = sellingPrice;
            }
            if (unit && inventory.unit !== unit) {
                inventory.unit = unit;
            }
            if (storeName && inventory.storeName !== storeName) {
                inventory.storeName = storeName;
            }
            if (specification && specification !== '-' && inventory.specification !== specification) {
                inventory.specification = specification;
            }
            if (manufacturer && manufacturer !== '-' && inventory.manufacturer !== manufacturer) {
                inventory.manufacturer = manufacturer;
            }
            if (location && location !== '-' && inventory.location !== location) {
                inventory.location = location;
            }
            if (purchasePrice !== undefined && inventory.purchasePrice !== purchasePrice) {
                inventory.purchasePrice = purchasePrice;
            }
        }
        else {
            if (!medicineName || !expiryDate || !sellingPrice) {
                throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.INVENTORY_NOT_FOUND, `新增库存需要药品名称、有效期和售价信息`);
            }
            inventory = this.inventoryRepository.create({
                medicineCode: medicineId,
                medicineName,
                specification: specification || '-',
                manufacturer: manufacturer || '-',
                batchNo,
                expiryDate: new Date(expiryDate),
                quantity,
                unit: unit || '盒',
                purchasePrice: purchasePrice ?? sellingPrice,
                sellingPrice,
                storeId,
                storeName: storeName || '-',
                location: location || '-',
            });
        }
        await this.inventoryRepository.save(inventory);
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(medicine_inventory_entity_1.MedicineInventory)),
    __param(1, (0, typeorm_1.InjectRepository)(near_expiry_alert_entity_1.NearExpiryAlert)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        alert_state_machine_1.AlertStateMachine,
        typeorm_2.DataSource])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map