import { Tag } from 'antd';
import {
  InventoryDifferenceStatus,
  LossAnalysisStatus,
  AlertStatus,
  AlertType,
  DifferenceType,
  LossType,
  Alert,
} from '@/types';

export const DifferenceStatusTag: React.FC<{ status: InventoryDifferenceStatus }> = ({ status }) => {
  const statusMap: Record<InventoryDifferenceStatus, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待处理' },
    confirmed: { color: 'blue', text: '已确认' },
    resolved: { color: 'green', text: '已解决' },
    appealed: { color: 'purple', text: '申诉中' },
    closed: { color: 'default', text: '已关闭' },
  };

  const config = statusMap[status];
  return <Tag color={config.color}>{config.text}</Tag>;
};

export const LossStatusTag: React.FC<{ status: LossAnalysisStatus }> = ({ status }) => {
  const statusMap: Record<LossAnalysisStatus, { color: string; text: string }> = {
    recorded: { color: 'orange', text: '已登记' },
    analyzing: { color: 'blue', text: '分析中' },
    concluded: { color: 'green', text: '已结案' },
    archived: { color: 'default', text: '已归档' },
  };

  const config = statusMap[status];
  return <Tag color={config.color}>{config.text}</Tag>;
};

export const AlertStatusTag: React.FC<{ status: AlertStatus }> = ({ status }) => {
  const statusMap: Record<AlertStatus, { color: string; text: string }> = {
    active: { color: 'red', text: '待处理' },
    processing: { color: 'orange', text: '处理中' },
    resolved: { color: 'green', text: '已解决' },
    ignored: { color: 'default', text: '已忽略' },
  };

  const config = statusMap[status];
  return <Tag color={config.color}>{config.text}</Tag>;
};

export const AlertSeverityTag: React.FC<{ severity: Alert['severity'] }> = ({ severity }) => {
  const severityMap: Record<Alert['severity'], { color: string; text: string }> = {
    low: { color: 'green', text: '低' },
    medium: { color: 'blue', text: '中' },
    high: { color: 'orange', text: '高' },
    critical: { color: 'red', text: '紧急' },
  };

  const config = severityMap[severity];
  return <Tag color={config.color}>{config.text}</Tag>;
};

export const AlertTypeTag: React.FC<{ type: AlertType }> = ({ type }) => {
  const typeMap: Record<AlertType, { color: string; text: string }> = {
    expiry_near: { color: 'orange', text: '临期预警' },
    price_tag_error: { color: 'red', text: '价签错误' },
    out_of_stock: { color: 'purple', text: '缺货预警' },
    restock_slow: { color: 'blue', text: '补货延迟' },
  };

  const config = typeMap[type];
  return <Tag color={config.color}>{config.text}</Tag>;
};

export const DifferenceTypeTag: React.FC<{ type: DifferenceType }> = ({ type }) => {
  const typeMap: Record<DifferenceType, { color: string; text: string }> = {
    overage: { color: 'green', text: '溢余' },
    shortage: { color: 'red', text: '短缺' },
    price_mismatch: { color: 'orange', text: '价签错误' },
  };

  const config = typeMap[type];
  return <Tag color={config.color}>{config.text}</Tag>;
};

export const LossTypeTag: React.FC<{ type: LossType }> = ({ type }) => {
  const typeMap: Record<LossType, { color: string; text: string }> = {
    expired: { color: 'orange', text: '过期' },
    damaged: { color: 'blue', text: '破损' },
    stolen: { color: 'red', text: '偷盗' },
    other: { color: 'default', text: '其他' },
  };

  const config = typeMap[type];
  return <Tag color={config.color}>{config.text}</Tag>;
};
