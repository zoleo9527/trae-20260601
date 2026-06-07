import { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Select,
  DatePicker,
  Space,
  Row,
  Col,
  Statistic,
  Tag,
  Button,
  List,
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useStore } from '@/store';
import { TempStatusTag } from '@/components/common/StatusTags';
import { TemperatureRecord } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface TempRecordWithItem extends TemperatureRecord {
  productName: string;
  storageRoom: string;
  shelfNo: string;
  targetTemperature: number;
}

const TemperatureReview = () => {
  const navigate = useNavigate();
  const items = useStore((state) => state.items);

  const [storageRoomFilter, setStorageRoomFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<any>(null);

  const allTempRecords = useMemo<TempRecordWithItem[]>(() => {
    const records: TempRecordWithItem[] = [];
    items.forEach((item) => {
      item.temperatureRecords.forEach((record) => {
        records.push({
          ...record,
          productName: item.productName,
          storageRoom: item.storageRoom,
          shelfNo: item.shelfNo,
          targetTemperature: item.targetTemperature,
        });
      });
    });
    return records.sort(
      (a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf()
    );
  }, [items]);

  const filteredRecords = useMemo(() => {
    return allTempRecords.filter((record) => {
      const matchRoom = !storageRoomFilter || record.storageRoom === storageRoomFilter;
      const matchStatus = !statusFilter || record.status === statusFilter;
      const matchDate =
        !dateRange ||
        (dayjs(record.timestamp).isAfter(dateRange[0]) &&
          dayjs(record.timestamp).isBefore(dateRange[1]));
      return matchRoom && matchStatus && matchDate;
    });
  }, [allTempRecords, storageRoomFilter, statusFilter, dateRange]);

  const stats = useMemo(() => {
    const normal = filteredRecords.filter((r) => r.status === 'normal').length;
    const warning = filteredRecords.filter((r) => r.status === 'warning').length;
    const critical = filteredRecords.filter((r) => r.status === 'critical').length;
    return { total: filteredRecords.length, normal, warning, critical };
  }, [filteredRecords]);

  const chartData = useMemo(() => {
    const last24Records = filteredRecords.slice(0, 50).reverse();
    return last24Records.map((record) => ({
      time: dayjs(record.timestamp).format('MM-DD HH:mm'),
      temperature: record.temperature,
      target: record.targetTemperature,
      product: record.productName,
    }));
  }, [filteredRecords]);

  const columns = [
    {
      title: '记录时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 120,
    },
    {
      title: '冷库/库位',
      key: 'location',
      width: 140,
      render: (_: any, record: TempRecordWithItem) => `${record.storageRoom} ${record.shelfNo}`,
    },
    {
      title: '温度(℃)',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 100,
      render: (temp: number, record: TempRecordWithItem) => {
        const diff = Math.abs(temp - record.targetTemperature);
        let color = 'text-green-600';
        if (diff > 5) color = 'text-red-600 font-bold';
        else if (diff > 2) color = 'text-orange-600';
        return <span className={color}>{temp.toFixed(1)}</span>;
      },
    },
    {
      title: '目标温度(℃)',
      dataIndex: 'targetTemperature',
      key: 'targetTemperature',
      width: 120,
      render: (temp: number) => temp.toFixed(1),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: any) => <TempStatusTag status={status} />,
    },
    {
      title: '记录人',
      dataIndex: 'recordedBy',
      key: 'recordedBy',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: any, record: TempRecordWithItem) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/storage/${record.storageId}`)}
        >
          查看入库
        </Button>
      ),
    },
  ];

  const abnormalItems = useMemo(() => {
    return items.filter((item) => item.status === 'abnormal');
  }, [items]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">温度记录回看</h2>

      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Card>
            <Statistic
              title="温度记录总数"
              value={stats.total}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="正常"
              value={stats.normal}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="预警"
              value={stats.warning}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="严重异常"
              value={stats.critical}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {abnormalItems.length > 0 && (
        <Card
          title="当前异常批次"
          size="small"
          className="mb-4"
          style={{ borderLeft: '4px solid #faad14' }}
        >
          <List
            dataSource={abnormalItems}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button type="link" onClick={() => navigate(`/storage/${item.id}`)}>
                    查看详情
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color="red">{item.id}</Tag>
                      <span>{item.productName}</span>
                      <Tag color="orange">
                        当前 {item.currentTemperature.toFixed(1)}℃ / 目标{' '}
                        {item.targetTemperature.toFixed(1)}℃
                      </Tag>
                    </Space>
                  }
                  description={item.abnormalDescription}
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Card title="温度趋势图" className="mb-4">
        <div style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)} ℃`,
                  name === 'temperature' ? '实际温度' : '目标温度',
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="temperature"
                name="实际温度"
                stroke="#1890ff"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="目标温度"
                stroke="#52c41a"
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <Space>
          <FilterOutlined />
          <Select
            placeholder="筛选冷库"
            value={storageRoomFilter || undefined}
            onChange={(v) => setStorageRoomFilter(v || '')}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="1号冷库">1号冷库</Option>
            <Option value="2号冷库">2号冷库</Option>
            <Option value="3号冷库">3号冷库</Option>
          </Select>
          <Select
            placeholder="筛选状态"
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || '')}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="normal">正常</Option>
            <Option value="warning">预警</Option>
            <Option value="critical">严重</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(v) => setDateRange(v)}
            placeholder={['开始时间', '结束时间']}
          />
        </Space>
      </div>

      <Card title="温度记录明细">
        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>
    </div>
  );
};

export default TemperatureReview;
