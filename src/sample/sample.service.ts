import { Injectable, NotFoundException } from '@nestjs/common';
import { TimelineBusinessType } from '../common/enums';
import { User } from '../common/interfaces';
import { InMemoryStore } from '../common/services/in-memory-store.service';
import { CreateSampleDto, SampleRecord } from './interfaces/sample.interface';

@Injectable()
export class SampleService {
  constructor(private readonly store: InMemoryStore) {}

  findAll(params?: { date?: string; mealType?: string }): SampleRecord[] {
    let records = this.store.getSampleRecords();
    if (params?.date) {
      records = records.filter(r => r.date === params.date);
    }
    if (params?.mealType) {
      records = records.filter(r => r.mealType === params.mealType);
    }
    return records.sort((a, b) => new Date(b.sampleTime).getTime() - new Date(a.sampleTime).getTime());
  }

  findOne(id: string): SampleRecord {
    const record = this.store.getSampleRecord(id);
    if (!record) {
      throw new NotFoundException('留样记录不存在');
    }
    return record;
  }

  create(dto: CreateSampleDto, operator: User): SampleRecord {
    const expireTime = new Date();
    expireTime.setDate(expireTime.getDate() + 3);

    const record: SampleRecord = {
      id: this.store.generateId(),
      date: dto.date,
      mealType: dto.mealType,
      dishes: dto.dishes,
      specialDishes: dto.specialDishes,
      sampleTime: new Date(),
      operatorId: operator.id,
      operatorName: operator.name,
      expireTime,
      storageLocation: dto.storageLocation,
      remark: dto.remark,
      createTime: new Date(),
    };

    this.store.saveSampleRecord(record);

    this.store.createTimeline(TimelineBusinessType.SAMPLE, record.id, '录入留样记录', operator, {
      date: dto.date,
      mealType: dto.mealType,
      dishCount: dto.dishes.length,
    });

    return record;
  }
}
