import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SpecialTagStatus, SpecialTagType, TimelineBusinessType } from '../common/enums';
import { User } from '../common/interfaces';
import { InMemoryStore } from '../common/services/in-memory-store.service';
import { CreateTagDto, RemoveTagDto, SpecialMealTag, SpecialTagLog, SpecialTagReview } from './interfaces/special-meal.interface';

@Injectable()
export class SpecialMealService {
  constructor(private readonly store: InMemoryStore) {}

  getStudentTags(studentId: string): SpecialMealTag[] {
    return this.store
      .getSpecialTags()
      .filter(t => t.studentId === studentId && t.status === SpecialTagStatus.ACTIVE)
      .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
  }

  getTagLogs(studentId: string): SpecialTagLog[] {
    return this.store
      .getSpecialTagLogs()
      .filter(l => l.studentId === studentId)
      .sort((a, b) => new Date(b.operateTime).getTime() - new Date(a.operateTime).getTime());
  }

  findOneTag(id: string): SpecialMealTag {
    const tag = this.store.getSpecialTag(id);
    if (!tag) {
      throw new NotFoundException('特殊餐标签不存在');
    }
    return tag;
  }

  addTag(dto: CreateTagDto, operator: User): SpecialMealTag {
    const student = this.store.getStudent(dto.studentId);
    if (!student) {
      throw new BadRequestException('学生不存在');
    }

    const existingTags = this.getStudentTags(dto.studentId);
    const duplicate = existingTags.find(
      t => t.tagType === dto.tagType && t.tagContent === dto.tagContent
    );
    if (duplicate) {
      throw new BadRequestException('该标签已存在');
    }

    const tag: SpecialMealTag = {
      id: this.store.generateId(),
      studentId: dto.studentId,
      studentName: student.name,
      tagType: dto.tagType,
      tagContent: dto.tagContent,
      tagLabel: dto.tagLabel,
      status: SpecialTagStatus.ACTIVE,
      isLongTerm: dto.isLongTerm ?? true,
      expireDate: dto.expireDate,
      createTime: new Date(),
      updateTime: new Date(),
      createBy: operator.id,
      createByName: operator.name,
      remark: dto.remark,
    };

    this.store.saveSpecialTag(tag);

    const log: SpecialTagLog = {
      id: this.store.generateId(),
      tagId: tag.id,
      studentId: tag.studentId,
      operation: 'add',
      tagType: tag.tagType,
      tagContent: tag.tagContent,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      operateTime: new Date(),
      remark: dto.remark,
    };
    this.store.saveSpecialTagLog(log);

    this.store.createTimeline(TimelineBusinessType.SPECIAL_TAG, tag.id, '新增特殊餐标签', operator, {
      tagType: tag.tagType,
      tagContent: tag.tagContent,
      studentId: student.id,
      studentName: student.name,
    });

    return tag;
  }

  removeTag(id: string, dto: RemoveTagDto, operator: User): SpecialMealTag {
    const tag = this.findOneTag(id);
    if (tag.status !== SpecialTagStatus.ACTIVE) {
      throw new BadRequestException('只有生效中的标签可以移除');
    }

    tag.status = SpecialTagStatus.REMOVED;
    tag.updateTime = new Date();
    this.store.saveSpecialTag(tag);

    const log: SpecialTagLog = {
      id: this.store.generateId(),
      tagId: tag.id,
      studentId: tag.studentId,
      operation: 'remove',
      tagType: tag.tagType,
      tagContent: tag.tagContent,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      operateTime: new Date(),
      remark: dto.reason,
    };
    this.store.saveSpecialTagLog(log);

    this.store.createTimeline(TimelineBusinessType.SPECIAL_TAG, tag.id, '移除特殊餐标签', operator, {
      tagType: tag.tagType,
      tagContent: tag.tagContent,
      studentId: tag.studentId,
      studentName: tag.studentName,
      reason: dto.reason,
    });

    return tag;
  }

  getReview(studentId: string): SpecialTagReview {
    const student = this.store.getStudent(studentId);
    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    const currentTags = this.getStudentTags(studentId);
    const historyLogs = this.getTagLogs(studentId);
    const relatedOrders = this.store
      .getMealOrders()
      .filter(o => o.studentId === studentId)
      .slice(0, 30)
      .map(o => ({
        id: o.id,
        date: o.date,
        mealType: o.mealType,
        status: o.status,
        remark: o.remark,
      }));

    const riskItems = this.detectRisks(studentId, currentTags);

    return {
      currentTags,
      historyLogs,
      relatedOrders,
      riskItems,
    };
  }

  private detectRisks(studentId: string, tags: SpecialMealTag[]) {
    const risks = [];

    const allergyTags = tags.filter(t => t.tagType === SpecialTagType.ALLERGY);
    if (allergyTags.length >= 3) {
      risks.push({
        type: 'multiple_allergies',
        level: 'high' as const,
        message: `该学生有${allergyTags.length}项过敏原，配餐需特别注意`,
      });
    }

    const specialDays = this.store
      .getMealOrders()
      .filter(o => o.studentId === studentId && o.mealType === 'special')
      .length;
    if (specialDays >= 7) {
      risks.push({
        type: 'long_term_special',
        level: 'medium' as const,
        message: `该学生已连续${specialDays}天特殊餐，建议复核必要性`,
      });
    }

    const tagContents = tags.map(t => t.tagContent);
    if (tagContents.includes('高嘌呤') && tagContents.includes('排骨汤')) {
      risks.push({
        type: 'tag_conflict',
        level: 'high' as const,
        message: '标签冲突：同时标记"高嘌呤"和"排骨汤"，请确认',
      });
    }

    return risks;
  }

  getAllSpecialStudents() {
    const tagMap = new Map<string, SpecialMealTag[]>();
    for (const tag of this.store.getSpecialTags()) {
      if (tag.status !== SpecialTagStatus.ACTIVE) continue;
      if (!tagMap.has(tag.studentId)) {
        tagMap.set(tag.studentId, []);
      }
      tagMap.get(tag.studentId)!.push(tag);
    }

    return Array.from(tagMap.entries()).map(([studentId, tags]) => {
      const student = this.store.getStudent(studentId);
      return {
        studentId,
        studentName: student?.name,
        classId: student?.classId,
        className: student?.className,
        tagCount: tags.length,
        tags: tags.map(t => ({ type: t.tagType, content: t.tagContent, label: t.tagLabel })),
      };
    });
  }
}
