import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../common/interfaces';
import { InMemoryStore } from '../common/services/in-memory-store.service';
import { Talent, TalentPlatformInfo } from './interfaces/talent.interface';

@Injectable()
export class TalentService {
  constructor(private readonly store: InMemoryStore) {}

  findAll(): Talent[] {
    return this.store.getTalents();
  }

  findOne(id: string): Talent {
    const talent = this.store.getTalent(id);
    if (!talent) {
      throw new NotFoundException('达人不存在');
    }
    return talent;
  }

  create(data: {
    name: string;
    realName?: string;
    phone: string;
    idCard?: string;
    email?: string;
    platforms?: TalentPlatformInfo[];
    tags?: string[];
    introduction?: string;
  }, operator: User): Talent {
    if (!data.name || !data.phone) {
      throw new BadRequestException('姓名和手机号不能为空');
    }

    const talent: Talent = {
      id: this.store.generateId(),
      name: data.name,
      realName: data.realName,
      phone: data.phone,
      idCard: data.idCard,
      email: data.email,
      platforms: data.platforms || [],
      tags: data.tags || [],
      introduction: data.introduction,
      createdAt: new Date(),
      updatedAt: new Date(),
      operationLogs: [this.store.createOperationLog(operator, '创建达人档案', '创建达人档案')],
    };

    this.store.saveTalent(talent);
    return talent;
  }

  update(id: string, data: Partial<Talent>, operator: User): Talent {
    const talent = this.findOne(id);
    const previousState = { ...talent };

    Object.assign(talent, data, { updatedAt: new Date() });
    
    talent.operationLogs.push(
      this.store.createOperationLog(operator, '更新达人档案', '更新达人档案信息', previousState, { ...talent })
    );

    this.store.saveTalent(talent);
    return talent;
  }

  addPlatform(id: string, platform: TalentPlatformInfo, operator: User): Talent {
    const talent = this.findOne(id);
    
    talent.platforms.push(platform);
    talent.updatedAt = new Date();
    talent.operationLogs.push(
      this.store.createOperationLog(operator, '添加平台账号', '添加平台账号')
    );

    this.store.saveTalent(talent);
    return talent;
  }

  getOperationLogs(id: string) {
    const talent = this.findOne(id);
    return talent.operationLogs;
  }
}
