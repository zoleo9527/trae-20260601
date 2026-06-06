import React from 'react';
import { Timeline, Tag, Typography } from 'antd';
import { OperationLog, RoleNames, StatusNames } from '../types';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

interface Props {
  logs: OperationLog[];
}

const OperationTimeline: React.FC<Props> = ({ logs }) => {
  const getColor = (role: string) => {
    switch (role) {
      case 'ASSISTANT': return 'blue';
      case 'STAGE_CONTROL': return 'orange';
      case 'AFTER_SALES_LEAD': return 'green';
      default: return 'default';
    }
  };

  return (
    <Timeline
      items={logs.map(log => ({
        color: getColor(log.role),
        children: (
          <div>
            <div style={{ marginBottom: 4 }}>
              <Tag color={getColor(log.role)}>{RoleNames[log.role]}</Tag>
              <Text strong>{log.operator}</Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {dayjs(log.timestamp).format('MM-DD HH:mm:ss')}
              </Text>
            </div>
            <Paragraph style={{ marginBottom: 4 }}>
              <Text strong>{log.action}</Text>
              {log.fromStatus && log.toStatus && (
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  ({StatusNames[log.fromStatus]} → {StatusNames[log.toStatus]})
                </Text>
              )}
            </Paragraph>
            {log.remark && (
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                备注: {log.remark}
              </Paragraph>
            )}
          </div>
        )
      }))}
    />
  );
};

export default OperationTimeline;
