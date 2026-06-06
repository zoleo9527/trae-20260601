import { PurchaseStatus, SummaryStatus } from '../../common/enums';

export interface MealSummary {
  id: string;
  date: string;
  totalCount: number;
  normalCount: number;
  specialCount: number;
  classBreakdown: Array<{ classId: string; className: string; count: number; specialCount: number }>;
  status: SummaryStatus;
  confirmTime?: Date;
  confirmBy?: string;
  confirmByName?: string;
  createTime: Date;
  updateTime: Date;
}

export interface PurchaseItem {
  ingredient: string;
  quantity: number;
  unit: string;
  remark?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNo: string;
  date: string;
  summaryId: string;
  items: PurchaseItem[];
  status: PurchaseStatus;
  totalAmount?: number;
  supplier?: string;
  createTime: Date;
  updateTime: Date;
  submitTime?: Date;
  receiveTime?: Date;
  createBy: string;
  createByName: string;
  remark?: string;
}

export interface GeneratePurchaseDto {
  date: string;
  summaryId: string;
}
