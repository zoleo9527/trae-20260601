import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Divider,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
  Tabs,
  List,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useStore } from '@/store';
import {
  DifferenceStatusTag,
  DifferenceTypeTag,
  LossTypeTag,
  LossStatusTag,
} from '@/components/common/StatusTags';
import { HistoryTimeline } from '@/components/common/HistoryTimeline';
import { useState, useCallback, useEffect } from 'react';
import { InventoryDifference, LossRecord } from '@/types';

const { TextArea } = Input;
const { TabPane } = Tabs;

export const DifferenceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInventoryDifferenceById, updateDifferenceStatus, currentUser, getLossRecords } = useStore();
  const [difference, setDifference] = useState<InventoryDifference | null>(null);
  const [relatedLossRecords, setRelatedLossRecords] = useState<LossRecord[]>([]);
  const [availableLossRecords, setAvailableLossRecords] = useState<LossRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await getInventoryDifferenceById(id);
      setDifference(result || null);
      
      if (result?.relatedLossIds && result.relatedLossIds.length > 0) {
        const allLossRecords = await getLossRecords({ page: 1, pageSize: 1000 });
        const related = allLossRecords.data.filter((record) => 
          result.relatedLossIds!.includes(record.id)
        );
        setRelatedLossRecords(related);
      } else {
        setRelatedLossRecords([]);
      }
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [id, getInventoryDifferenceById, getLossRecords]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  if (loading) {
    return (
      <Card>
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!difference) {
    return (
      <Card>
        <p>差异单不存在</p>
        <Button onClick={() => navigate('/differences')}>返回列表</Button>
      </Card>
    );
  }

  const handleConfirm = () => {
    Modal.confirm({
      title: '确认差异',
      content: '确认要确认此差异吗？',
      onOk: async () => {
        try {
          await updateDifferenceStatus(difference.id, 'confirmed');
          message.success('已确认差异');
          setRefreshKey(k => k + 1);
        } catch (error: any) {
          message.error(error.message);
        }
      },
    });
  };

  const loadAvailableLossRecords = useCallback(async () => {
    if (!difference) return;
    try {
      const result = await getLossRecords({ page: 1, pageSize: 1000 });
      const filtered = result.data.filter(
        (record) =>
          record.storeId === difference.storeId &&
          record.productId === difference.productId &&
          record.status !== 'archived'
      );
      setAvailableLossRecords(filtered);
    } catch (error: any) {
      message.error(error.message);
    }
  }, [difference, getLossRecords]);

  const handleResolve = () => {
    loadAvailableLossRecords();
    setResolveModalVisible(true);
  };

  const handleResolveSubmit = async () => {
    try {
      const values = await form.validateFields();
      await updateDifferenceStatus(difference.id, 'resolved', values.resolution, values.relatedLossId);
      message.success('差异已解决');
      setResolveModalVisible(false);
      form.resetFields();
      setRefreshKey(k => k + 1);
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message);
    }
  };

  const handleAppeal = () => {
    Modal.confirm({
      title: '确认申诉',
      content: '确定要对此差异进行申诉吗？',
      onOk: async () => {
        try {
          await updateDifferenceStatus(difference.id, 'appealed');
          message.success('已提交申诉');
          setRefreshKey(k => k + 1);
        } catch (error: any) {
          message.error(error.message);
        }
      },
    });
  };

  const getActionButtons = () => {
    const buttons: JSX.Element[] = [];

    if (currentUser.role === 'supervisor') {
      if (difference.status === 'pending') {
        buttons.push(
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleConfirm}
          >
            确认差异
          </Button>
        );
      }
      if (difference.status === 'confirmed' || difference.status === 'appealed') {
        buttons.push(
          <Button type="primary" onClick={handleResolve}>
            处理解决
          </Button>
        );
      }
    }

    if (currentUser.role === 'store_manager') {
      if (difference.status === 'confirmed') {
        buttons.push(
          <Button
            icon={<ExclamationCircleOutlined />}
            onClick={handleAppeal}
          >
            申诉
          </Button>
        );
      }
    }

    return buttons;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/differences')}
        >
          返回列表
        </Button>
        <Space>{getActionButtons()}</Space>
      </div>

      <Row gutter={16}>
        <Col span={18}>
          <Card title="差异单信息">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="差异单号" span={1}>
                <span className="font-mono text-blue-600">{difference.differenceNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="关联盘点单" span={1}>
                <span className="font-mono">{difference.checkNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="门店" span={1}>
                {difference.storeName}
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={1}>
                <DifferenceStatusTag status={difference.status} />
              </Descriptions.Item>
              <Descriptions.Item label="商品名称" span={1}>
                {difference.productName}
              </Descriptions.Item>
              <Descriptions.Item label="SKU" span={1}>
                <span className="font-mono">{difference.sku}</span>
              </Descriptions.Item>
              <Descriptions.Item label="差异类型" span={1}>
                <DifferenceTypeTag type={difference.differenceType} />
              </Descriptions.Item>
              <Descriptions.Item label="成本单价" span={1}>
                ¥{difference.costPrice.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="系统库存" span={1}>
                {difference.systemQuantity}{difference.unit}
              </Descriptions.Item>
              <Descriptions.Item label="实际库存" span={1}>
                {difference.actualQuantity}{difference.unit}
              </Descriptions.Item>
              <Descriptions.Item label="差异数量" span={1}>
                <span className={difference.difference > 0 ? 'text-green-600' : 'text-red-600'}>
                  {difference.difference > 0 ? '+' : ''}{difference.difference}{difference.unit}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="差异金额" span={1}>
                <span className="font-bold text-red-600">¥{difference.differenceAmount.toFixed(2)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="上报人" span={1}>
                {difference.reporter}
              </Descriptions.Item>
              <Descriptions.Item label="上报时间" span={1}>
                {difference.reportedAt}
              </Descriptions.Item>
              {difference.handler && (
                <>
                  <Descriptions.Item label="处理人" span={1}>
                    {difference.handler}
                  </Descriptions.Item>
                  <Descriptions.Item label="处理时间" span={1}>
                    {difference.handledAt}
                  </Descriptions.Item>
                </>
              )}
              {difference.resolution && (
                <Descriptions.Item label="处理方案" span={2}>
                  {difference.resolution}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="差异金额"
              value={difference.differenceAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
            />
            <Divider />
            <Statistic
              title="差异数量"
              value={Math.abs(difference.difference)}
              suffix={difference.unit}
              valueStyle={{ 
                color: difference.difference > 0 ? '#3f8600' : '#cf1322' 
              }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane tab="处理历史" key="1">
            <HistoryTimeline items={difference.history} />
          </TabPane>
          <TabPane tab="关联记录" key="2">
            {relatedLossRecords.length > 0 ? (
              <List
                dataSource={relatedLossRecords}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        size="small"
                        onClick={() => navigate(`/loss/${item.id}`)}
                      >
                        查看详情
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span className="font-mono text-blue-600">{item.lossNo}</span>
                          <LossTypeTag type={item.lossType} />
                          <LossStatusTag status={item.status} />
                        </Space>
                      }
                      description={
                        <div className="space-y-1">
                          <div><span className="text-gray-500">商品：</span>{item.productName} ({item.sku})</div>
                          <div><span className="text-gray-500">损耗数量：</span>{item.quantity}{item.unit}</div>
                          <div><span className="text-gray-500">损耗金额：</span><span className="text-red-600 font-medium">¥{item.lossAmount.toFixed(2)}</span></div>
                          <div><span className="text-gray-500">上报人：</span>{item.reportedBy}</div>
                          <div><span className="text-gray-500">上报时间：</span>{item.reportedAt}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div className="text-center text-gray-400 py-8">
                暂无关联损耗记录
              </div>
            )}
          </TabPane>
        </Tabs>
      </Card>

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
            >
              {availableLossRecords.map((record) => (
                <Select.Option key={record.id} value={record.id}>
                  {record.lossNo} - {record.productName} - ¥{record.lossAmount.toFixed(2)}
                </Select.Option>
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
    </div>
  );
};
