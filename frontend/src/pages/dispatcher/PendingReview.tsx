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
  message,
  Popconfirm,
  Statistic,
  Row,
  Col,
} from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { appointmentsApi } from '../../services/api';
import { useAuth } from '../../store/auth';
import { Appointment, AppointmentStatus, StatusTextMap, StatusColorMap } from '../../types';

const { TextArea } = Input;

const PendingReview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<any>({});
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rejectForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        appointmentsApi.getList({ status: AppointmentStatus.PENDING, pageSize: 100 }),
        appointmentsApi.getStats(),
      ]);
      setData(listRes.items);
      setStats(statsRes);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (record: Appointment) => {
    try {
      await appointmentsApi.approve(record.id, {
        approverId: user?.id,
        remark: '审核通过',
      });
      message.success('审核通过，已进入待分配队列');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleReject = async (values: { rejectionReason: string; remark?: string }) => {
    if (!selectedAppointment) return;
    try {
      await appointmentsApi.reject(selectedAppointment.id, {
        approverId: user?.id,
        rejectionReason: values.rejectionReason,
        remark: values.remark,
      });
      message.success('已驳回');
      setRejectModalVisible(false);
      rejectForm.resetFields();
      setSelectedAppointment(null);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
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
      title: '承运商',
      dataIndex: 'carrierName',
      key: 'carrierName',
    },
    {
      title: '司机',
      dataIndex: 'driverName',
      key: 'driverName',
    },
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
    },
    {
      title: '预计到车',
      dataIndex: 'scheduledArrivalTime',
      key: 'scheduledArrivalTime',
      width: 160,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '货物类型',
      dataIndex: 'cargoType',
      key: 'cargoType',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AppointmentStatus) => (
        <Tag color={StatusColorMap[status]}>{StatusTextMap[status]}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
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
          <Popconfirm
            title="确认审核通过？"
            description="通过后将进入待分配月台队列"
            onConfirm={() => handleApprove(record)}
          >
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
            >
              通过
            </Button>
          </Popconfirm>
          <Button
            type="default"
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => {
              setSelectedAppointment(record);
              setRejectModalVisible(true);
            }}
          >
            驳回
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic title="待审核" value={stats.pending || 0} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已审核" value={stats.approved || 0} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已驳回" value={stats.rejected || 0} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已分配月台" value={stats.assigned || 0} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已完成" value={stats.completed || 0} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="总预约" value={stats.total || 0} />
          </Card>
        </Col>
      </Row>

      <Card
        title="待审核预约列表"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            刷新
          </Button>
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
        title="驳回预约"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={handleReject}
        >
          <Form.Item
          name="rejectionReason"
          label="驳回原因"
          rules={[{ required: true, message: '请输入驳回原因' }]}
        >
          <TextArea rows={4} placeholder="请详细说明驳回原因，该原因将被记录并通知创建人" />
        </Form.Item>
        <Form.Item name="remark" label="备注（可选）">
          <TextArea rows={2} placeholder="补充说明" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button onClick={() => setRejectModalVisible(false)}>取消</Button>
            <Button type="primary" htmlType="submit" danger>确认驳回</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
    </div>
  );
};

export default PendingReview;
