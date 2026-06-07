import { useState, useMemo } from 'react';
import {
  Card,
  Descriptions,
  Row,
  Col,
  Button,
  Space,
  Table,
  Modal,
  Form,
  InputNumber,
  Input,
  Select,
  message,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useStore } from '@/store';
import { StatusTag, TempStatusTag } from '@/components/common/StatusTags';
import HistoryTimeline from '@/components/common/HistoryTimeline';
import dayjs from 'dayjs';

const { Option } = Select;

const StorageDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const items = useStore((state) => state.items);
  const addTemperatureRecordWithAbnormal = useStore((state) => state.addTemperatureRecordWithAbnormal);
  const addHistoryNote = useStore((state) => state.addHistoryNote);
  const markAsCompleted = useStore((state) => state.markAsCompleted);
  const currentUser = useStore((state) => state.currentUser);

  const item = useMemo(() => items.find((i) => i.id === id), [items, id]);

  const [tempModalOpen, setTempModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [abnormalConfirmOpen, setAbnormalConfirmOpen] = useState(false);
  const [pendingTempData, setPendingTempData] = useState<{
    temperature: number;
    status: 'normal' | 'warning' | 'critical';
    remark?: string;
  } | null>(null);
  const [tempForm] = Form.useForm();
  const [noteForm] = Form.useForm();
  const [abnormalForm] = Form.useForm();

  if (!item) {
    return <div>未找到该入库记录</div>;
  }

  const tempChartData = item.temperatureRecords.map((record) => ({
    time: dayjs(record.timestamp).format('MM-DD HH:mm'),
    temperature: record.temperature,
    status: record.status,
  }));

  const tempColumns = [
    {
      title: '记录时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '温度(℃)',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 100,
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
    },
  ];

  const handleTempSubmit = (values: any) => {
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    const diff = Math.abs(values.temperature - item.targetTemperature);
    if (diff > 5) status = 'critical';
    else if (diff > 2) status = 'warning';

    if (status === 'warning' || status === 'critical') {
      setPendingTempData({
        temperature: values.temperature,
        status,
        remark: values.remark,
      });
      setTempModalOpen(false);
      setAbnormalConfirmOpen(true);
    } else {
      addTemperatureRecordWithAbnormal(item.id, {
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        temperature: values.temperature,
        status,
        recordedBy: currentUser,
        remark: values.remark,
      });
      setTempModalOpen(false);
      tempForm.resetFields();
      message.success('温度记录已添加');
    }
  };

  const handleAbnormalConfirm = (values: any) => {
    if (!pendingTempData) return;

    addTemperatureRecordWithAbnormal(
      item.id,
      {
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        temperature: pendingTempData.temperature,
        status: pendingTempData.status,
        recordedBy: currentUser,
        remark: pendingTempData.remark,
      },
      values.abnormalDescription
    );

    setAbnormalConfirmOpen(false);
    setPendingTempData(null);
    abnormalForm.resetFields();
    tempForm.resetFields();
    message.success('温度记录已添加，异常状态已同步更新');
  };

  const handleAbnormalCancel = () => {
    setAbnormalConfirmOpen(false);
    setPendingTempData(null);
    setTempModalOpen(true);
  };

  const handleNoteSubmit = (values: any) => {
    addHistoryNote(item.id, {
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      operator: currentUser,
      action: values.action,
      content: values.content,
    });
    setNoteModalOpen(false);
    noteForm.resetFields();
    message.success('备注已添加');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/storage')}>
            返回列表
          </Button>
          <h2 className="text-xl font-bold m-0">入库详情 - {item.id}</h2>
          <StatusTag status={item.status} />
        </Space>
        <Space>
          <Button icon={<ThunderboltOutlined />} onClick={() => setTempModalOpen(true)}>
            记录温度
          </Button>
          <Button icon={<EditOutlined />} onClick={() => setNoteModalOpen(true)}>
            添加备注
          </Button>
          {item.status !== 'completed' && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                markAsCompleted(item.id);
                message.success('已标记为完成');
              }}
            >
              处理完成
            </Button>
          )}
        </Space>
      </div>

      {item.status === 'abnormal' && (
        <Alert
          message="异常说明"
          description={
            <div>
              <p>
                <strong>异常时间：</strong>
                {item.abnormalTime}
              </p>
              <p>
                <strong>处理人：</strong>
                {item.handler}
              </p>
              <p>
                <strong>异常描述：</strong>
                {item.abnormalDescription}
              </p>
            </div>
          }
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      <Card title="基本信息" className="mb-4">
        <Descriptions bordered column={3}>
          <Descriptions.Item label="入库单号">{item.id}</Descriptions.Item>
          <Descriptions.Item label="批次号">{item.batchNo}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <StatusTag status={item.status} />
          </Descriptions.Item>
          <Descriptions.Item label="产品名称">{item.productName}</Descriptions.Item>
          <Descriptions.Item label="产品类型">{item.productType}</Descriptions.Item>
          <Descriptions.Item label="来源">{item.source}</Descriptions.Item>
          <Descriptions.Item label="数量">
            {item.quantity} {item.unit}
          </Descriptions.Item>
          <Descriptions.Item label="重量">{item.weight} kg</Descriptions.Item>
          <Descriptions.Item label="屠宰日期">{item.slaughterDate}</Descriptions.Item>
          <Descriptions.Item label="冷库">{item.storageRoom}</Descriptions.Item>
          <Descriptions.Item label="货架号">{item.shelfNo}</Descriptions.Item>
          <Descriptions.Item label="操作人">{item.operator}</Descriptions.Item>
          <Descriptions.Item label="入库时间">{item.inboundTime}</Descriptions.Item>
          <Descriptions.Item label="预计出库">{item.expectedOutboundTime || '-'}</Descriptions.Item>
          <Descriptions.Item label="完成时间">{item.completeTime || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="温度信息" className="mb-4">
        <Row gutter={16}>
          <Col span={6}>
            <Card size="small">
              <div className="text-center">
                <div className="text-gray-500 text-sm mb-1">入库温度</div>
                <div className="text-2xl font-bold">{item.initialTemperature.toFixed(1)} ℃</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div className="text-center">
                <div className="text-gray-500 text-sm mb-1">目标温度</div>
                <div className="text-2xl font-bold text-blue-600">
                  {item.targetTemperature.toFixed(1)} ℃
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div className="text-center">
                <div className="text-gray-500 text-sm mb-1">当前温度</div>
                <div
                  className={`text-2xl font-bold ${
                    Math.abs(item.currentTemperature - item.targetTemperature) > 3
                      ? 'text-red-600'
                      : Math.abs(item.currentTemperature - item.targetTemperature) > 1
                      ? 'text-orange-600'
                      : 'text-green-600'
                  }`}
                >
                  {item.currentTemperature.toFixed(1)} ℃
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div className="text-center">
                <div className="text-gray-500 text-sm mb-1">温度记录数</div>
                <div className="text-2xl font-bold text-purple-600">
                  {item.temperatureRecords.length}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="温度变化趋势" className="mb-4">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tempChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)} ℃`, '温度']}
                  />
                  <ReferenceLine
                    y={item.targetTemperature}
                    stroke="#1890ff"
                    strokeDasharray="5 5"
                    label={`目标 ${item.targetTemperature}℃`}
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#1890ff"
                    strokeWidth={2}
                    dot={{ fill: '#1890ff' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="温度记录明细">
            <Table
              columns={tempColumns}
              dataSource={item.temperatureRecords}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={8}>
          <HistoryTimeline notes={item.historyNotes} />
        </Col>
      </Row>

      <Modal title="记录温度" open={tempModalOpen} onCancel={() => setTempModalOpen(false)} footer={null}>
        <Form form={tempForm} layout="vertical" onFinish={handleTempSubmit}>
          <Form.Item
            name="temperature"
            label="温度(℃)"
            rules={[{ required: true, message: '请输入温度' }]}
          >
            <InputNumber step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="可选，填写温度相关说明..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={() => setTempModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="添加备注" open={noteModalOpen} onCancel={() => setNoteModalOpen(false)} footer={null}>
        <Form form={noteForm} layout="vertical" onFinish={handleNoteSubmit}>
          <Form.Item
            name="action"
            label="操作类型"
            rules={[{ required: true, message: '请选择操作类型' }]}
          >
            <Select>
              <Option value="日常巡检">日常巡检</Option>
              <Option value="抽检">抽检</Option>
              <Option value="库位调整">库位调整</Option>
              <Option value="设备检查">设备检查</Option>
              <Option value="异常处理">异常处理</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label="备注内容"
            rules={[{ required: true, message: '请输入备注内容' }]}
          >
            <Input.TextArea rows={4} placeholder="请详细描述..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={() => setNoteModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="温度异常确认"
        open={abnormalConfirmOpen}
        onCancel={handleAbnormalCancel}
        footer={null}
        maskClosable={false}
      >
        <Alert
          message="检测到温度异常"
          description={
            pendingTempData
              ? `当前记录温度 ${pendingTempData.temperature.toFixed(1)}℃，与目标温度 ${item.targetTemperature.toFixed(1)}℃ 偏差较大。`
              : ''
          }
          type="warning"
          showIcon
          className="mb-4"
        />
        <Form form={abnormalForm} layout="vertical" onFinish={handleAbnormalConfirm}>
          <Form.Item
            name="abnormalDescription"
            label="异常说明"
            rules={[{ required: true, message: '请填写异常说明' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="请详细描述温度异常原因、已采取的措施等..."
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">
                确认并标记异常
              </Button>
              <Button onClick={handleAbnormalCancel}>返回修改</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StorageDetail;
