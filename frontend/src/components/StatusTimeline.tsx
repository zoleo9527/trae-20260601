import React from 'react';
import { Timeline, Tag } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  TruckOutlined,
  PlayCircleOutlined,
  EditOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { StatusLog, LogAction, ActionTextMap, StatusTextMap } from '../types';

interface StatusTimelineProps {
  logs: StatusLog[];
}

const fieldNameMap: Record<string, string> = {
  carrierName: '承运商',
  driverName: '司机姓名',
  driverPhone: '司机电话',
  plateNumber: '车牌号',
  scheduledArrivalTime: '预计到车时间',
  cargoType: '货物类型',
  cargoWeight: '货物重量',
  warehouseZone: '仓库区域',
  dockId: '月台ID',
  oldDockId: '原月台ID',
  newDockId: '新月台ID',
  oldDockCode: '原月台',
  newDockCode: '新月台',
  dockCode: '月台编号',
  dockName: '月台名称',
  rejectionReason: '驳回原因',
  supplementNote: '补录说明',
};

const formatValue = (key: string, value: any): string => {
  if (value === null || value === undefined || value === '') return '空';
  if (key.includes('Time') && typeof value === 'string') {
    return dayjs(value).format('YYYY-MM-DD HH:mm');
  }
  if (typeof value === 'number') {
    if (key === 'cargoWeight') return `${value} 吨`;
    return String(value);
  }
  return String(value);
};

const renderChanges = (changes: Record<string, any>) => {
  const changeEntries = Object.entries(changes);
  if (changeEntries.length === 0) return null;

  return (
    <div style={{ marginTop: 8, padding: 12, background: '#e6fffb', border: '1px solid #87e8de', borderRadius: 4 }}>
      <div style={{ fontWeight: 500, marginBottom: 8, color: '#08979c' }}>字段变更：</div>
      <div style={{ fontSize: 13 }}>
        {changeEntries.map(([key, change]) => {
          const fieldName = fieldNameMap[key] || key;
          if (change && typeof change === 'object' && 'from' in change && 'to' in change) {
            return (
              <div key={key} style={{ marginBottom: 4, display: 'flex', alignItems: 'flex-start' }}>
                <span style={{ color: '#666', minWidth: 100, display: 'inline-block' }}>{fieldName}：</span>
                <span style={{ color: '#ff4d4f', textDecoration: 'line-through' }}>
                  {formatValue(key, change.from)}
                </span>
                <span style={{ margin: '0 6px' }}>→</span>
                <span style={{ color: '#52c41a', fontWeight: 500 }}>
                  {formatValue(key, change.to)}
                </span>
              </div>
            );
          }
          return (
            <div key={key} style={{ marginBottom: 4 }}>
              <span style={{ color: '#666', minWidth: 100, display: 'inline-block' }}>{fieldName}：</span>
              <span>{formatValue(key, change)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getActionIcon = (action: LogAction) => {
  switch (action) {
    case LogAction.CREATE:
      return <EditOutlined style={{ color: '#1890ff' }} />;
    case LogAction.APPROVE:
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case LogAction.REJECT:
      return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    case LogAction.SUPPLEMENT:
      return <EditOutlined style={{ color: '#13c2c2' }} />;
    case LogAction.ASSIGN_DOCK:
    case LogAction.REASSIGN_DOCK:
      return <AppstoreOutlined style={{ color: '#722ed1' }} />;
    case LogAction.CHECK_IN:
      return <TruckOutlined style={{ color: '#2f54eb' }} />;
    case LogAction.START_LOADING:
      return <PlayCircleOutlined style={{ color: '#eb2f96' }} />;
    case LogAction.COMPLETE:
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    default:
      return <ClockCircleOutlined />;
  }
};

const StatusTimeline: React.FC<StatusTimelineProps> = ({ logs }) => {
  return (
    <Timeline
      items={logs.map((log) => ({
        dot: getActionIcon(log.action),
        children: (
          <div>
            <div style={{ marginBottom: 4 }}>
              <strong>{ActionTextMap[log.action]}</strong>
              <span style={{ color: '#888', marginLeft: 8 }}>
                {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </span>
            </div>
            <div style={{ marginBottom: 4 }}>
              操作人：<Tag color="blue">{log.operatorName}</Tag>
            </div>
            {log.fromStatus && log.toStatus && log.fromStatus !== log.toStatus && (
              <div style={{ marginBottom: 4 }}>
                状态：
                <Tag>{StatusTextMap[log.fromStatus]}</Tag>
                <span style={{ margin: '0 8px' }}>→</span>
                <Tag color="green">{StatusTextMap[log.toStatus]}</Tag>
              </div>
            )}
            {log.remark && (
              <div style={{ color: '#666', background: '#f5f5f5', padding: '8px 12px', borderRadius: 4 }}>
                {log.remark}
              </div>
            )}
            {log.meta && log.meta.changes && renderChanges(log.meta.changes)}
            {log.meta && !log.meta.changes && Object.keys(log.meta).length > 0 && (
              <div style={{ marginTop: 8, padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4, fontSize: 13 }}>
                {Object.entries(log.meta).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: 4 }}>
                    <span style={{ color: '#666', minWidth: 100, display: 'inline-block' }}>
                      {fieldNameMap[key] || key}：
                    </span>
                    <span>{formatValue(key, value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ),
      }))}
    />
  );
};

export default StatusTimeline;
