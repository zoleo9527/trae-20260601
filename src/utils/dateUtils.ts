export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateDaysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function calculateOverdueDays(expectedEndDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(expectedEndDate);
  endDate.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - endDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function formatStuckHours(hours: number): string {
  if (hours < 24) {
    return `${hours}小时`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) {
    return `${days}天`;
  }
  return `${days}天${remainingHours}小时`;
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getTodayDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function parseDate(dateStr: string): Date {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function calculateOverdueInfo(
  contractStatus: string,
  expectedEndDate: string,
  dailyRate: number,
  contractOverdueDays?: number,
  actualEndDate?: string | null
): {
  isOverdue: boolean;
  overdueDays: number;
  daysLeft: number;
  overdueFee: number;
} {
  const today = getTodayDate();
  const endDate = parseDate(expectedEndDate);
  
  const effectiveDate = actualEndDate ? parseDate(actualEndDate) : today;
  
  const diffTime = effectiveDate.getTime() - endDate.getTime();
  const calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isOverdue = calculatedDays > 0;
  const overdueDays = Math.max(0, calculatedDays);
  
  const daysLeft = isOverdue ? -overdueDays : Math.max(0, -calculatedDays);
  const overdueFee = overdueDays * dailyRate * 1.5;
  
  return {
    isOverdue,
    overdueDays,
    daysLeft,
    overdueFee,
  };
}

export type ContractDisplayStatus =
  | 'active'
  | 'overdue'
  | 'returned'
  | 'fuel_verified'
  | 'completed';

export function deriveContractDisplayStatus(
  contractStatus: string,
  expectedEndDate: string,
  actualEndDate?: string | null
): ContractDisplayStatus {
  if (contractStatus === 'completed') {
    return 'completed';
  }
  
  if (contractStatus === 'fuel_verified') {
    return 'fuel_verified';
  }
  
  if (contractStatus === 'returned') {
    return 'returned';
  }
  
  if (actualEndDate) {
    const end = parseDate(actualEndDate);
    const expected = parseDate(expectedEndDate);
    return end > expected ? 'overdue' : 'active';
  }
  
  const today = getTodayDate();
  const expected = parseDate(expectedEndDate);
  if (today > expected) {
    return 'overdue';
  }
  
  return 'active';
}

const CONTRACT_DISPLAY_STATUS_LABELS: Record<ContractDisplayStatus, string> = {
  active: '租期进行中',
  overdue: '已超期',
  returned: '已归还待核验',
  fuel_verified: '油耗核验中',
  completed: '已完成',
};

export function getContractDisplayStatusLabel(status: ContractDisplayStatus): string {
  return CONTRACT_DISPLAY_STATUS_LABELS[status];
}

export interface GetContractDisplayInfoParams {
  contract: {
    id: string;
    reservationId: string;
    contractNo: string;
    status: string;
    actualStartDate: string;
    actualEndDate: string | null;
    overdueDays?: number;
  };
  reservation: {
    id: string;
    reservationNo: string;
    expectedEndDate: string;
    equipmentId: string;
    customerId: string;
  };
  equipment: {
    id: string;
    name: string;
    model: string;
    dailyRate: number;
  };
  customer: {
    id: string;
    name: string;
  };
}

export function getContractDisplayInfo(params: GetContractDisplayInfoParams): {
  displayStatus: ContractDisplayStatus;
  displayStatusLabel: string;
  isOverdue: boolean;
  overdueDays: number;
  daysLeft: number;
  overdueFee: number;
  rentalDays: number;
  baseAmount: number;
  totalAmount: number;
  dailyRate: number;
  expectedEndDate: string;
  actualStartDate: string;
  actualEndDate: string | null;
  equipmentName: string;
  customerName: string;
  contractNo: string;
  reservationNo: string;
} {
  const { contract, reservation, equipment, customer } = params;

  const displayStatus = deriveContractDisplayStatus(
    contract.status,
    reservation.expectedEndDate,
    contract.actualEndDate
  );

  const today = getTodayDate();
  const rentalDays = contract.actualEndDate
    ? calculateDaysBetween(contract.actualStartDate, contract.actualEndDate)
    : Math.max(1, calculateDaysBetween(contract.actualStartDate, today.toISOString().split('T')[0]));

  const overdueInfo = calculateOverdueInfo(
    contract.status,
    reservation.expectedEndDate,
    equipment.dailyRate,
    contract.overdueDays,
    contract.actualEndDate
  );

  const baseAmount = rentalDays * equipment.dailyRate;
  const totalAmount = baseAmount + overdueInfo.overdueFee;

  return {
    displayStatus,
    displayStatusLabel: getContractDisplayStatusLabel(displayStatus),
    isOverdue: overdueInfo.isOverdue,
    overdueDays: overdueInfo.overdueDays,
    daysLeft: overdueInfo.daysLeft,
    overdueFee: overdueInfo.overdueFee,
    rentalDays,
    baseAmount,
    totalAmount,
    dailyRate: equipment.dailyRate,
    expectedEndDate: reservation.expectedEndDate,
    actualStartDate: contract.actualStartDate,
    actualEndDate: contract.actualEndDate,
    equipmentName: `${equipment.name} ${equipment.model}`,
    customerName: customer.name,
    contractNo: contract.contractNo,
    reservationNo: reservation.reservationNo,
  };
}
