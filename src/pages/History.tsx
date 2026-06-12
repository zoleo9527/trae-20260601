import { useState } from 'react';
import { Table, Button, Modal, Card, Row, Col, Select, Input, Tag } from 'antd';
import { SearchOutlined, FilterOutlined, DownloadOutlined, FileTextOutlined, BellOutlined } from '@ant-design/icons';
import type { ActionLog } from '@/types';
import { formatDateTime } from '@/utils/format';

interface HistoryPageProps {
  logs: ActionLog[];
}

export default function HistoryPage({ logs }: HistoryPageProps) {
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterTargetType, setFilterTargetType] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.content.includes(searchText) || 
                         log.operator.includes(searchText) ||
                         log.targetId.includes(searchText);
    const matchesType = !filterType || log.type === filterType;
    const matchesTargetType = !filterTargetType || log.targetType === filterTargetType;
    return matchesSearch && matchesType && matchesTargetType;
  });

  const columns = [
    {
      title: '操作类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={type === '确认成交' ? 'blue' : 
                    type === '审核通过' ? 'green' : 
                    type === '发送催收' ? 'orange' : 
                    type === '确认收款' ? 'green' : 
                    type === '发起争议' ? 'red' : 
                    type === '解决争议' ? 'green' :
                    type === '批量确认' ? 'blue' :
                    type === '批量催收' ? 'orange' :
                    type === '编辑成交确认' ? 'cyan' : 'gray'}>
          {type}
        </Tag>
      ),
    },
    {
      title: '操作对象',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 100,
      render: (type: string) => (
        type === 'confirmation' ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <FileTextOutlined /> 成交确认
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <BellOutlined /> 尾款催收
          </span>
        )
      ),
    },
    {
      title: '对象编号',
      dataIndex: 'targetId',
      key: 'targetId',
      width: 100,
    },
    {
      title: '操作内容',
      dataIndex: 'content',
      key: 'content',
      width: 350,
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => formatDateTime(time),
    },
  ];

  const handleBatchExport = () => {
    Modal.info({
      title: '批量导出',
      content: `已选择 ${selectedRows.length} 条记录，正在生成导出文件...`,
    });
    setSelectedRows([]);
  };

  const actionTypes = [...new Set(logs.map(log => log.type))];

  const stats = {
    total: logs.length,
    confirm: logs.filter(l => l.type === '确认成交' || l.type === '批量确认').length,
    remind: logs.filter(l => l.type === '发送催收' || l.type === '批量催收').length,
    payment: logs.filter(l => l.type === '确认收款').length,
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{stats.total}</div>
            <div style={{ fontSize: 12, color: '#666' }}>操作记录总数</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{stats.payment}</div>
            <div style={{ fontSize: 12, color: '#666' }}>收款完成</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{stats.remind}</div>
            <div style={{ fontSize: 12, color: '#666' }}>催收发送</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{stats.confirm}</div>
            <div style={{ fontSize: 12, color: '#666' }}>成交确认</div>
          </Card>
        </Col>
      </Row>

      <Card 
        title="操作历史记录" 
        extra={
          <div style={{ display: 'flex', gap: 12 }}>
            {selectedRows.length > 0 && (
              <Button icon={<DownloadOutlined />} onClick={handleBatchExport}>
                导出选中 ({selectedRows.length})
              </Button>
            )}
            <Button icon={<DownloadOutlined />}>
              导出全部
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索操作内容、操作人、对象编号"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            placeholder="操作类型"
            prefix={<FilterOutlined />}
            value={filterType}
            onChange={setFilterType}
            style={{ width: 160 }}
          >
            <Select.Option value="">全部</Select.Option>
            {actionTypes.map(type => (
              <Select.Option key={type} value={type}>{type}</Select.Option>
            ))}
          </Select>
          <Select
            placeholder="对象类型"
            value={filterTargetType}
            onChange={setFilterTargetType}
            style={{ width: 160 }}
          >
            <Select.Option value="">全部</Select.Option>
            <Select.Option value="confirmation">成交确认</Select.Option>
            <Select.Option value="collection">尾款催收</Select.Option>
          </Select>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredLogs}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedRows,
            onChange: setSelectedRows,
          }}
        />
      </Card>
    </div>
  );
}