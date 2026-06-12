import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Tag,
  Button,
  Input,
  Select,
  Form,
  Row,
  Col,
  Modal,
  message,
  Space,
  Popconfirm,
  Descriptions,
} from 'antd';
import {
  SearchOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { exceptionsApi, projectsApi } from '@/services/api';
import {
  ExceptionRecord,
  exceptionTypeDisplay,
  exceptionStatusDisplay,
  exceptionSeverityDisplay,
} from '@/types';

const ExceptionList = () => {
  const [form] = Form.useForm();
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentException, setCurrentException] = useState<ExceptionRecord | null>(null);
  const [handleModalVisible, setHandleModalVisible] = useState(false);
  const [handleForm] = Form.useForm();
  const [triggerModalVisible, setTriggerModalVisible] = useState(false);
  const [triggerForm] = Form.useForm();
  const [projects, setProjects] = useState<any[]>([]);

  const fetchExceptions = async (page = 1, pageSize = 10, values?: any) => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        ...values,
      };
      const res = await exceptionsApi.list(params);
      setExceptions(res.items);
      setPagination({ ...pagination, current: page, pageSize, total: res.total });
    } catch (error) {
      message.error('获取异常列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await projectsApi.list({ pageSize: 100 });
      setProjects(res.items);
    } catch (error) {
      console.error('获取项目列表失败', error);
    }
  };

  useEffect(() => {
    fetchExceptions();
    fetchProjects();
  }, []);

  const handleSearch = (values: any) => {
    fetchExceptions(1, pagination.pageSize, values);
  };

  const handleReset = () => {
    form.resetFields();
    fetchExceptions(1, pagination.pageSize);
  };

  const handleViewDetail = async (record: ExceptionRecord) => {
    try {
      const detail = await exceptionsApi.detail(record.id);
      setCurrentException(detail as any);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('获取详情失败');
    }
  };

  const handleHandleException = async () => {
    if (!currentException) return;
    try {
      const values = await handleForm.validateFields();
      await exceptionsApi.handle(currentException.id, { resolution: values.resolution });
      message.success('处理成功');
      setHandleModalVisible(false);
      handleForm.resetFields();
      fetchExceptions(pagination.current, pagination.pageSize, form.getFieldsValue());
    } catch (error) {
      message.error('处理失败');
    }
  };

  const handleRejectException = async (record: ExceptionRecord) => {
    Modal.confirm({
      title: '确认关闭异常',
      content: '关闭后该异常将标记为已关闭，确认继续吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await exceptionsApi.reject(record.id, { rejectReason: '异常已处理，无需跟进' });
          message.success('已关闭异常');
          fetchExceptions(pagination.current, pagination.pageSize, form.getFieldsValue());
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleTriggerSample = async () => {
    try {
      const values = await triggerForm.validateFields();
      await exceptionsApi.triggerSample(values);
      message.success('异常样例已触发');
      setTriggerModalVisible(false);
      triggerForm.resetFields();
      fetchExceptions(pagination.current, pagination.pageSize, form.getFieldsValue());
    } catch (error) {
      message.error('触发失败');
    }
  };

  const getSeverityInfo = (severity: string) => {
    const sd = exceptionSeverityDisplay[severity as keyof typeof exceptionSeverityDisplay];
    return { label: sd?.label || severity, color: sd?.color || 'default' };
  };

  const getStatusInfo = (status: string) => {
    const sd = exceptionStatusDisplay[status as keyof typeof exceptionStatusDisplay];
    return { label: sd?.label || status, color: sd?.color || 'default' };
  };

  const getTypeInfo = (type: string) => {
    const td = exceptionTypeDisplay[type as keyof typeof exceptionTypeDisplay];
    return { label: td?.label || type, color: td?.color || 'default' };
  };

  const columns = [
    {
      title: '异常标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: ExceptionRecord) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            项目：{record.projectName}（{record.projectNo}）
          </div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const info = getTypeInfo(type);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => {
        const info = getSeverityInfo(severity);
        return (
          <Tag color={info.color}>
            <WarningOutlined /> {info.label}
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = getStatusInfo(status);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '触发人',
      dataIndex: 'triggeredBy',
      key: 'triggeredBy',
      width: 100,
      render: (v: string) => (v === 'system' ? '系统' : v || '-'),
    },
    {
      title: '触发时间',
      dataIndex: 'triggeredAt',
      key: 'triggeredAt',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: ExceptionRecord) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'open' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setCurrentException(record);
                  setHandleModalVisible(true);
                }}
              >
                处理
              </Button>
              <Popconfirm
                title="确认关闭此异常？"
                onConfirm={() => handleRejectException(record)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<CloseCircleOutlined />}>
                  关闭
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const typeOptions = Object.entries(exceptionTypeDisplay).map(([value, obj]) => ({
    value,
    label: obj.label,
  }));

  const statusOptions = Object.entries(exceptionStatusDisplay).map(([value, obj]) => ({
    value,
    label: obj.label,
  }));

  const severityOptions = Object.entries(exceptionSeverityDisplay).map(([value, obj]) => ({
    value,
    label: obj.label,
  }));

  const sampleTypes = [
    { value: 'arrangement_timeout', label: '开评标安排审核超时' },
    { value: 'room_conflict', label: '会议室时间冲突' },
    { value: 'document_missing', label: '招标文件缺失' },
    { value: 'expert_absent', label: '专家缺席' },
    { value: 'expert_late', label: '专家迟到' },
    { value: 'signin_incomplete', label: '专家签到未完成' },
    { value: 'financial_issue', label: '财务确认异常' },
    { value: 'other', label: '其他异常' },
  ];

  return (
    <div>
      <Card
        title="异常管理"
        extra={
          <Button
            type="primary"
            danger
            icon={<ThunderboltOutlined />}
            onClick={() => setTriggerModalVisible(true)}
          >
            触发异常样例
          </Button>
        }
      >
        <Form form={form} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={8} md={6}>
              <Form.Item name="keyword" style={{ marginBottom: 0 }}>
                <Input placeholder="异常标题/项目名称" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Form.Item name="type" style={{ marginBottom: 0 }}>
                <Select placeholder="异常类型" allowClear options={typeOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Form.Item name="status" style={{ marginBottom: 0 }}>
                <Select placeholder="异常状态" allowClear options={statusOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Form.Item name="severity" style={{ marginBottom: 0 }}>
                <Select placeholder="严重程度" allowClear options={severityOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row style={{ marginTop: 8 }}>
            <Col xs={24}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={exceptions}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => fetchExceptions(page, pageSize, form.getFieldsValue()),
          }}
        />
      </Card>

      <Modal
        title="异常详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        {currentException && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="异常标题" span={2}>
                {currentException.title}
              </Descriptions.Item>
              <Descriptions.Item label="项目名称">
                {currentException.projectName}
              </Descriptions.Item>
              <Descriptions.Item label="项目编号">
                {currentException.projectNo}
              </Descriptions.Item>
              <Descriptions.Item label="异常类型">
                {(() => {
                  const info = getTypeInfo(currentException.type);
                  return <Tag color={info.color}>{info.label}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="严重程度">
                {(() => {
                  const info = getSeverityInfo(currentException.severity);
                  return <Tag color={info.color}>{info.label}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const info = getStatusInfo(currentException.status);
                  return <Tag color={info.color}>{info.label}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="触发人">
                {currentException.triggeredBy === 'system'
                  ? '系统'
                  : currentException.triggeredBy || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="触发时间">
                {dayjs(currentException.triggeredAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="异常描述" span={2}>
                {currentException.description}
              </Descriptions.Item>
              {currentException.handlerName && (
                <>
                  <Descriptions.Item label="处理人">
                    {currentException.handlerName}
                  </Descriptions.Item>
                  <Descriptions.Item label="处理时间">
                    {currentException.handledAt
                      ? dayjs(currentException.handledAt).format('YYYY-MM-DD HH:mm:ss')
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="处理意见" span={2}>
                    {currentException.resolution}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                {currentException.status === 'open' && (
                  <>
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => {
                        setDetailModalVisible(false);
                        setHandleModalVisible(true);
                      }}
                    >
                      处理异常
                    </Button>
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => {
                        handleRejectException(currentException);
                        setDetailModalVisible(false);
                      }}
                    >
                      关闭异常
                    </Button>
                  </>
                )}
                <Button onClick={() => setDetailModalVisible(false)}>关闭</Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="处理异常"
        open={handleModalVisible}
        onOk={handleHandleException}
        onCancel={() => {
          setHandleModalVisible(false);
          handleForm.resetFields();
        }}
        destroyOnClose
      >
        <Form form={handleForm} layout="vertical">
          <Form.Item
            name="resolution"
            label="处理方案"
            rules={[{ required: true, message: '请输入处理方案和结果' }]}
          >
            <Input.TextArea rows={4} placeholder="请详细描述处理方案和结果" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="触发异常样例"
        open={triggerModalVisible}
        onOk={handleTriggerSample}
        onCancel={() => {
          setTriggerModalVisible(false);
          triggerForm.resetFields();
        }}
        destroyOnClose
      >
        <Form form={triggerForm} layout="vertical">
          <Form.Item
            name="projectId"
            label="选择项目"
            rules={[{ required: true, message: '请选择项目' }]}
          >
            <Select
              placeholder="请选择要触发异常的项目"
              options={projects.map((p) => ({
                value: p.id,
                label: `${p.projectNo} - ${p.name}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="sampleType"
            label="异常类型"
            rules={[{ required: true, message: '请选择异常类型' }]}
          >
            <Select
              placeholder="请选择要触发的异常类型"
              options={sampleTypes.map((s) => ({
                value: s.value,
                label: s.label,
              }))}
            />
          </Form.Item>
          <div style={{ color: '#999', fontSize: 12 }}>
            触发后系统将自动创建异常记录，并发送通知给项目相关的所有角色（项目专员、评审秘书、财务）。
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ExceptionList;
