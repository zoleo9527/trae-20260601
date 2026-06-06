import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  CarOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { appointmentsApi } from '../../services/api';
import { useAuth } from '../../store/auth';
import { Appointment, AppointmentStatus, StatusTextMap, StatusColorMap } from '../../types';

const { TextArea } = Input;

const ClerkAppointments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Appointment[]>([]);
  const [supplementModalVisible, setSupplementModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [supplementForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.getList({ pageSize: 100 });
      setData(res.items);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckIn = async (record: Appointment) => {
    try {
      await appointmentsApi.checkIn(record.id, {
        operatorId: user?.id,
      });
      message.success('车辆签到成功');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '签到失败');
    }
  };

  const handleSupplement = async (values: any) => {
    if (!selectedAppointment) return;
    try {
      await appointmentsApi.supplement(selectedAppointment.id, {
        ...values,
        operatorId: user?.id,
      });
      message.success('补录成功，已重新提交审核');
      setSupplementModalVisible(false);
      supplementForm.resetFields();
      setSelectedAppointment(null);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '补录失败');
    }
  };

  const columns = [
    {
      title: '预约单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '司机/车牌',
      key: 'driver',
      render: (_: any, record: Appointment) => (
        <div>
          <div>{record.driverName}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{record.plateNumber}</div>
        </div>
      ),
    },
    {
      title: '承运商',
      dataIndex: 'carrierName',
      key: 'carrierName',
    },
    {
      title: '月台',
      key: 'dock',
      render: (_: any, record: Appointment) => (
        record.dock ? (
          <Tag color="purple">{record.dock.code} {record.dock.name}</Tag>
        ) : '-'
      ),
    },
    {
      title: '预计到车',
      dataIndex: 'scheduledArrivalTime',
      key: 'scheduledArrivalTime',
      width: 160,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: AppointmentStatus, record: Appointment) => (
        <div>
          <Tag color={StatusColorMap[status]}>{StatusTextMap[status]}</Tag>
          {status === AppointmentStatus.REJECTED && record.rejectionReason && (
            <Tooltip title={`驳回原因：${record.rejectionReason}`}>
              <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (_: any, record: Appointment) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/appointment/${record.id}`)}
          >
            详情
          </Button>
          {record.status === AppointmentStatus.REJECTED && (
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedAppointment(record);
                supplementForm.setFieldsValue({
                  carrierName: record.carrierName,
                  driverName: record.driverName,
                  driverPhone: record.driverPhone,
                  plateNumber: record.plateNumber,
                  cargoType: record.cargoType,
                  cargoWeight: record.cargoWeight,
                });
                setSupplementModalVisible(true);
              }}
            >
              补录
            </Button>
          )}
          {record.status === AppointmentStatus.ASSIGNED && (
            <Popconfirm
              title="确认车辆到场签到？"
              description="签到后将进入作业队列"
              onConfirm={() => handleCheckIn(record)}
            >
              <Button
                type="primary"
                size="small"
                icon={<CarOutlined />}
              >
                到车签到
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="预约管理"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/clerk/create')}
            >
              新建预约
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="补录预约信息"
        open={supplementModalVisible}
        onCancel={() => setSupplementModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        {selectedAppointment && selectedAppointment.rejectionReason && (
          <div
            style={{
              padding: 12,
              background: '#fff1f0',
              border: '1px solid #ffa39e',
              borderRadius: 4,
              marginBottom: 16,
            }}
          >
            <div style={{ color: '#ff4d4f', fontWeight: 500 }}>
              驳回原因：{selectedAppointment.rejectionReason}
            </div>
            <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
              请根据驳回原因修改信息后重新提交
            </div>
          </div>
        )}
        <Form
          form={supplementForm}
          layout="vertical"
          onFinish={handleSupplement}
        >
          <Form.Item
            name="carrierName"
            label="承运商名称"
            rules={[{ required: true, message: '请输入承运商名称' }]}
          >
            <Input placeholder="请输入承运商名称" />
          </Form.Item>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              name="driverName"
              label="司机姓名"
              rules={[{ required: true, message: '请输入司机姓名' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入司机姓名" />
            </Form.Item>

            <Form.Item
              name="driverPhone"
              label="司机电话"
              rules={[{ required: true, message: '请输入司机电话' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入司机电话" />
            </Form.Item>
          </Space>

          <Form.Item
            name="plateNumber"
            label="车牌号"
            rules={[{ required: true, message: '请输入车牌号' }]}
          >
            <Input placeholder="请输入车牌号" />
          </Form.Item>

          <Space size="large" style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              name="cargoType"
              label="货物类型"
              rules={[{ required: true, message: '请输入货物类型' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入货物类型" />
            </Form.Item>

            <Form.Item
              name="cargoWeight"
              label="货物重量（吨）"
              style={{ flex: 1 }}
            >
              <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item
            name="supplementNote"
            label="补录说明"
          >
            <TextArea rows={3} placeholder="请说明补录或修改的内容（选填）" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setSupplementModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交补录</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClerkAppointments;
