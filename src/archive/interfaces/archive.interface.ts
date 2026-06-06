import { ArchiveStatus } from '../../common/enums';
import { OperationLog } from '../../common/interfaces';

export interface ArchiveItem {
  id: string;
  type: 'contract' | 'id_card' | 'bank_info' | 'platform_auth' | 'other';
  name: string;
  fileUrl?: string;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  remark?: string;
}

export interface BrandCooperation {
  id: string;
  brandName: string;
  productType: string;
  startTime: Date;
  endTime: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  scriptVersionId?: string;
  settlementStatus: 'unsettled' | 'partially_settled' | 'settled';
  remark?: string;
}

export interface ScriptVersion {
  id: string;
  version: string;
  brandCooperationId: string;
  title: string;
  content?: string;
  changeReason: string;
  status: string;
  createdBy: string;
  createdAt: Date;
  isLatest: boolean;
}

export interface TalentArchive {
  id: string;
  talentId: string;
  talentName: string;
  status: ArchiveStatus;
  contractId?: string;
  items: ArchiveItem[];
  brandCooperations: BrandCooperation[];
  scriptVersions: ScriptVersion[];
  sharedRemarks: Array<{
    contractRemarkId: string;
    content: string;
    category: string;
    sharedAt: Date;
  }>;
  lastModifiedBy: string;
  lastModifiedAt: Date;
  operationLogs: OperationLog[];
}
