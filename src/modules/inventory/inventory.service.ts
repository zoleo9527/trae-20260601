import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, Like, DataSource, In } from 'typeorm';
import { MedicineInventory } from './entities/medicine-inventory.entity';
import { NearExpiryAlert, AlertLevel, AlertStatus, AlertAction } from './entities/near-expiry-alert.entity';
import { CreateMedicineInventoryDto, UpdateMedicineInventoryDto, MedicineInventoryQueryDto } from './dto/medicine-inventory.dto';
import { NearExpiryAlertQueryDto, AcknowledgeAlertDto, ResolveAlertDto } from './dto/near-expiry-alert.dto';
import { PaginatedResult, createPaginatedResult } from '../../common/dto/pagination.dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/error-codes';
import { AlertStateMachine } from './alert.state-machine';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(MedicineInventory)
    private readonly inventoryRepository: Repository<MedicineInventory>,
    @InjectRepository(NearExpiryAlert)
    private readonly alertRepository: Repository<NearExpiryAlert>,
    private readonly alertStateMachine: AlertStateMachine,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateMedicineInventoryDto): Promise<MedicineInventory> {
    const existing = await this.inventoryRepository.findOne({
      where: { medicineCode: dto.medicineCode, batchNo: dto.batchNo },
    });
    if (existing) {
      throw new BusinessException(ErrorCode.INVENTORY_NOT_FOUND, '该药品批次已存在库存记录');
    }
    const inventory = this.inventoryRepository.create(dto);
    return this.inventoryRepository.save(inventory);
  }

  async findAll(query: MedicineInventoryQueryDto): Promise<PaginatedResult<MedicineInventory>> {
    const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC', medicineName, batchNo, expiryDateStart, expiryDateEnd, storeId } = query;

    const where: any = {};
    if (medicineName) {
      where.medicineName = Like(`%${medicineName}%`);
    }
    if (batchNo) {
      where.batchNo = batchNo;
    }
    if (expiryDateStart && expiryDateEnd) {
      where.expiryDate = Between(expiryDateStart, expiryDateEnd);
    } else if (expiryDateStart) {
      where.expiryDate = MoreThanOrEqual(expiryDateStart);
    } else if (expiryDateEnd) {
      where.expiryDate = LessThanOrEqual(expiryDateEnd);
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

    return createPaginatedResult(items, total, page, pageSize);
  }

  async findOne(id: string): Promise<MedicineInventory> {
    const inventory = await this.inventoryRepository.findOne({ where: { id } });
    if (!inventory) {
      throw new BusinessException(ErrorCode.INVENTORY_NOT_FOUND);
    }
    return inventory;
  }

  async update(id: string, dto: UpdateMedicineInventoryDto): Promise<MedicineInventory> {
    const inventory = await this.findOne(id);
    Object.assign(inventory, dto);
    return this.inventoryRepository.save(inventory);
  }

  async remove(id: string): Promise<void> {
    const result = await this.inventoryRepository.delete(id);
    if (result.affected === 0) {
      throw new BusinessException(ErrorCode.INVENTORY_NOT_FOUND);
    }
  }

  async findNearExpiryMedicines(daysToExpiry: number): Promise<MedicineInventory[]> {
    const today = new Date();
    const expiryThreshold = new Date();
    expiryThreshold.setDate(today.getDate() + daysToExpiry);

    return this.inventoryRepository.find({
      where: {
        expiryDate: LessThanOrEqual(expiryThreshold),
        quantity: MoreThanOrEqual(1),
      },
      order: { expiryDate: 'ASC' },
    });
  }

  calculateDaysToExpiry(expiryDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  calculateAlertLevel(daysToExpiry: number): AlertLevel {
    if (daysToExpiry <= 30) {
      return AlertLevel.HIGH;
    } else if (daysToExpiry <= 60) {
      return AlertLevel.MEDIUM;
    } else {
      return AlertLevel.LOW;
    }
  }

  async generateAlerts(): Promise<{ generated: number; skipped: number }> {
    const today = new Date();
    const expiryThreshold = new Date();
    expiryThreshold.setDate(today.getDate() + 90);

    const inventories = await this.inventoryRepository.find({
      where: {
        expiryDate: LessThanOrEqual(expiryThreshold),
        quantity: MoreThanOrEqual(1),
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
          status: In([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]),
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
        status: AlertStatus.ACTIVE,
        storeId: inventory.storeId,
        storeName: inventory.storeName,
      });

      await this.alertRepository.save(alert);
      generatedCount++;
    }

    return { generated: generatedCount, skipped: skippedCount };
  }

  async findAlerts(query: NearExpiryAlertQueryDto): Promise<PaginatedResult<NearExpiryAlert>> {
    const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC', alertLevel, status, minDaysToExpiry, maxDaysToExpiry, storeId } = query;

    const where: any = {};
    if (alertLevel) {
      where.alertLevel = alertLevel;
    }
    if (status) {
      where.status = status;
    }
    if (minDaysToExpiry !== undefined && maxDaysToExpiry !== undefined) {
      where.daysToExpiry = Between(minDaysToExpiry, maxDaysToExpiry);
    } else if (minDaysToExpiry !== undefined) {
      where.daysToExpiry = MoreThanOrEqual(minDaysToExpiry);
    } else if (maxDaysToExpiry !== undefined) {
      where.daysToExpiry = LessThanOrEqual(maxDaysToExpiry);
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

    return createPaginatedResult(items, total, page, pageSize);
  }

  async findAlertById(id: string): Promise<NearExpiryAlert> {
    const alert = await this.alertRepository.findOne({ where: { id } });
    if (!alert) {
      throw new BusinessException(ErrorCode.ALERT_NOT_FOUND);
    }
    return alert;
  }

  async acknowledgeAlert(id: string, dto: AcknowledgeAlertDto, operatorId?: string): Promise<NearExpiryAlert> {
    const alert = await this.findAlertById(id);

    this.alertStateMachine.validateTransition(alert.status, AlertAction.ACKNOWLEDGE);

    const nextStatus = this.alertStateMachine.getNextState(alert.status, AlertAction.ACKNOWLEDGE);

    alert.status = nextStatus;
    alert.acknowledgedBy = operatorId;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedRemark = dto.remark;

    return this.alertRepository.save(alert);
  }

  async resolveAlert(id: string, dto: ResolveAlertDto, operatorId?: string): Promise<NearExpiryAlert> {
    const alert = await this.findAlertById(id);

    this.alertStateMachine.validateTransition(alert.status, AlertAction.RESOLVE);

    const nextStatus = this.alertStateMachine.getNextState(alert.status, AlertAction.RESOLVE);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const inventory = await queryRunner.manager.findOne(MedicineInventory, {
        where: { id: alert.inventoryId },
      });

      if (!inventory) {
        throw new BusinessException(ErrorCode.INVENTORY_NOT_FOUND);
      }

      if (inventory.quantity < alert.currentQuantity) {
        throw new BusinessException(ErrorCode.INVENTORY_INSUFFICIENT);
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
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findByMedicineAndBatch(
    medicineId: string,
    batchNo: string,
    storeId: string,
  ): Promise<MedicineInventory | null> {
    return this.inventoryRepository.findOne({
      where: {
        medicineCode: medicineId,
        batchNo,
        storeId,
      },
    });
  }

  async decreaseQuantity(
    medicineId: string,
    batchNo: string,
    storeId: string,
    quantity: number,
  ): Promise<void> {
    const inventory = await this.findByMedicineAndBatch(medicineId, batchNo, storeId);
    if (!inventory) {
      throw new BusinessException(ErrorCode.INVENTORY_NOT_FOUND, `库存记录不存在: 药品=${medicineId}, 批号=${batchNo}, 门店=${storeId}`);
    }

    if (inventory.quantity < quantity) {
      throw new BusinessException(
        ErrorCode.INVENTORY_INSUFFICIENT,
        `库存不足: 药品=${inventory.medicineName}, 批号=${batchNo}, 现有库存=${inventory.quantity}, 需要=${quantity}`,
        {
          medicineId,
          medicineName: inventory.medicineName,
          batchNo,
          storeId,
          available: inventory.quantity,
          required: quantity,
        },
      );
    }

    inventory.quantity = Number(inventory.quantity) - quantity;
    await this.inventoryRepository.save(inventory);
  }

  async increaseQuantity(
    medicineId: string,
    batchNo: string,
    storeId: string,
    quantity: number,
    medicineName?: string,
    expiryDate?: string,
    sellingPrice?: number,
    unit?: string,
    storeName?: string,
    specification?: string,
    manufacturer?: string,
    location?: string,
    purchasePrice?: number,
  ): Promise<void> {
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
    } else {
      if (!medicineName || !expiryDate || !sellingPrice) {
        throw new BusinessException(ErrorCode.INVENTORY_NOT_FOUND, `新增库存需要药品名称、有效期和售价信息`);
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
}
