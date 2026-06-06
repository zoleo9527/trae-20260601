import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  message,
} from 'antd';
import { EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { appointmentsApi } from '../../services/api';
import { Appointment, AppointmentStatus, StatusTextMap, StatusColorMap } from '../../types';

const { RangePicker } = DatePicker;

const AppointmentList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [params, setParams] = useState({
    status: undefined as AppointmentStatus | undefined,
    keyword: '',
    page: 1,
    pageSize: 20,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.getList(params);
      setData(res.items);
      setTotal(res.total);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params]);

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
      title: '月台',
      key: 'dock',
      render: (_: any, record: Appointment) => (
        record.dock ? `${record.dock.code} ${record.dock.name}` : '-'
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
      title: '实际到车',
      dataIndex: 'actualArrivalTime',
      key: 'actualArrivalTime',
      width: 160,
      render: (text?: string) => text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: AppointmentStatus) => (
        <Tag color={StatusColorMap[status]}>{StatusTextMap[status]}</Tag>
      ),
    },
    {
      title: '创建人',
      key: 'creator',
      render: (_: any, record: Appointment) => record.creator?.name || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Appointment) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/appointment/${record.id}`)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="预约列表"
        extra={
          <Space>
            <Input
              placeholder="搜索单号/车牌/司机"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              value={params.keyword}
              onChange={(e) => setParams({ ...params, keyword: e.target.value, page: 1 })}
              onPressEnter={fetchData}
            />
            <Select
              placeholder="状态筛选"
              style={{ width: 150 }}
              allowClear
              value={params.status}
              onChange={(value) => setParams({ ...params, status: value, page: 1 })}
            >
              {Object.entries(StatusTextMap).map(([key, value]) => (
                <Select.Option key={key} value={key}>{value}</Select.Option>
              ))}
            </Select>
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
          pagination={{
            current: params.page,
            pageSize: params.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setParams({ ...params, page, pageSize }),
          }}
        />
      </Card>
    </div>
  );
};

export default AppointmentList;
