'use client';

import { useState, useEffect } from 'react';
import { Table, Select, Tag, Card, Row, Col, Statistic, Spin } from 'antd';
import FileTextOutlined from '@ant-design/icons/lib/icons/FileTextOutlined';
import UserOutlined from '@ant-design/icons/lib/icons/UserOutlined';
import TeamOutlined from '@ant-design/icons/lib/icons/TeamOutlined';
import AlertOutlined from '@ant-design/icons/lib/icons/AlertOutlined';
import { OperationLog, ERROR_CODES, ROLE_NAMES, ExamBatch } from '../types';
import { apiClient } from '../services/apiClient';

const { Option } = Select;

const roleMap: Record<string, string> = ROLE_NAMES;

const roleColors: Record<string, string> = {
  registrar: 'blue',
  trainer: 'green',
  safety_officer: 'orange',
};

const targetTypeMap: Record<string, string> = {
  batch: '批次',
  notification: '通知',
  exception: '异常',
};

const targetTypeColors: Record<string, string> = {
  batch: 'blue',
  notification: 'green',
  exception: 'red',
};

export default function LogList() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [batches, setBatches] = useState<ExamBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterTarget, setFilterTarget] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [logsData, batchesData] = await Promise.all([
      apiClient.getOperationLogs(),
      apiClient.getExamBatches(),
    ]);
    setLogs(logsData);
    setBatches(batchesData);
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => {
    if (filterRole && log.operatorRole !== filterRole) return false;
    if (filterTarget && log.targetType !== filterTarget) return false;
    return true;
  });

  const stats = {
    total: logs.length,
    byRole: {
      registrar: logs.filter(l => l.operatorRole === 'registrar').length,
      trainer: logs.filter(l => l.operatorRole === 'trainer').length,
      safety_officer: logs.filter(l => l.operatorRole === 'safety_officer').length,
    },
    byType: {
      batch: logs.filter(l => l.targetType === 'batch').length,
      notification: logs.filter(l => l.targetType === 'notification').length,
      exception: logs.filter(l => l.targetType === 'exception').length,
    },
  };

  const columns = [
    { 
      title: '操作类型', 
      dataIndex: 'operationType', 
      key: 'operationType',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    { 
      title: '操作对象', 
      dataIndex: 'targetType', 
      key: 'targetType',
      render: (type: string) => <Tag color={targetTypeColors[type]}>{targetTypeMap[type]}</Tag>,
    },
    { 
      title: '对象ID', 
      dataIndex: 'targetId', 
      key: 'targetId',
      render: (id: string, record: OperationLog) => {
        if (record.targetType === 'batch') {
          const batch = batches.find(b => b.id === id);
          return batch?.batchNumber || id;
        }
        return id;
      },
    },
    { 
      title: '操作人', 
      dataIndex: 'operatorName', 
      key: 'operatorName',
      render: (name: string, record: OperationLog) => (
        <div>
          <div>{name}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            <Tag color={roleColors[record.operatorRole]}>{roleMap[record.operatorRole]}</Tag>
          </div>
        </div>
      ),
    },
    { 
      title: '操作时间', 
      dataIndex: 'timestamp', 
      key: 'timestamp',
    },
    { 
      title: '操作详情', 
      dataIndex: 'details', 
      key: 'details',
    },
  ];

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2>
          <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          操作日志
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Select 
            placeholder="按角色筛选" 
            style={{ width: 150 }}
            value={filterRole}
            onChange={setFilterRole}
          >
            <Option value="">全部角色</Option>
            <Option value="registrar">报名员</Option>
            <Option value="trainer">场地教练</Option>
            <Option value="safety_officer">安全员</Option>
          </Select>
          <Select 
            placeholder="按对象类型筛选" 
            style={{ width: 150 }}
            value={filterTarget}
            onChange={setFilterTarget}
          >
            <Option value="">全部类型</Option>
            <Option value="batch">批次</Option>
            <Option value="notification">通知</Option>
            <Option value="exception">异常</Option>
          </Select>
        </div>
      </div>

      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="总操作数" 
              value={stats.total} 
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="报名员操作" 
              value={stats.byRole.registrar} 
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="场地教练操作" 
              value={stats.byRole.trainer} 
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="安全员操作" 
              value={stats.byRole.safety_officer} 
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Table 
        dataSource={filteredLogs} 
        columns={columns} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
      />

      <div style={{ marginTop: '24px', background: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '12px' }}>错误码参考</h3>
        <Table 
          dataSource={ERROR_CODES} 
          columns={[
            { title: '错误码', dataIndex: 'code', key: 'code' },
            { title: '错误信息', dataIndex: 'message', key: 'message' },
            { title: '详细描述', dataIndex: 'description', key: 'description' },
          ]}
          pagination={false}
          size="small"
        />
      </div>
    </div>
  );
}