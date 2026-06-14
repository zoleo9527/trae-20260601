'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Tag, message, Select, Badge, Card, Row, Col, Divider, Spin } from 'antd';
import AlertOutlined from '@ant-design/icons/lib/icons/AlertOutlined';
import CheckCircleOutlined from '@ant-design/icons/lib/icons/CheckCircleOutlined';
import EyeOutlined from '@ant-design/icons/lib/icons/EyeOutlined';
import ExclamationCircleOutlined from '@ant-design/icons/lib/icons/ExclamationCircleOutlined';
import { ExceptionRecord, EXCEPTION_TYPE_MAP, ExceptionType, ExamBatch } from '../types';
import { apiClient } from '../services/apiClient';
import { ExamBatchWorkflowSteps } from './WorkflowVisualization';

const { Option } = Select;

export default function ExceptionList() {
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [batches, setBatches] = useState<ExamBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedException, setSelectedException] = useState<ExceptionRecord | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filterType, setFilterType] = useState<ExceptionType | ''>('');
  const [filterResolved, setFilterResolved] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [exceptionsData, batchesData] = await Promise.all([
      apiClient.getExceptions(),
      apiClient.getExamBatches(),
    ]);
    setExceptions(exceptionsData);
    setBatches(batchesData);
    setLoading(false);
  };

  const typeColors: Record<ExceptionType, string> = {
    missing_documents: 'orange',
    timeout: 'red',
    review_failed: 'purple',
  };

  const typeDescriptions: Record<ExceptionType, string> = {
    missing_documents: '学员报名材料不齐全',
    timeout: '超过规定时间未处理',
    review_failed: '资格审核未通过',
  };

  const filteredExceptions = exceptions.filter(e => {
    if (filterType && e.type !== filterType) return false;
    if (filterResolved === 'unresolved' && e.resolved) return false;
    if (filterResolved === 'resolved' && !e.resolved) return false;
    return true;
  });

  const unresolvedCount = exceptions.filter(e => !e.resolved).length;
  const missingDocCount = exceptions.filter(e => e.type === 'missing_documents' && !e.resolved).length;
  const timeoutCount = exceptions.filter(e => e.type === 'timeout' && !e.resolved).length;
  const reviewFailedCount = exceptions.filter(e => e.type === 'review_failed' && !e.resolved).length;

  const columns = [
    { 
      title: '批次', 
      dataIndex: 'batchId', 
      key: 'batchId',
      render: (id: string) => {
        const batch = batches.find(b => b.id === id);
        return batch?.batchNumber || id;
      },
    },
    { title: '学员姓名', dataIndex: 'studentName', key: 'studentName' },
    { 
      title: '异常类型', 
      dataIndex: 'type', 
      key: 'type',
      render: (type: ExceptionType) => (
        <Tag color={typeColors[type]}>
          {EXCEPTION_TYPE_MAP[type]}
        </Tag>
      ),
    },
    { title: '异常描述', dataIndex: 'description', key: 'description' },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
    },
    { 
      title: '状态', 
      dataIndex: 'resolved', 
      key: 'resolved',
      render: (resolved: boolean) => (
        resolved ? (
          <Tag color="green">已处理</Tag>
        ) : (
          <Badge status="error" text="待处理" />
        )
      ),
    },
    { 
      title: '处理人', 
      dataIndex: 'handlerName', 
      key: 'handlerName',
      render: (name: string | undefined, record: ExceptionRecord) => (
        name ? (
          <div>
            <div>{name}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>{record.handledAt}</div>
          </div>
        ) : '-'
      ),
    },
    { 
      title: '操作', 
      key: 'action',
      render: (_: unknown, record: ExceptionRecord) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => viewException(record)}>查看</Button>
          {!record.resolved && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleResolve(record.id)}>处理</Button>
          )}
        </div>
      ),
    },
  ];

  const viewException = (exception: ExceptionRecord) => {
    setSelectedException(exception);
    setIsModalVisible(true);
  };

  const handleResolve = async (id: string) => {
    const result = await apiClient.handleException(id);
    if (result.success) {
      message.success('处理成功，已同步更新批次和通知');
      loadData();
    } else {
      message.error(result.error?.message || '处理失败');
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2>
          <AlertOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />
          异常处理
          <Badge count={unresolvedCount} style={{ marginLeft: '8px' }} />
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Select 
            placeholder="按类型筛选" 
            style={{ width: 150 }}
            value={filterType}
            onChange={(value) => setFilterType(value as ExceptionType)}
          >
            <Option value="">全部类型</Option>
            <Option value="missing_documents">材料缺失</Option>
            <Option value="timeout">超时</Option>
            <Option value="review_failed">复核不通过</Option>
          </Select>
          <Select 
            placeholder="按状态筛选" 
            style={{ width: 150 }}
            value={filterResolved}
            onChange={setFilterResolved}
          >
            <Option value="">全部状态</Option>
            <Option value="unresolved">待处理</Option>
            <Option value="resolved">已处理</Option>
          </Select>
        </div>
      </div>

      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={8}>
          <Card size="small">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14' }}>{missingDocCount}</div>
                <div style={{ color: '#8c8c8c', fontSize: '12px' }}>材料缺失</div>
              </div>
              <Tag color="orange">待处理</Tag>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff4d4f' }}>{timeoutCount}</div>
                <div style={{ color: '#8c8c8c', fontSize: '12px' }}>超时未处理</div>
              </div>
              <Tag color="red">待处理</Tag>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#722ed1' }}>{reviewFailedCount}</div>
                <div style={{ color: '#8c8c8c', fontSize: '12px' }}>复核不通过</div>
              </div>
              <Tag color="purple">待处理</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <Table 
        dataSource={filteredExceptions} 
        columns={columns} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={
          <div>
            <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
            异常详情
          </div>
        }
        visible={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>,
          selectedException && !selectedException.resolved && (
            <Button key="submit" type="primary" icon={<CheckCircleOutlined />} onClick={() => {
              handleResolve(selectedException.id);
              setIsModalVisible(false);
            }}>
              处理异常
            </Button>
          ),
        ]}
      >
        {selectedException && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <strong>批次编号：</strong>
                  <Tag color="blue">{batches.find(b => b.id === selectedException.batchId)?.batchNumber}</Tag>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong>学员姓名：</strong>{selectedException.studentName}
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong>异常类型：</strong>
                  <Tag color={typeColors[selectedException.type]}>
                    {EXCEPTION_TYPE_MAP[selectedException.type]}
                  </Tag>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong>异常描述：</strong>{selectedException.description}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <strong>创建时间：</strong>{selectedException.createdAt}
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong>状态：</strong>
                  {selectedException.resolved ? (
                    <Tag color="green">已处理</Tag>
                  ) : (
                    <Badge status="error" text="待处理" />
                  )}
                </div>
                {selectedException.handlerName && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <strong>处理人：</strong>{selectedException.handlerName}
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <strong>处理时间：</strong>{selectedException.handledAt}
                    </div>
                  </>
                )}
              </Col>
            </Row>

            <Divider />

            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#1890ff', marginBottom: '8px', display: 'block' }}>异常说明：</strong>
              <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                {typeDescriptions[selectedException.type]}
              </div>
            </div>

            <Divider />

            <ExamBatchWorkflowSteps 
              status={batches.find(b => b.id === selectedException.batchId)?.status || 'pending'}
              submitterName={batches.find(b => b.id === selectedException.batchId)?.submitterName}
              submitTime={batches.find(b => b.id === selectedException.batchId)?.submitTime}
              confirmerName={batches.find(b => b.id === selectedException.batchId)?.confirmerName}
              confirmTime={batches.find(b => b.id === selectedException.batchId)?.confirmTime}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}