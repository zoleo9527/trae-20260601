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
  Tabs,
  Spin,
  List,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import { useStore } from '@/store';
import {
  LossStatusTag,
  LossTypeTag,
  DifferenceTypeTag,
  DifferenceStatusTag,
} from '@/components/common/StatusTags';
import { HistoryTimeline } from '@/components/common/HistoryTimeline';
import { useState, useCallback, useEffect } from 'react';
import { LossRecord, InventoryDifference } from '@/types';

const { TextArea } = Input;
const { TabPane } = Tabs;

export const LossDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getLossRecordById, updateLossStatus, currentUser, getInventoryDifferences } = useStore();
  const [loss, setLoss] = useState<LossRecord | null>(null);
  const [relatedDifferenceRecords, setRelatedDifferenceRecords] = useState<InventoryDifference[]>([]);
  const [availableDifferenceRecords, setAvailableDifferenceRecords] = useState<InventoryDifference[]>([]);
  const [loading, setLoading] = useState(false);
  const [concludeModalVisible, setConcludeModalVisible] = useState(false);
  const [concludeForm] = Form.useForm();
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await getLossRecordById(id);
      setLoss(result || null);
      
      if (result?.relatedDifferenceIds && result.relatedDifferenceIds.length > 0) {
        const allDifferenceRecords = await getInventoryDifferences({ page: 1, pageSize: 1000 });
        const related = allDifferenceRecords.data.filter((record) => 
          result.relatedDifferenceIds!.includes(record.id)
        );
        setRelatedDifferenceRecords(related);
      } else {
        setRelatedDifferenceRecords([]);
      }
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [id, getLossRecordById, getInventoryDifferences]);

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

  if (!loss) {
    return (
      <Card>
        <p>损耗记录不存在</p>
        <Button onClick={() => navigate('/loss')}>返回列表</Button>
      </Card>
    );
  }

  const handleStartAnalysis = () => {
    Modal.confirm({
      title: '开始分析',
      content: '确认要开始分析此损耗记录吗？',
      onOk: async () => {
        try {
          await updateLossStatus(loss.id, 'analyzing');
          message.success('已开始分析');
          setRefreshKey(k => k + 1);
        } catch (error: any) {
          message.error(error.message);
        }
      },
    });
  };

  const loadAvailableDifferenceRecords = useCallback(async () => {
    if (!loss) return;
    try {
      const result = await getInventoryDifferences({ page: 1, pageSize: 1000 });
      const filtered = result.data.filter(
        (record) =>
          record.storeId === loss.storeId &&
          record.productId === loss.productId &&
          record.status !== 'closed' &&
          record.status !== 'resolved'
      );
      setAvailableDifferenceRecords(filtered);
    } catch (error: any) {
      message.error(error.message);
    }
  }, [loss, getInventoryDifferences]);

  const handleConclude = () => {
    loadAvailableDifferenceRecords();
    setConcludeModalVisible(true);
  };

  const handleConcludeSubmit = async () => {
    try {
      const values = await concludeForm.validateFields();
      await updateLossStatus(loss.id, 'concluded', values);
      message.success('已完成分析结案');
      setConcludeModalVisible(false);
      concludeForm.resetFields();
      setRefreshKey(k => k + 1);
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message);
    }
  };

  const getActionButtons = () => {
    const buttons: JSX.Element[] = [];

    if (currentUser.role === 'product_specialist' || currentUser.role === 'supervisor') {
      if (loss.status === 'recorded') {
        buttons.push(
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleStartAnalysis}
          >
            开始分析
          </Button>
        );
      }
      if (loss.status === 'analyzing') {
        buttons.push(
          <Button
            type="primary"
            icon={<FileDoneOutlined />}
            onClick={handleConclude}
          >
            结案
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
          onClick={() => navigate('/loss')}
        >
          返回列表
        </Button>
        <Space>{getActionButtons()}</Space>
      </div>

      <Row gutter={16}>
        <Col span={18}>
          <Card title="损耗记录信息">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="报损单号" span={1}>
                <span className="font-mono text-blue-600">{loss.lossNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={1}>
                <LossStatusTag status={loss.status} />
              </Descriptions.Item>
              <Descriptions.Item label="门店" span={1}>
                {loss.storeName}
              </Descriptions.Item>
              <Descriptions.Item label="损耗类型" span={1}>
                <LossTypeTag type={loss.lossType} />
              </Descriptions.Item>
              <Descriptions.Item label="商品名称" span={1}>
                {loss.productName}
              </Descriptions.Item>
              <Descriptions.Item label="SKU" span={1}>
                <span className="font-mono">{loss.sku}</span>
              </Descriptions.Item>
              <Descriptions.Item label="损耗数量" span={1}>
                {loss.quantity}{loss.unit}
              </Descriptions.Item>
              <Descriptions.Item label="成本单价" span={1}>
                ¥{loss.costPrice.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="损耗金额" span={1}>
                <span className="font-bold text-red-600">¥{loss.lossAmount.toFixed(2)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="上报人" span={1}>
                {loss.reportedBy}
              </Descriptions.Item>
              <Descriptions.Item label="上报时间" span={1}>
                {loss.reportedAt}
              </Descriptions.Item>
              {loss.analysis?.analyst && (
                <>
                  <Descriptions.Item label="分析员" span={1}>
                    {loss.analysis.analyst}
                  </Descriptions.Item>
                  <Descriptions.Item label="分析时间" span={1}>
                    {loss.analysis.analyzedAt}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="损耗描述" span={2}>
                {loss.description}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="损耗金额"
              value={loss.lossAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
            />
            <Divider />
            <Statistic
              title="损耗数量"
              value={loss.quantity}
              suffix={loss.unit}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane tab="分析详情" key="1">
            {loss.analysis ? (
              <div className="space-y-4">
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="根本原因">
                    {loss.analysis.rootCause || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="预防措施">
                    {loss.analysis.preventiveMeasure || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="责任方">
                    {loss.analysis.responsibleParty || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="处理结论">
                    {loss.analysis.conclusion || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                暂无分析数据
              </div>
            )}
          </TabPane>
          <TabPane tab="处理历史" key="2">
            {loss.analysis?.history ? (
              <HistoryTimeline items={loss.analysis.history} />
            ) : (
              <div className="text-center text-gray-400 py-8">
                暂无处理历史
              </div>
            )}
          </TabPane>
          <TabPane tab="关联记录" key="3">
            {relatedDifferenceRecords.length > 0 ? (
              <List
                dataSource={relatedDifferenceRecords}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        size="small"
                        onClick={() => navigate(`/differences/${item.id}`)}
                      >
                        查看详情
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span className="font-mono text-blue-600">{item.differenceNo}</span>
                          <DifferenceTypeTag type={item.differenceType} />
                          <DifferenceStatusTag status={item.status} />
                        </Space>
                      }
                      description={
                        <div className="space-y-1">
                          <div><span className="text-gray-500">商品：</span>{item.productName} ({item.sku})</div>
                          <div><span className="text-gray-500">差异数量：</span>
                            <span className={item.difference > 0 ? 'text-green-600' : 'text-red-600'}>
                              {item.difference > 0 ? '+' : ''}{item.difference}{item.unit}
                            </span>
                          </div>
                          <div><span className="text-gray-500">差异金额：</span><span className="text-red-600 font-medium">¥{item.differenceAmount.toFixed(2)}</span></div>
                          <div><span className="text-gray-500">上报人：</span>{item.reporter}</div>
                          <div><span className="text-gray-500">上报时间：</span>{item.reportedAt}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div className="text-center text-gray-400 py-8">
                暂无关联盘点差异记录
              </div>
            )}
          </TabPane>
        </Tabs>
      </Card>

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
            initialValue={loss.analysis?.rootCause}
          >
            <TextArea rows={3} placeholder="请描述损耗的根本原因..." />
          </Form.Item>
          <Form.Item
            name="preventiveMeasure"
            label="预防措施"
            rules={[{ required: true, message: '请输入预防措施' }]}
            initialValue={loss.analysis?.preventiveMeasure}
          >
            <TextArea rows={3} placeholder="请描述预防此类损耗的措施..." />
          </Form.Item>
          <Form.Item
            name="responsibleParty"
            label="责任方"
            rules={[{ required: true, message: '请输入责任方' }]}
            initialValue={loss.analysis?.responsibleParty}
          >
            <Input placeholder="请输入责任方..." />
          </Form.Item>
          <Form.Item
            name="conclusion"
            label="处理结论"
            rules={[{ required: true, message: '请输入处理结论' }]}
            initialValue={loss.analysis?.conclusion}
          >
            <TextArea rows={3} placeholder="请描述最终处理结论..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
