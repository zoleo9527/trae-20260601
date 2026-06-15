import { Timeline, Tag } from 'antd';
import dayjs from 'dayjs';
import type { AuditLog } from '@/types';
import {
  actionDisplayMap,
  roleDisplayMap,
  statusDisplayMap,
} from '@/utils/stateMachine';

interface AuditTimelineProps {
  logs: AuditLog[];
}

export default function AuditTimeline({ logs }: AuditTimelineProps) {
  const getIcon = (action: AuditLog['action']) => {
    if (action.includes('complete') || action.includes('confirm')) {
      return 'green';
    }
    if (action.includes('fail') || action.includes('reject') || action.includes('cancel')) {
      return 'red';
    }
    if (action.includes('issue') || action.includes('change')) {
      return 'orange';
    }
    return 'blue';
  };

  return (
    <div className="audit-timeline">
      <Timeline
        items={logs.map((log) => ({
          color: getIcon(log.action),
          children: (
            <div>
              <div style={{ marginBottom: 4 }}>
                <Tag color="blue">{actionDisplayMap[log.action]}</Tag>
                <Tag color="geekblue">{roleDisplayMap[log.operatorRole]}</Tag>
                <span style={{ fontWeight: 'bold' }}>{log.operatorName}</span>
                <span style={{ color: '#999', marginLeft: 8 }}>
                  {dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                </span>
              </div>
              <div style={{ color: '#666' }}>{log.detail}</div>
              {log.oldValues && Boolean((log.oldValues as Record<string, unknown>).status) && (
                <div style={{ fontSize: '12px', color: '#999', marginTop: 4 }}>
                  状态变更:
                  <Tag color={statusDisplayMap[(log.oldValues as Record<string, unknown>).status as string]?.color}>
                    {statusDisplayMap[(log.oldValues as Record<string, unknown>).status as string]?.text}
                  </Tag>
                  →
                  <Tag color={statusDisplayMap[(log.newValues as Record<string, unknown>)?.status as string]?.color}>
                    {statusDisplayMap[(log.newValues as Record<string, unknown>)?.status as string]?.text}
                  </Tag>
                </div>
              )}
              {log.newValues && !log.oldValues && Boolean((log.newValues as Record<string, unknown>).items) && (
                <div style={{ fontSize: '12px', color: '#999', marginTop: 4 }}>
                  领用材料: {((log.newValues as Record<string, unknown>).items as string[]).join(', ')}
                </div>
              )}
              {log.newValues && !log.oldValues && (log.newValues as Record<string, unknown>).totalAmount !== undefined && (
                <div style={{ fontSize: '12px', color: '#999', marginTop: 2 }}>
                  金额: ¥{(log.newValues as Record<string, unknown>).totalAmount as number}
                </div>
              )}
            </div>
          ),
        }))}
      />
    </div>
  );
}
