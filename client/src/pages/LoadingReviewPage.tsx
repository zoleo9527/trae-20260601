import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Typography,
  Row,
  Col,
  Descriptions,
  Checkbox,
  Alert,
  Divider,
  Steps
} from 'antd';
import {
  TruckOutlined,
  PackageOutlined,
  CheckOutlined,
  XOutlined,
  EyeOutlined,
  ReloadOutlined,
  FileTextOutlined,
  AlertCircleOutlined
} from '@ant-design/icons';
import {
  CustomerOrder,
  LoadingRecord,
  Formula,
  FeedingRecord,
  FeedBatch
} from '../types';
import { orderApi, loadingRecordApi, formulaApi, feedingRecordApi } from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const LoadingReviewPage: React.FC = () => {
  const { currentRole, currentUser } = useAppStore();
  const [readyOrders, setReadyOrders] = useState<CustomerOrder[]>([]);
  const [loadingRecords, setLoadingRecords] = useState<LoadingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [loadingRecord, setLoadingRecord] = useState<LoadingRecord | null>(null);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [reviewItems, setReviewItems] = useState<{
    itemId: string;
    formulaName: string;
    batchId: string;
    batchNo: string;
    quantity: number;
    unit: string;
    checked: boolean;
    discrepancy?: string;
  }[]>([]);
  const [form] = Form.useForm();
  const [showExceptionDrawer, setShowExceptionDrawer] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, recordsData, formulasData, feedingData] = await Promise.all([
        orderApi.getAll('READY'),
        loadingRecordApi.getAll(),
        formulaApi.getAll(),
        feedingRecordApi.getAll()
      ]);
      setReadyOrders(ordersData);
      setLoadingRecords(recordsData);
      setFormulas(formulasData);
      setFeedingRecords(feedingData);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartReview = async (order: CustomerOrder) => {
    setSelectedOrder(order);
    
    try {
      const existingRecord = loadingRecordApi.getAll(order.orderId);
      const record = (await existingRecord)[0];
      
      if (record) {
        setLoadingRecord(record);
        setReviewItems(record.items.map(item => ({ ...item })));
      } else {
        const newRecord = await loadingRecordApi.create({
          orderId: order.orderId,
          vehicleNo: '',
          driverName: '',
          driverPhone: '',
          checker: currentUser
        });
        setLoadingRecord(newRecord);
        setReviewItems(newRecord.items.map(item => ({ ...item })));
      }
      setReviewModalVisible(true);
    } catch (error) {
      message.error('创建复核记录失败');
    }
  };

  const handleViewReview = (record: LoadingRecord) => {
    setLoadingRecord(record);
    setReviewItems(record.items.map(item => ({ ...item })));
    
    orderApi.getById(record.orderId).then(order => {
      setSelectedOrder(order);
    });
    
    setReviewModalVisible(true);
  };

  const updateReviewItem = (index: number, field: string, value: any) => {
    const newItems = [...reviewItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setReviewItems(newItems);
  };

  const handleSubmitReview = async (values: any) => {
    if (!loadingRecord) return;

    const hasUnchecked = reviewItems.some(item => !item.checked);
    const hasDiscrepancies = reviewItems.some(item => item.discrepancy);
    const status: 'PASSED' | 'REJECTED' = hasUnchecked || hasDiscrepancies ? 'REJECTED' : 'PASSED';

    try {
      await loadingRecordApi.update(loadingRecord.loadingId, {
        items: reviewItems.map(item => ({
          itemId: item.itemId,
          batchId: item.batchId,
          checked: item.checked,
          discrepancy: item.discrepancy
        })),
        status,
        remarks: values.remarks,
        vehicleNo: values.vehicleNo,
        driverName: values.driverName,
        driverPhone: values.driverPhone
      });

      message.success(status === 'PASSED' ? '复核通过，订单已装车' : '复核未通过，已记录差异');
      setReviewModalVisible(false);
      setSelectedOrder(null);
      setLoadingRecord(null);
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getFormulaById = (formulaId: string) => formulas.find(f => f.formulaId === formulaId);
  const getFeedingRecordsByBatch = (batchId: string) => feedingRecords.filter(r => r.batchId === batchId);

  const reviewColumns = [
    {
      title: '配方名称',
      dataIndex: 'formulaName',
      key: 'formulaName',
      width: 200
    },
    {
      title: '批次号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 150
    },
    {
      title: '数量',
      key: 'quantity',
      width: 100,
      render: (_, record: any) => `${record.quantity} ${record.unit}`
    },
    {
      title: '复核状态',
      key: 'checked',
      width: 100,
      render: (checked: boolean) => (
        checked ? (
          <Tag color="green"><CheckOutlined /> 通过</Tag>
        ) : (
          <Tag color="red"><XOutlined /> 未通过</Tag>
        )
      )
    },
    {
      title: '差异说明',
      key: 'discrepancy',
      render: (discrepancy?: string) => discrepancy ? (
        <Text type="danger">{discrepancy}</Text>
      ) : '-'
    }
  ];

  const loadingRecordColumns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 150
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      ellipsis: true
    },
    {
      title: '车牌号',
      dataIndex: 'vehicleNo',
      key: 'vehicleNo',
      width: 120
    },
    {
      title: '司机',
      dataIndex: 'driverName',
      key: 'driverName',
      width: 100
    },
    {
      title: '复核状态',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'PASSED' ? 'green' : status === 'REJECTED' ? 'red' : 'orange'}>
          {status === 'PASSED' ? '已通过' : status === 'REJECTED' ? '已驳回' : '复核中'}
        </Tag>
      )
    },
    {
      title: '复核人',
      dataIndex: 'checker',
      key: 'checker',
      width: 100
    },
    {
      title: '复核时间',
      dataIndex: 'loadingTime',
      key: 'loadingTime',
      width: 150,
      render: (time: string) => dayjs(time).format('MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: LoadingRecord) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewReview(record)}
        >
          查看
        </Button>
      )
    }
  ];

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>
            <TruckOutlined style={{ marginRight: 8 }} />
            装车复核管理
          </Title>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
        </Space>
      </Card>

      <Card
        title={
          <Space>
            <AlertCircleOutlined style={{ color: '#faad14' }} />
            <span>待装车订单</span>
            <Tag color="orange">{readyOrders.length}</Tag>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {readyOrders.length > 0 ? (
          <Table
            rowKey="orderId"
            columns={[
              {
                title: '订单编号',
                dataIndex: 'orderNo',
                key: 'orderNo',
                width: 150
              },
              {
                title: '客户',
                dataIndex: 'customerName',
                key: 'customerName',
                ellipsis: true
              },
              {
                title: '商品种类',
                key: 'itemCount',
                width: 100,
                render: (_: any, record: CustomerOrder) => record.items.length
              },
              {
                title: '订单金额',
                dataIndex: 'totalAmount',
                key: 'totalAmount',
                width: 120,
                render: (val: number) => `¥${val.toLocaleString()}`
              },
              {
                title: '创建时间',
                dataIndex: 'createdAt',
                key: 'createdAt',
                width: 150,
                render: (time: string) => dayjs(time).format('MM-DD HH:mm')
              },
              {
                title: '操作',
                key: 'action',
                width: 150,
                render: (_: any, record: CustomerOrder) => (
                  <Button
                    type="primary"
                    size="small"
                    icon={<PackageOutlined />}
                    onClick={() => handleStartReview(record)}
                  >
                    开始复核
                  </Button>
                )
              }
            ]}
            dataSource={readyOrders}
            loading={loading}
            pagination={false}
            scroll={{ x: 1000 }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <PackageOutlined style={{ fontSize: 48, marginBottom: 8 }} />
            <div>暂无待装车订单</div>
          </div>
        )}
      </Card>

      <Card title="复核记录">
        <Table
          rowKey="loadingId"
          columns={loadingRecordColumns}
          dataSource={loadingRecords}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: '暂无复核记录' }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <TruckOutlined />
            <span>装车复核</span>
            {loadingRecord?.status === 'REJECTED' && (
              <Tag color="red">已驳回</Tag>
            )}
            {loadingRecord?.status === 'PASSED' && (
              <Tag color="green">已通过</Tag>
            )}
          </Space>
        }
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          setSelectedOrder(null);
          setLoadingRecord(null);
        }}
        footer={null}
        width={1000}
        destroyOnHidden
      >
        {selectedOrder && (
          <>
            <Steps
              current={loadingRecord?.status === 'PASSED' ? 2 : loadingRecord?.status === 'REJECTED' ? 2 : 1}
              items={[
                { title: '订单信息' },
                { title: '复核检查' },
                { title: '完成' }
              ]}
              style={{ marginBottom: 24 }}
            />

            <Row gutter={16}>
              <Col span={12}>
                <Card title="订单信息" size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="订单编号">{selectedOrder.orderNo}</Descriptions.Item>
                    <Descriptions.Item label="客户">{selectedOrder.customerName}</Descriptions.Item>
                    <Descriptions.Item label="收货地址">{selectedOrder.deliveryAddress}</Descriptions.Item>
                    <Descriptions.Item label="订单金额">¥{selectedOrder.totalAmount.toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="创建时间">
                      {dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm')}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="车辆信息" size="small">
                  <Form form={form} layout="vertical">
                    <Form.Item label="车牌号" name="vehicleNo">
                      <Input placeholder="请输入车牌号" />
                    </Form.Item>
                    <Form.Item label="司机姓名" name="driverName">
                      <Input placeholder="请输入司机姓名" />
                    </Form.Item>
                    <Form.Item label="联系电话" name="driverPhone">
                      <Input placeholder="请输入联系电话" />
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>

            <Divider>
              <FileTextOutlined /> 配方与投料记录
            </Divider>

            {selectedOrder.items.map(item => {
              const formula = getFormulaById(item.formulaId);
              const batches = item.batches;
              const batchRecords = batches.flatMap(batch => getFeedingRecordsByBatch(batch.batchId));

              return (
                <Card
                  key={item.itemId}
                  title={
                    <Space>
                      <span>{item.formulaName}</span>
                      <Tag color="blue">{item.quantity} {item.unit}</Tag>
                    </Space>
                  }
                  size="small"
                  style={{ marginBottom: 16 }}
                >
                  {formula && (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <Text strong>配方组成：</Text>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                          {formula.ingredients.map(ing => (
                            <Tag key={ing.ingredientId}>
                              {ing.ingredientName}: {ing.ratio}{ing.unit}
                            </Tag>
                          ))}
                        </div>
                      </div>

                      {batches.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <Text strong>关联批次：</Text>
                          <Table
                            rowKey="batchId"
                            columns={[
                              { title: '批次号', dataIndex: 'batchId', key: 'batchId' },
                              { title: '生产日期', dataIndex: 'productionDate', key: 'productionDate' },
                              { title: '有效期至', dataIndex: 'expiryDate', key: 'expiryDate' },
                              { title: '库存', key: 'quantity', render: (_, r: FeedBatch) => `${r.quantity} ${r.unit}` }
                            ]}
                            dataSource={batches}
                            pagination={false}
                            size="small"
                            style={{ marginTop: 8 }}
                          />
                        </div>
                      )}

                      {batchRecords.length > 0 && (
                        <div>
                          <Text strong>投料记录：</Text>
                          {batchRecords.map(record => (
                            <Card key={record.recordId} size="small" style={{ marginTop: 8 }}>
                              <div style={{ marginBottom: 8 }}>
                                <span style={{ marginRight: 16 }}>操作人: {record.operator}</span>
                                <span>时间: {dayjs(record.operatedAt).format('MM-DD HH:mm')}</span>
                              </div>
                              <Table
                                rowKey="ingredientId"
                                columns={[
                                  { title: '原料名称', dataIndex: 'ingredientName', key: 'ingredientName' },
                                  { title: '计划量', key: 'planned', render: (_, r: any) => `${r.plannedAmount} ${r.unit}` },
                                  { title: '实际量', key: 'actual', render: (_, r: any) => `${r.actualAmount} ${r.unit}` },
                                  { title: '偏差', key: 'deviation', render: (deviation: number) => (
                                    <Tag color={Math.abs(deviation) > 5 ? 'red' : 'green'}>
                                      {deviation > 0 ? '+' : ''}{deviation}%
                                    </Tag>
                                  )}
                                ]}
                                dataSource={record.actualIngredients}
                                pagination={false}
                                size="small"
                              />
                              {record.remarks && (
                                <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                                  备注: {record.remarks}
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </Card>
              );
            })}

            <Divider>
              <CheckOutlined /> 复核检查
            </Divider>

            {(currentRole === 'QUALITY' || currentRole === 'MANAGER') && loadingRecord?.status !== 'PASSED' && (
              <Card title="复核明细" size="small" style={{ marginBottom: 16 }}>
                {reviewItems.map((item, index) => (
                  <div
                    key={item.itemId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 12,
                      borderBottom: index < reviewItems.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <Checkbox
                      checked={item.checked}
                      onChange={(e) => updateReviewItem(index, 'checked', e.target.checked)}
                      style={{ marginRight: 16 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{item.formulaName}</div>
                      <div style={{ color: '#666', fontSize: 12 }}>
                        批次: {item.batchNo} | 数量: {item.quantity} {item.unit}
                      </div>
                    </div>
                    <Input
                      placeholder="差异说明（如有）"
                      value={item.discrepancy}
                      onChange={(e) => updateReviewItem(index, 'discrepancy', e.target.value)}
                      style={{ width: 250, marginLeft: 16 }}
                    />
                  </div>
                ))}
              </Card>
            )}

            {loadingRecord?.status !== 'CHECKING' && (
              <Card title="复核结果" size="small" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {loadingRecord.status === 'PASSED' ? (
                    <CheckOutlined style={{ fontSize: 24, color: '#52c41a', marginRight: 12 }} />
                  ) : (
                    <XOutlined style={{ fontSize: 24, color: '#ff4d4f', marginRight: 12 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: 16 }}>
                      {loadingRecord.status === 'PASSED' ? '复核通过' : '复核未通过'}
                    </div>
                    <div style={{ color: '#666' }}>
                      复核人: {loadingRecord.checker} | 时间: {dayjs(loadingRecord.loadingTime).format('MM-DD HH:mm')}
                    </div>
                  </div>
                </div>
                {loadingRecord.remarks && (
                  <div style={{ marginTop: 12, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                    <Text type="secondary">备注: {loadingRecord.remarks}</Text>
                  </div>
                )}
                {loadingRecord.discrepancies.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Text type="danger" strong>差异项：</Text>
                    <ul>
                      {loadingRecord.discrepancies.map((d, i) => (
                        <li key={i} style={{ color: '#ff4d4f' }}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )}

            {(currentRole === 'QUALITY' || currentRole === 'MANAGER') && loadingRecord?.status === 'CHECKING' && (
              <>
                <Form.Item
                  label="复核备注"
                  name="remarks"
                  style={{ marginBottom: 16 }}
                >
                  <TextArea rows={3} placeholder="请输入复核备注" />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Space>
                    <Button onClick={() => setReviewModalVisible(false)}>取消</Button>
                    <Button
                      type="primary"
                      onClick={() => form.validateFields().then(handleSubmitReview)}
                    >
                      提交复核
                    </Button>
                  </Space>
                </div>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default LoadingReviewPage;