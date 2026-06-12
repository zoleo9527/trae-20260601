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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const audit_service_1 = require("../audit/audit.service");
const STATE_MACHINE = {
    available: ['viewing'],
    viewing: ['available', 'leased'],
    leased: ['handover_pending'],
    handover_pending: ['leased', 'handover_accepted'],
    handover_accepted: ['occupied'],
    occupied: ['returning'],
    returning: ['available'],
};
let PropertyService = class PropertyService {
    constructor(auditService) {
        this.auditService = auditService;
        this.properties = [];
    }
    findAll(filters) {
        let result = [...this.properties];
        if (filters?.status) {
            result = result.filter((p) => p.status === filters.status);
        }
        if (filters?.building) {
            result = result.filter((p) => p.building === filters.building);
        }
        if (filters?.floor !== undefined) {
            result = result.filter((p) => p.floor === filters.floor);
        }
        return result;
    }
    findOne(id) {
        const property = this.properties.find((p) => p.id === id);
        if (!property) {
            throw new common_1.NotFoundException(`房源 #${id} 未找到`);
        }
        return property;
    }
    create(data, userId, userName, userRole) {
        const property = {
            id: (0, uuid_1.v4)(),
            building: data.building,
            floor: data.floor,
            unit: data.unit,
            area: data.area,
            status: 'available',
            rentPrice: data.rentPrice,
            deposit: data.deposit,
            currentTenant: data.currentTenant,
            description: data.description,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.properties.push(property);
        this.auditService.log({
            userId,
            userName,
            userRole,
            action: 'create',
            entity: 'property',
            entityId: property.id,
            after: { ...property },
        });
        return property;
    }
    updateStatus(id, newStatus, userId, userName, userRole) {
        const property = this.findOne(id);
        const currentStatus = property.status;
        const allowed = STATE_MACHINE[currentStatus];
        if (!allowed || !allowed.includes(newStatus)) {
            throw new common_1.BadRequestException(`不允许从 "${currentStatus}" 转换到 "${newStatus}"，允许的目标状态: ${allowed?.join(', ') || '无'}`);
        }
        const before = { ...property };
        property.status = newStatus;
        property.updatedAt = new Date();
        this.auditService.log({
            userId,
            userName,
            userRole,
            action: 'status_change',
            entity: 'property',
            entityId: property.id,
            before: { status: before.status },
            after: { status: newStatus },
        });
        return property;
    }
    getStatusHistory(id) {
        this.findOne(id);
        return this.auditService.getByEntity('property', id);
    }
};
exports.PropertyService = PropertyService;
exports.PropertyService = PropertyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], PropertyService);
//# sourceMappingURL=property.service.js.map