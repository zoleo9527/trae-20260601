import { Tag } from 'antd';
import { StorageStatus, TemperatureStatus } from '@/types';

export const StatusTag = ({ status }: { status: StorageStatus }) => {
  const statusMap: Record<StorageStatus, { color: string; text: string }> = {
    pending: { color: 'default', text: '待入库' },
    stored: { color: 'blue', text: '已入库' },
    abnormal: { color: 'red', text: '异常' },
    completed: { color: 'green', text: '已完成' },
  };

  const config = statusMap[status];
  return <Tag color={config.color}>{config.text}</Tag>;
};

export const TempStatusTag = ({ status }: { status: TemperatureStatus }) => {
  const statusMap: Record<TemperatureStatus, { color: string; text: string }> = {
    normal: { color: 'green', text: '正常' },
    warning: { color: 'orange', text: '预警' },
    critical: { color: 'red', text: '严重' },
  };

  const config = statusMap[status];
  return <Tag color={config.color}>{config.text}</Tag>;
};
