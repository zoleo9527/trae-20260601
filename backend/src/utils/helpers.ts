import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => uuidv4();

export const generateBatchNo = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BATCH-${year}${month}${day}-${random}`;
};

export const formatDate = (date: Date = new Date()): string => {
  return date.toISOString();
};

export const parseJsonSafely = <T>(jsonStr: string, defaultValue: T): T => {
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return defaultValue;
  }
};

export const calculateGradeDifference = (original: string, newGrade: string): string => {
  const gradeOrder = ['A', 'B', 'C', 'D', 'E'];
  const originalIndex = gradeOrder.indexOf(original);
  const newIndex = gradeOrder.indexOf(newGrade);
  
  if (originalIndex === -1 || newIndex === -1) {
    return `${original} → ${newGrade}`;
  }
  
  const diff = newIndex - originalIndex;
  if (diff === 0) return '品级不变';
  if (diff > 0) return `降级: ${original} → ${newGrade} (降${diff}级)`;
  return `升级: ${original} → ${newGrade} (升${Math.abs(diff)}级)`;
};

export const getMaterialTypeName = (type: string): string => {
  const names: Record<string, string> = {
    mixed_plastic: '混合塑料',
    PET: 'PET瓶',
    HDPE: '高密度聚乙烯',
    PVC: '聚氯乙烯',
    PP: '聚丙烯',
    paper: '废纸',
    metal: '金属',
    glass: '玻璃',
    other: '其他'
  };
  return names[type] || type;
};

export const getRoleName = (role: string): string => {
  const names: Record<string, string> = {
    weigher: '过磅员',
    sorting_foreman: '分拣班长',
    sales_clerk: '销售内勤',
    reviewer: '复核员'
  };
  return names[role] || role;
};

export const getStatusName = (status: string): string => {
  const names: Record<string, string> = {
    created: '已创建',
    sorting: '分选中',
    sorting_completed: '分选完成',
    grading: '品级判定中',
    grading_completed: '品级判定完成',
    reviewing: '复核中',
    completed: '已完成',
    stocked: '已入库'
  };
  return names[status] || status;
};
