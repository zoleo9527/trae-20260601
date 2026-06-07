import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Select,
  DatePicker,
  Input,
  Modal,
  Form,
  message,
} from 'antd';
import {
  EyeOutlined,
  PlayCircleOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import {
  LossStatusTag,
  LossTypeTag,
} from '@/components/common/StatusTags';
import {
  LossRecord,
  LossAnalysisStatus,
  LossType,
  PaginatedResponse,
  InventoryDifference,
} from '@/types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

export const LossList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<LossAnalysisStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<LossType | undefined>();
  const [storeFilter, setStoreFilter] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [concludeModalVisible, setConcludeModalVisible] = useState(false);
  const [selectedLoss, setSelectedLoss] = useState<LossRecord | null>(null);
  const [availableDifferenceRecords, setAvailableDifferenceRecords] = useState<InventoryDifference[]>([]);
  const [concludeForm] = Form.useForm();
  const [refreshKey, setRefreshKey] = useState(0);

  const [lossData, setLossData] = useState<PaginatedResponse<LossRecord>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
  });
  const [loading, setLoading] = useState(false);

  const {
    getLossRecords,
    updateLossStatus,
    stores,
    currentUser,
    getInventoryDifferences,
  } = useStore();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getLossRecords(
        { page, pageSize },
        {
          status: statusFilter,
          lossType: typeFilter,
          storeId: storeFilter,
          keyword: keyword || undefined,
          dateRange: dateRange ? [dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')] : undefined,
        }
      );
      setLossData(result);
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, typeFilter, storeFilter, keyword, dateRange, getLossRecords]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handleStartAnalysis = (record: LossRecord) => {
    setSelectedLoss(record);
    setAnalysisModalVisible(true);
  };

  const handleStartAnalysisSubmit = async () => {
    if (selectedLoss) {
      try {
        await updateLossStatus(selectedLoss.id, 'analyzing');
        message.success('已开始分析');
        setAnalysisModalVisible(false);
        setRefreshKey(k => k + 1);
      } catch (error: any) {
        message.error(error.message);
      }
    }
  };

  const loadAvailableDifferenceRecords = useCallback(async (record: LossRecord) => {
    try {
      const result = await getInventoryDifferences({ page: 1, pageSize: 1000 });
      const filtered = result.data.filter(
        (item) =>
          item.storeId === record.storeId &&
          item.productId === record.productId &&
          item.status !== 'closed' &&
          item.status !== 'resolved'
      );
      setAvailableDifferenceRecords(filtered);
    } catch (error: any) {
      message.error(error.message);
    }
  }, [getInventoryDifferences]);

  const handleConclude = (record: LossRecord) => {
    setSelectedLoss(record);
    loadAvailableDifferenceRecords(record);
    setConcludeModalVisible(true);
  };

  const handleConcludeSubmit = async () => {
    try {
      const values = await concludeForm.validateFields();
      if (selectedLoss) {
        await updateLossStatus(selectedLoss.id, 'concluded', values);
        message.success('已完成分析结案');
        setConcludeModalVisible(false);
        concludeForm.resetFields();
        setRefreshKey(k => k + 1);
      }
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message);
    }
  };

  const getActionButtons = (record: LossRecord) => {
    const buttons: JSX.Element[] = [];

    buttons.push(
      <Button
        size="small"
        icon={<EyeOutlined />}
        onClick={() => navigate(`/loss/${record.id}`)}
      >
        详情
      </Button>
    );

    if (currentUser.role === 'product_specialist' || currentUser.role === 'supervisor') {
      if (record.status === 'recorded') {
        buttons.push(
          <Button
            size="small"
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => handleStartAnalysis(record)}
          >
            开始分析
          </Button>
        );
      }
      if (record.status === 'analyzing') {
        buttons.push(
          <Button
            size="small"
            type="primary"
            icon={<FileDoneOutlined />}
            onClick={() => handleConclude(record)}
          >
            结案
          </Button>
        );
      }
    }

    return <Space>{buttons}</Space>;
  };

  const columns: ColumnsType<LossRecord> = [
    {
      title: '报损单号',
      dataIndex: 'lossNo',
      width: 140,
      render: (text) => <span className="font-mono text-blue-600">{text}</span>,
    },
    {
      title: '门店',
      dataIndex: 'storeName',
      width: 160,
    },
    {
      title: '商品',
      dataIndex: 'productName',
      width: 180,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div className="text-gray-400 text-xs">{record.sku}</div>
        </div>
      ),
    },
    {
      title: '损耗类型',
      dataIndex: 'lossType',
      width: 100,
      render: (type: LossType) => <LossTypeTag type={type} />,
    },
    {
      title: '损耗数量',
      dataIndex: 'quantity',
      width: 100,
      align: 'right',
      render: (text, record) => `${text}${record.unit}`,
    },
    {
      title: '成本单价',
      dataIndex: 'costPrice',
      width: 100,
      align: 'right',
      render: (text) => `¥${text.toFixed(2)}`,
    },
    {
      title: '损耗金额',
      dataIndex: 'lossAmount',
      width: 120,
      align: 'right',
      render: (text) => <span className="font-medium text-red-600">¥{text.toFixed(2)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: LossAnalysisStatus) => <LossStatusTag status={status} />,
    },
    {
      title: '上报人',
      dataIndex: 'reportedBy',
      width: 90,
    },
    {
      title: '上报时间',
      dataIndex: 'reportedAt',
      width: 170,
    },
    {
      title: '分析员',
      dataIndex: 'analysis.analyst',
      width: 100,
      render: (_, record) => record.analysis?.analyst || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => getActionButtons(record),
    },
  ];

  return (
    <Card
      title="损耗分析列表"
      extra={
        <Space size="large">
          <Input.Search
            placeholder="搜索商品/单号/门店"
            style={{ width: 200 }}
            allowClear
            onSearch={setKeyword}
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="recorded">已登记</Option>
            <Option value="analyzing">分析中</Option>
            <Option value="concluded">已结案</Option>
            <Option value="archived">已归档</Option>
          </Select>
          <Select
            placeholder="损耗类型"
            style={{ width: 120 }}
            allowClear
            value={typeFilter}
            onChange={setTypeFilter}
          >
            <Option value="expired">过期</Option>
            <Option value="damaged">破损</Option>
            <Option value="stolen">偷盗</Option>
            <Option value="other">其他</Option>
          </Select>
          <Select
            placeholder="门店"
            style={{ width: 150 }}
            allowClear
            value={storeFilter}
            onChange={setStoreFilter}
          >
            {stores.map((store) => (
              <Option key={store.id} value={store.id}>
                {store.name}
              </Option>
            ))}
          </Select>
          <RangePicker value={dateRange} onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)} />
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={lossData.data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total: lossData.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        scroll={{ x: 1500 }}
      />

      <Modal
        title="开始分析"
        open={analysisModalVisible}
        onOk={handleStartAnalysisSubmit}
        onCancel={() => setAnalysisModalVisible(false)}
      >
        <p>确认要开始分析此损耗记录吗？</p>
        {selectedLoss && (
          <div className="bg-gray-50 p-4 rounded mt-4">
            <p><strong>报损单号：</strong>{selectedLoss.lossNo}</p>
            <p><strong>商品：</strong>{selectedLoss.productName}</p>
            <p><strong>损耗类型：</strong>{selectedLoss.lossType === 'expired' ? '过期' : selectedLoss.lossType === 'damaged' ? '破损' : selectedLoss.lossType === 'stolen' ? '偷盗' : '其他'}</p>
            <p><strong>损耗金额：</strong>¥{selectedLoss.lossAmount.toFixed(2)}</p>
          </div>
        )}
      </Modal>

      <Modal
        title="分析结案"
        open={concludeModalVisible}
        onOk={handleConcludeSubmit}
        onCancel={() => setConcludeModalVisible(false)}
        width={700}
      >
        <Form form={concludeForm} layout="vertical">
          <Form.Item
            name="relatedDifferenceId"
            label="关联盘点差异"
            extra="选择与此损耗关联的盘点差异（同一门店、同一商品）"
          >
            <Select
              placeholder="请选择关联的盘点差异（可选）"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {availableDifferenceRecords.map((record) => (
                <Select.Option key={record.id} value={record.id}>
                  {record.differenceNo} - {record.productName} - ¥{record.differenceAmount.toFixed(2)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="rootCause"
            label="根本原因"
            rules={[{ required: true, message: '请输入根本原因' }]}
          >
            <TextArea rows={3} placeholder="请描述损耗的根本原因..." />
          </Form.Item>
          <Form.Item
            name="preventiveMeasure"
            label="预防措施"
            rules={[{ required: true, message: '请输入预防措施' }]}
          >
            <TextArea rows={3} placeholder="请描述预防此类损耗的措施..." />
          </Form.Item>
          <Form.Item
            name="responsibleParty"
            label="责任方"
            rules={[{ required: true, message: '请输入责任方' }]}
          >
            <Input placeholder="请输入责任方..." />
          </Form.Item>
          <Form.Item
            name="conclusion"
            label="处理结论"
            rules={[{ required: true, message: '请输入处理结论' }]}
          >
            <TextArea rows={3} placeholder="请描述最终处理结论..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
