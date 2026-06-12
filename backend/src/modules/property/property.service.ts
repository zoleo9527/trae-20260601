import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '../audit/audit.service';

export interface Property {
  id: string;
  building: string;
  floor: number;
  unit: string;
  area: number;
  status: string;
  rentPrice: number;
  deposit: number;
  currentTenant?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePropertyData {
  building: string;
  floor: number;
  unit: string;
  area: number;
  rentPrice: number;
  deposit: number;
  currentTenant?: string;
  description?: string;
}

export interface PropertyFilters {
  status?: string;
  building?: string;
  floor?: number;
}

const STATE_MACHINE: Record<string, string[]> = {
  available: ['viewing'],
  viewing: ['available', 'leased'],
  leased: ['handover_pending'],
  handover_pending: ['leased', 'handover_accepted'],
  handover_accepted: ['occupied'],
  occupied: ['returning'],
  returning: ['available'],
};

@Injectable()
export class PropertyService {
  private readonly properties: Property[] = [];

  constructor(private readonly auditService: AuditService) {}

  findAll(filters?: PropertyFilters): Property[] {
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

  findOne(id: string): Property {
    const property = this.properties.find((p) => p.id === id);
    if (!property) {
      throw new NotFoundException(`房源 #${id} 未找到`);
    }
    return property;
  }

  create(data: CreatePropertyData, userId: string, userName: string, userRole: string): Property {
    const property: Property = {
      id: uuidv4(),
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

  updateStatus(id: string, newStatus: string, userId: string, userName: string, userRole: string): Property {
    const property = this.findOne(id);
    const currentStatus = property.status;
    const allowed = STATE_MACHINE[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `不允许从 "${currentStatus}" 转换到 "${newStatus}"，允许的目标状态: ${allowed?.join(', ') || '无'}`,
      );
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

  getStatusHistory(id: string) {
    this.findOne(id);
    return this.auditService.getByEntity('property', id);
  }
}
