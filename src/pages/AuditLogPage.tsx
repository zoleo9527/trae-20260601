import { Table, Tag, Select, Space, Input } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useApi } from '@/services/api';
import {
  actionDisplayMap,
  roleDisplayMap,
  statusDisplayMap,
} from '@/utils/stateMachine';
import type { ColumnsType } from 'antd/es/table';
import type { AuditLog } from '@/types';

export default function AuditLogPage() {
  const api = useApi();
  const allLogs = api.getAuditLogs();
  const [entityType, setEntityType] = useState<string>();
  const [action, setAction] = useState<string>();
  const [keyword, setKeyword] = useState('');

  const filteredLogs = allLogs.filter((log) => {
    if (entityType && log.entityType !== entityType) return false;
    if (action && log.action !== action) return false;
    if (keyword && !log.detail.includes(keyword) && !log.operatorName.includes(keyword)) {
      return false;
    }
    return true;
  });

  const columns: ColumnsType<AuditLog> = [
    {
      title: '操作时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
      width: 180,
      sorter: (a, b) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf(),
      defaultSortOrder: 'descend',
    },
    {
      title: '操作人',
      key: 'operator',
      render: (_, record) => (
        <div>
          <div>{record.operatorName}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {roleDisplayMap[record.operatorRole]}
          </div>
        </div>
      ),
      width: 120,
    },
    {
      title: '操作类型',
      key: 'entity',
      render: (_, record) => {
        const typeMap: Record<string, string> = {
          draft: '客户稿件',
          schedule: '喷绘排产',
          material: '材料领用',
          installation: '安装记录',
        };
        return (
          <Space direction="vertical" size={0}>
            <Tag color="blue">{typeMap[record.entityType]}</Tag>
            <Tag color="geekblue">{actionDisplayMap[record.action]}</Tag>
          </Space>
        );
      },
      width: 160,
    },
    {
      title: '关联编号',
      key: 'relatedNo',
      render: (_, record) => {
        if (record.entityType === 'schedule') {
          const schedule = api.getScheduleById(record.entityId);
          return schedule?.scheduleNo || '-';
        }
        if (record.entityType === 'draft') {
          const draft = api.getDraftById(record.entityId);
          return draft?.orderNo || '-';
        }
        if (record.entityType === 'material') {
          const pickup = api.getMaterialPickupById(record.entityId);
          return pickup?.pickupNo || '-';
        }
        if (record.entityType === 'installation') {
          const install = api.getInstallationById(record.entityId);
          return install?.scheduleNo || '-';
        }
        return '-';
      },
      width: 140,
    },
    {
      title: '操作详情',
      dataIndex: 'detail',
      key: 'detail',
    },
    {
      title: '状态变更',
      key: 'statusChange',
      render: (_, record) => {
        if (record.oldValues?.status && record.newValues?.status) {
          return (
            <Space>
              <Tag color={statusDisplayMap[record.oldValues.status as string]?.color}>
                {statusDisplayMap[record.oldValues.status as string]?.text}
              </Tag>
              <span>→</span>
              <Tag color={statusDisplayMap[record.newValues.status as string]?.color}>
                {statusDisplayMap[record.newValues.status as string]?.text}
              </Tag>
            </Space>
          );
        }
        return <span style={{ color: '#999' }}>-</span>;
      },
      width: 180,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>审计日志</h2>
        <Space>
          <Input.Search
            placeholder="搜索操作人或详情"
            allowClear
            style={{ width: 200 }}
            onSearch={setKeyword}
          />
          <Select
            placeholder="筛选实体类型"
            style={{ width: 150 }}
            allowClear
            value={entityType}
            onChange={setEntityType}
            options={[
              { value: 'draft', label: '客户稿件' },
              { value: 'schedule', label: '喷绘排产' },
              { value: 'material', label: '材料领用' },
              { value: 'installation', label: '安装记录' },
            ]}
          />
          <Select
            placeholder="筛选操作类型"
            style={{ width: 150 }}
            allowClear
            value={action}
            onChange={setAction}
            options={Object.entries(actionDisplayMap).map(([key, value]) => ({
              value: key,
              label: value,
            }))}
          />
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={filteredLogs}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
}
