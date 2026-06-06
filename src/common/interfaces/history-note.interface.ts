import { UserRole } from './user.interface';

export interface HistoryNote {
  id: string;
  orderId: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  action: string;
  content: string;
  timestamp: Date;
  isException?: boolean;
  exceptionType?: string;
}
