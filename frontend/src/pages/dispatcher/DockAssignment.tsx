import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Select,
  Input,
  message,
  Row,
  Col,
  Statistic,
  List,
  Avatar,
} from 'antd';
import { AppstoreOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { appointmentsApi, docksApi } from '../../services/api';
import { useAuth } from '../../store/auth';
import { Appointment, AppointmentStatus, Dock, DockStatus } from '../../types';

const DockAssignment: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pendingList, setPendingList] = useState<Appointment[]>([]);
  const [docks, setDocks] = useState<Dock[]>([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [assignForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, docksRes] = await Promise.all([
        appointmentsApi.getList({ status: AppointmentStatus.APPROVED, pageSize: 100 }),
        docksApi.getAll(),
      ]);
      setPendingList(pendingRes.items);
      setDocks(docksRes);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (values: { dockId: string; remark?: string }) => {
    if (!selectedAppointment) return;
    try {
      await appointmentsApi.assignDock(selectedAppointment.id, {
        dockId: values.dockId,
        assignerId: user?.id,
        remark: values.remark,
      });
      message.success('月台分配成功，叉车班长将收到任务');
      setAssignModalVisible(false);
      assignForm.resetFields();
      setSelectedAppointment(null);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '分配失败');
    }
  };

  const availableDocks = docks.filter((d) => d.status === DockStatus.AVAILABLE);

  const pendingColumns = [
    {
      title: '预约单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '承运商/司机',
      key: 'driver',
      render: (_: any, record: Appointment) => (
        <div>
          <div>{record.carrierName}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{record.driverName} / {record.driverPhone}</div>
        </div>
      ),
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
      title: '货物',
      key: 'cargo',
      render: (_: any, record: Appointment) => (
        <div>
          <div>{record.cargoType}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{record.cargoWeight} 吨</div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
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
          <Button
            type="primary"
            size="small"
            icon={<AppstoreOutlined />}
            onClick={() => {
              setSelectedAppointment(record);
              setAssignModalVisible(true);
            }}
          >
            分配月台
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="待分配月台" value={pendingList.length} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="空闲月台" value={availableDocks.length} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="占用月台" value={docks.filter((d) => d.status === DockStatus.OCCUPIED).length} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card
            title="待分配预约列表"
            extra={
              <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
                刷新
              </Button>
            }
          >
            <Table
              columns={pendingColumns}
              dataSource={pendingList}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="月台状态看板">
            <List
              grid={{ gutter: 8, column: 2 }}
              dataSource={docks}
              renderItem={(dock) => (
                <List.Item>
                  <Card
                  size="small"
                  style={{
                    borderLeft: dock.status === DockStatus.AVAILABLE ? '3px solid #52c41a' :
                              dock.status === DockStatus.OCCUPIED ? '3px solid #ff4d4f' : '3px solid #faad14',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <Avatar size={32} style={{ backgroundColor: dock.status === DockStatus.AVAILABLE ? '#f6ffed' : '#fff1f0' }}>
                      <AppstoreOutlined style={{ color: dock.status === DockStatus.AVAILABLE ? '#52c41a' : '#ff4d4f' }} />
                    </Avatar>
                    <div style={{ fontWeight: 600, marginTop: 8 }}>{dock.code}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{dock.name}</div>
                    <Tag
                      color={dock.status === DockStatus.AVAILABLE ? 'green' : dock.status === DockStatus.OCCUPIED ? 'red' : 'orange'}
                      style={{ marginTop: 4 }}
                    >
                      {dock.status === DockStatus.AVAILABLE ? '空闲' : dock.status === DockStatus.OCCUPIED ? '占用' : '维护'}
                    </Tag>
                  </div>
                </Card>
              </List.Item>
            )}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="分配月台"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        {selectedAppointment && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <div><strong>预约单号：</strong>{selectedAppointment.orderNo}</div>
            <div><strong>司机：</strong>{selectedAppointment.driverName} ({selectedAppointment.plateNumber})</div>
            <div><strong>预计到车：</strong>{dayjs(selectedAppointment.scheduledArrivalTime).format('YYYY-MM-DD HH:mm')}</div>
          </div>
        )}
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleAssign}
        >
          <Form.Item
            name="dockId"
            label="选择月台"
            rules={[{ required: true, message: '请选择月台' }]}
          >
            <Select placeholder="请选择空闲月台">
              {availableDocks.map((dock) => (
                <Select.Option key={dock.id} value={dock.id}>
                  {dock.code} - {dock.name} ({dock.zone})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注（可选）">
            <Input.TextArea rows={2} placeholder="分配说明" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setAssignModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认分配</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DockAssignment;
