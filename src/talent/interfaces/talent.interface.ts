import { OperationLog } from '../../common/interfaces';

export interface TalentPlatformInfo {
  platform: string;
  accountId: string;
  accountName: string;
  followers: number;
  avgViews?: number;
  category?: string;
}

export interface Talent {
  id: string;
  name: string;
  realName?: string;
  phone: string;
  idCard?: string;
  email?: string;
  platforms: TalentPlatformInfo[];
  tags: string[];
  introduction?: string;
  createdAt: Date;
  updatedAt: Date;
  operationLogs: OperationLog[];
}
