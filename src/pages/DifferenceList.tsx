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
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import {
  DifferenceStatusTag,
  DifferenceTypeTag,
} from '@/components/common/StatusTags';
import {
  InventoryDifference,
  InventoryDifferenceStatus,
  DifferenceType,
  PaginatedResponse,
  LossRecord,
} from '@/types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

export const DifferenceList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<InventoryDifferenceStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<DifferenceType | undefined>();
  const [storeFilter, setStoreFilter] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [selectedDifference, setSelectedDifference] = useState<InventoryDifference | null>(null);
  const [availableLossRecords, setAvailableLossRecords] = useState<LossRecord[]>([]);
  const [loadingLossRecords, setLoadingLossRecords] = useState(false);
  const [form] = Form.useForm();
  const [refreshKey, setRefreshKey] = useState(0);

  const [differenceData, setDifferenceData] = useState<PaginatedResponse<InventoryDifference>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
  });
  const [loading, setLoading] = useState(false);

  const {
    getInventoryDifferences,
    updateDifferenceStatus,
    getLossRecords,
    stores,
    currentUser,
  } = useStore();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getInventoryDifferences(
        { page, pageSize },
        {
          status: statusFilter,
          differenceType: typeFilter,
          storeId: storeFilter,
          keyword: keyword || undefined,
          dateRange: dateRange ? [dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')] : undefined,
        }
      );
      setDifferenceData(result);
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, typeFilter, storeFilter, keyword, dateRange, getInventoryDifferences]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handleConfirm = (record: InventoryDifference) => {
    setSelectedDifference(record);
    setConfirmModalVisible(true);
  };

  const handleConfirmSubmit = async () => {
    if (selectedDifference) {
      try {
        await updateDifferenceStatus(selectedDifference.id, 'confirmed');
        message.success('已确认差异');
        setConfirmModalVisible(false);
        setRefreshKey(k => k + 1);
      } catch (error: any) {
        message.error(error.message);
      }
    }
  };

  const loadAvailableLossRecords = async (record: InventoryDifference) => {
    setLoadingLossRecords(true);
    try {
      const result = await getLossRecords({ page: 1, pageSize: 100 }, {
        storeId: record.storeId,
        status: 'recorded' as any,
      });
      const filtered = result.data.filter(
        (l) => l.productId === record.productId && l.status !== 'archived'
      );
      setAvailableLossRecords(filtered);
    } catch (error: any) {
      message.error('加载关联损耗记录失败：' + error.message);
      setAvailableLossRecords([]);
    } finally {
      setLoadingLossRecords(false);
    }
  };

  const handleResolve = (record: InventoryDifference) => {
    setSelectedDifference(record);
    loadAvailableLossRecords(record);
    setResolveModalVisible(true);
  };

  const handleResolveSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (selectedDifference) {
        await updateDifferenceStatus(
          selectedDifference.id,
          'resolved',
          values.resolution,
          values.relatedLossId
        );
        message.success('差异已解决');
        setResolveModalVisible(false);
        form.resetFields();
        setRefreshKey(k => k + 1);
      }
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message);
    }
  };

  const handleAppeal = (record: InventoryDifference) => {
    Modal.confirm({
      title: '确认申诉',
      content: '确定要对此差异进行申诉吗？',
      onOk: async () => {
        try {
          await updateDifferenceStatus(record.id, 'appealed');
          message.success('已提交申诉');
          setRefreshKey(k => k + 1);
        } catch (error: any) {
          message.error(error.message);
        }
      },
    });
  };

  const getActionButtons = (record: InventoryDifference) => {
    const buttons: JSX.Element[] = [];

    buttons.push(
      <Button
        size="small"
        icon={<EyeOutlined />}
        onClick={() => navigate(`/differences/${record.id}`)}
      >
        详情
      </Button>
    );

    if (currentUser.role === 'supervisor') {
      if (record.status === 'pending') {
        buttons.push(
          <Button
            size="small"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleConfirm(record)}
          >
            确认
          </Button>
        );
      }
      if (record.status === 'confirmed' || record.status === 'appealed') {
        buttons.push(
          <Button
            size="small"
            type="primary"
            onClick={() => handleResolve(record)}
          >
            处理
          </Button>
        );
      }
    }

    if (currentUser.role === 'store_manager') {
      if (record.status === 'confirmed') {
        buttons.push(
          <Button
            size="small"
            icon={<ExclamationCircleOutlined />}
            onClick={() => handleAppeal(record)}
          >
            申诉
          </Button>
        );
      }
    }

    return <Space>{buttons}</Space>;
  };

  const columns: ColumnsType<InventoryDifference> = [
    {
      title: '差异单号',
      dataIndex: 'differenceNo',
      width: 140,
      render: (text) => <span className="font-mono text-blue-600">{text}</span>,
    },
    {
      title: '关联盘点单',
      dataIndex: 'checkNo',
      width: 140,
      render: (text) => <span className="font-mono">{text}</span>,
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
      title: '差异类型',
      dataIndex: 'differenceType',
      width: 100,
      render: (type: DifferenceType) => <DifferenceTypeTag type={type} />,
    },
    {
      title: '系统库存',
      dataIndex: 'systemQuantity',
      width: 90,
      align: 'right',
      render: (text, record) => `${text}${record.unit}`,
    },
    {
      title: '实际库存',
      dataIndex: 'actualQuantity',
      width: 90,
      align: 'right',
      render: (text, record) => `${text}${record.unit}`,
    },
    {
      title: '差异数量',
      dataIndex: 'difference',
      width: 100,
      align: 'right',
      render: (text, record) => (
        <span className={text > 0 ? 'text-green-600' : 'text-red-600'}>
          {text > 0 ? '+' : ''}{text}{record.unit}
        </span>
      ),
    },
    {
      title: '差异金额',
      dataIndex: 'differenceAmount',
      width: 110,
      align: 'right',
      render: (text) => <span className="font-medium">¥{text.toFixed(2)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: InventoryDifferenceStatus) => (
        <DifferenceStatusTag status={status} />
      ),
    },
    {
      title: '上报人',
      dataIndex: 'reporter',
      width: 90,
    },
    {
      title: '上报时间',
      dataIndex: 'reportedAt',
      width: 170,
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
      title="盘点差异列表"
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
            <Option value="pending">待处理</Option>
            <Option value="confirmed">已确认</Option>
            <Option value="resolved">已解决</Option>
            <Option value="appealed">申诉中</Option>
            <Option value="closed">已关闭</Option>
          </Select>
          <Select
            placeholder="差异类型"
            style={{ width: 120 }}
            allowClear
            value={typeFilter}
            onChange={setTypeFilter}
          >
            <Option value="overage">溢余</Option>
            <Option value="shortage">短缺</Option>
            <Option value="price_mismatch">价签错误</Option>
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
        dataSource={differenceData.data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total: differenceData.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        scroll={{ x: 1600 }}
      />

      <Modal
        title="确认差异"
        open={confirmModalVisible}
        onOk={handleConfirmSubmit}
        onCancel={() => setConfirmModalVisible(false)}
      >
        <p>确认要确认此差异吗？确认后将进入处理流程。</p>
        {selectedDifference && (
          <div className="bg-gray-50 p-4 rounded mt-4">
            <p><strong>差异单号：</strong>{selectedDifference.differenceNo}</p>
            <p><strong>商品：</strong>{selectedDifference.productName}</p>
            <p><strong>差异类型：</strong>{selectedDifference.differenceType === 'overage' ? '溢余' : selectedDifference.differenceType === 'shortage' ? '短缺' : '价签错误'}</p>
            <p><strong>差异金额：</strong>¥{selectedDifference.differenceAmount.toFixed(2)}</p>
          </div>
        )}
      </Modal>

      <Modal
        title="处理差异"
        open={resolveModalVisible}
        onOk={handleResolveSubmit}
        onCancel={() => setResolveModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="relatedLossId"
            label="关联损耗记录"
            extra="选择与此差异关联的损耗记录（同一门店、同一商品）"
          >
            <Select
              placeholder="请选择关联的损耗记录（可选）"
              allowClear
              showSearch
              optionFilterProp="children"
              loading={loadingLossRecords}
            >
              {availableLossRecords.map((loss) => (
                <Option key={loss.id} value={loss.id}>
                  {loss.lossNo} - {loss.productName} - ¥{loss.lossAmount.toFixed(2)}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="resolution"
            label="处理方案"
            rules={[{ required: true, message: '请输入处理方案' }]}
          >
            <TextArea rows={4} placeholder="请描述处理方案和原因..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
