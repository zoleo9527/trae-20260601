import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Popconfirm,
  Statistic,
  Row,
  Col,
  Badge,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { appointmentsApi } from '../../services/api';
import { useAuth } from '../../store/auth';
import { Appointment, AppointmentStatus, StatusTextMap } from '../../types';

const TaskList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Appointment[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.getList({
        pageSize: 100,
      });
      const filtered = res.items.filter((item) =>
        [AppointmentStatus.ASSIGNED, AppointmentStatus.CHECKED_IN, AppointmentStatus.LOADING].includes(item.status)
      );
      setData(filtered);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartLoading = async (record: Appointment) => {
    try {
      await appointmentsApi.startLoading(record.id, {
        operatorId: user?.id,
      });
      message.success('已开始作业');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleComplete = async (record: Appointment) => {
    try {
      await appointmentsApi.complete(record.id, {
        operatorId: user?.id,
      });
      message.success('作业已完成');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      fixed: 'left' as const,
      render: (status: AppointmentStatus) => {
        const dotMap: Record<AppointmentStatus, string> = {
          [AppointmentStatus.ASSIGNED]: 'blue',
          [AppointmentStatus.CHECKED_IN]: 'cyan',
          [AppointmentStatus.LOADING]: 'magenta',
          [AppointmentStatus.COMPLETED]: 'green',
          [AppointmentStatus.PENDING]: 'orange',
          [AppointmentStatus.APPROVED]: 'geekblue',
          [AppointmentStatus.REJECTED]: 'red',
          [AppointmentStatus.SUPPLEMENTED]: 'gold',
          [AppointmentStatus.CANCELLED]: 'default',
        };
        return (
          <Badge status={dotMap[status] as any} text={StatusTextMap[status]} />
        );
      },
    },
    {
      title: '月台',
      key: 'dock',
      width: 100,
      render: (_: any, record: Appointment) => (
        record.dock ? (
          <Tag color="purple" style={{ fontSize: 14, padding: '4px 12px' }}>
            {record.dock.code}
          </Tag>
        ) : '-'
      ),
    },
    {
      title: '预约单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      render: (text: string) => <Tag>{text}</Tag>,
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
      title: '预计到车',
      dataIndex: 'scheduledArrivalTime',
      key: 'scheduledArrivalTime',
      width: 160,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '分配时间',
      dataIndex: 'dockAssignedAt',
      key: 'dockAssignedAt',
      width: 160,
      render: (text?: string) => text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right' as const,
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
          {record.status === AppointmentStatus.CHECKED_IN && (
            <Popconfirm
              title="确认开始装卸作业？"
              onConfirm={() => handleStartLoading(record)}
            >
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
              >
                开始作业
              </Button>
            </Popconfirm>
          )}
          {[AppointmentStatus.CHECKED_IN, AppointmentStatus.LOADING].includes(record.status) && (
            <Popconfirm
              title="确认作业完成？"
              description="完成后将释放月台"
              onConfirm={() => handleComplete(record)}
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
              >
                完成
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const assignedCount = data.filter((d) => d.status === AppointmentStatus.ASSIGNED).length;
  const checkedInCount = data.filter((d) => d.status === AppointmentStatus.CHECKED_IN).length;
  const loadingCount = data.filter((d) => d.status === AppointmentStatus.LOADING).length;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="待签到车辆" value={assignedCount} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已签到待作业" value={checkedInCount} valueStyle={{ color: '#13c2c2' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="作业中" value={loadingCount} valueStyle={{ color: '#eb2f96' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日任务总数" value={data.length} />
          </Card>
        </Col>
      </Row>

      <Card
        title="我的任务列表"
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
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default TaskList;
