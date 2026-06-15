import { Baby, CreateBabyDto } from './baby.model';
import { Reminder } from './reminder.model';

export enum MemberStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export interface Member {
  id: string;
  phone: string;
  name: string;
  status: MemberStatus;
  
  wechatOpenId?: string;
  idCardNumber?: string;
  address?: string;
  
  registeredStoreId: string;
  registeredBy: string;
  registeredByRole: string;
  
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
  
  babies: Baby[];
  reminders: Reminder[];
}

export interface CreateMemberDto {
  phone: string;
  name: string;
  wechatOpenId?: string;
  idCardNumber?: string;
  address?: string;
  
  babies?: CreateBabyDto[];
}

export interface UpdateMemberDto {
  name?: string;
  wechatOpenId?: string;
  idCardNumber?: string;
  address?: string;
}

export interface MemberQueryDto {
  id?: string;
  phone?: string;
  name?: string;
  status?: MemberStatus;
  storeId?: string;
  registeredBy?: string;
  page?: number;
  pageSize?: number;
}