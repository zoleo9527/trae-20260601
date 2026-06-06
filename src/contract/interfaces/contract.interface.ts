import { ContractStatus } from '../../common/enums';
import { OperationLog } from '../../common/interfaces';

export interface ContractTerms {
  contractType: 'exclusive' | 'non-exclusive';
  startDate: Date;
  endDate: Date;
  revenueSplit: {
    talentPercent: number;
    mcnPercent: number;
  };
  cooperationScope: string[];
  monthlyMinContent?: number;
  maxConcurrentBrands?: number;
}

export interface ContractRemark {
  id: string;
  content: string;
  category: 'business' | 'legal' | 'creative' | 'other';
  createdBy: string;
  createdAt: Date;
  isSharedToArchive: boolean;
}

export interface Contract {
  id: string;
  talentId: string;
  talentName: string;
  status: ContractStatus;
  terms: ContractTerms;
  remarks: ContractRemark[];
  currentHandler: string;
  currentHandlerRole: string;
  archiveId?: string;
  submittedAt?: Date;
  signedAt?: Date;
  archivedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
  operationLogs: OperationLog[];
}
