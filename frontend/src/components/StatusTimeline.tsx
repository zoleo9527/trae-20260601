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
            {log.meta && Object.keys(log.meta).length > 0 && (
              <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                详情：{JSON.stringify(log.meta)}
              </div>
            )}
          </div>
        ),
      }))}
    />
  );
};

export default StatusTimeline;
