import { SpecialTagStatus, SpecialTagType } from '../../common/enums';

export interface SpecialMealTag {
  id: string;
  studentId: string;
  studentName: string;
  tagType: SpecialTagType;
  tagContent: string;
  tagLabel: string;
  status: SpecialTagStatus;
  isLongTerm: boolean;
  expireDate?: string;
  createTime: Date;
  updateTime: Date;
  createBy: string;
  createByName: string;
  remark?: string;
}

export interface SpecialTagLog {
  id: string;
  tagId: string;
  studentId: string;
  operation: 'add' | 'remove' | 'update' | 'expire';
  tagType: SpecialTagType;
  tagContent: string;
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  operateTime: Date;
  remark?: string;
  previousContent?: string;
}

export interface CreateTagDto {
  studentId: string;
  tagType: SpecialTagType;
  tagContent: string;
  tagLabel: string;
  isLongTerm?: boolean;
  expireDate?: string;
  remark?: string;
}

export interface RemoveTagDto {
  reason: string;
}

export interface SpecialTagReview {
  currentTags: SpecialMealTag[];
  historyLogs: SpecialTagLog[];
  relatedOrders: Array<{
    id: string;
    date: string;
    mealType: string;
    status: string;
    remark?: string;
  }>;
  riskItems: Array<{
    type: string;
    level: 'high' | 'medium' | 'low';
    message: string;
  }>;
}
