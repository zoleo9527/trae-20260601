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
  Steps,
  Drawer,
  Select,
  DatePicker
} from 'antd';
import {
  TruckOutlined,
  PackageOutlined,
  CheckOutlined,
  XOutlined,
  EyeOutlined,
  ReloadOutlined,
  FileTextOutlined,
  AlertCircleOutlined,
  PlusOutlined,
  HistoryOutlined,
  ChevronRightOutlined
} from '@ant-design/icons';
import {
  CustomerOrder,
  LoadingRecord,
  Formula,
  FeedingRecord,
  FeedBatch,
  ExceptionRecord,
  ExceptionType,
  ExceptionTypeNames
} from '../types';
import { orderApi, loadingRecordApi, formulaApi, feedingRecordApi, exceptionApi } from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

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
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
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
  const [exceptionDrawerVisible, setExceptionDrawerVisible] = useState(false);
  const [orderExceptions, setOrderExceptions] = useState<ExceptionRecord[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, recordsData, formulasData, feedingData, exceptionsData] = await Promise.all([
        orderApi.getAll('READY'),
        loadingRecordApi.getAll(),
        formulaApi.getAll(),
        feedingRecordApi.getAll(),
        exceptionApi.getAll()
      ]);
      setReadyOrders(ordersData);
      setLoadingRecords(recordsData);
      setFormulas(formulasData);
      setFeedingRecords(feedingData);
      setExceptions(exceptionsData);
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
      const existingRecords = await loadingRecordApi.getAll(order.orderId);
      const record = existingRecords[0];
      
      if (record) {
        setLoadingRecord(record);
        setReviewItems(record.items.map(item => ({ ...item })));
        form.setFieldsValue({
          vehicleNo: record.vehicleNo,
          driverName: record.driverName,
          driverPhone: record.driverPhone,
          remarks: record.remarks
        });
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

      const orderExceptionList = exceptions.filter(e => e.orderId === order.orderId);
      setOrderExceptions(orderExceptionList);
      setReviewModalVisible(true);
    } catch (error) {
      message.error('创建复核记录失败');
    }
  };

  const handleViewReview = async (record: LoadingRecord) => {
    setLoadingRecord(record);
    setReviewItems(record.items.map(item => ({ ...item })));
    form.setFieldsValue({
      vehicleNo: record.vehicleNo,
      driverName: record.driverName,
      driverPhone: record.driverPhone,
      remarks: record.remarks
    });
    
    try {
      const [order, exceptionsData] = await Promise.all([
        orderApi.getById(record.orderId),
        exceptionApi.getAll()
      ]);
      setSelectedOrder(order);
      setExceptions(exceptionsData);
      const orderExceptionList = exceptionsData.filter(e => e.orderId === record.orderId);
      setOrderExceptions(orderExceptionList);
    } catch (error) {
      message.error('加载订单信息失败');
    }
    
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

      message.success(status === 'PASSED' ? '复核通过，订单已装车' : '复核未通过，已记录差异并生成异常');
      setReviewModalVisible(false);
      setSelectedOrder(null);
      setLoadingRecord(null);
      setOrderExceptions([]);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleAddException = async (values: any) => {
    if (!selectedOrder) return;

    try {
      const newException = await exceptionApi.create({
        type: values.type,
        title: values.title,
        description: values.description,
        severity: values.severity,
        reportedBy: currentUser,
        orderId: selectedOrder.orderId,
        customerId: selectedOrder.customerId
      });
      
      message.success('异常已上报');
      setExceptionDrawerVisible(false);
      
      const exceptionsData = await exceptionApi.getAll();
      setExceptions(exceptionsData);
      
      if (selectedOrder) {
        const orderExceptionList = exceptionsData.filter(e => e.orderId === selectedOrder.orderId);
        setOrderExceptions(orderExceptionList);
      }
    } catch (error) {
      message.error('上报失败');
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
          setOrderExceptions([]);
          form.resetFields();
        }}
        footer={null}
        width={1100}
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
              <Col span={10}>
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

              <Col span={7}>
                <Card title="车辆信息" size="small">
                  <Form form={form} layout="vertical">
                    <Form.Item label="车牌号" name="vehicleNo" rules={[{ required: true, message: '请输入车牌号' }]}>
                      <Input placeholder="请输入车牌号" />
                    </Form.Item>
                    <Form.Item label="司机姓名" name="driverName" rules={[{ required: true, message: '请输入司机姓名' }]}>
                      <Input placeholder="请输入司机姓名" />
                    </Form.Item>
                    <Form.Item label="联系电话" name="driverPhone" rules={[{ required: true, message: '请输入联系电话' }]}>
                      <Input placeholder="请输入联系电话" />
                    </Form.Item>

                    {(currentRole === 'QUALITY' || currentRole === 'MANAGER') && loadingRecord?.status === 'CHECKING' && (
                      <Form.Item
                        label="复核备注"
                        name="remarks"
                        style={{ marginBottom: 0 }}
                      >
                        <TextArea rows={3} placeholder="请输入复核备注" />
                      </Form.Item>
                    )}
                  </Form>
                </Card>
              </Col>

              <Col span={7}>
                <Card 
                  title={
                    <Space>
                      <AlertCircleOutlined style={{ color: '#ff4d4f' }} />
                      <span>异常记录</span>
                      <Tag color={orderExceptions.length > 0 ? 'red' : 'green'}>
                        {orderExceptions.length}
                      </Tag>
                    </Space>
                  }
                  size="small"
                  extra={
                    (currentRole === 'QUALITY' || currentRole === 'MANAGER') && (
                      <Button 
                        type="link" 
                        size="small" 
                        icon={<PlusOutlined />}
                        onClick={() => setExceptionDrawerVisible(true)}
                      >
                        添加异常
                      </Button>
                    )
                  }
                >
                  {orderExceptions.length > 0 ? (
                    <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                      {orderExceptions.map(exception => (
                        <div 
                          key={exception.exceptionId}
                          style={{ 
                            padding: 8, 
                            borderBottom: '1px solid #f0f0f0',
                            marginBottom: 8,
                            background: exception.severity === 'HIGH' || exception.severity === 'CRITICAL' 
                              ? '#fff2f0' 
                              : '#fff7e6'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text strong>{exception.title}</Text>
                            <Tag color={exception.severity === 'HIGH' || exception.severity === 'CRITICAL' ? 'red' : 'orange'}>
                              {exception.severity === 'HIGH' ? '高' : exception.severity === 'CRITICAL' ? '严重' : '中'}
                            </Tag>
                          </div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            {ExceptionTypeNames[exception.type]} | {dayjs(exception.reportedAt).format('MM-DD HH:mm')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 20, color: '#999', fontSize: 12 }}>
                      <HistoryOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
                      暂无异常记录
                    </div>
                  )}
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
                      style={{ width: 300, marginLeft: 16 }}
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
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Space>
                  <Button onClick={() => {
                    setReviewModalVisible(false);
                    setSelectedOrder(null);
                    setLoadingRecord(null);
                    setOrderExceptions([]);
                    form.resetFields();
                  }}>取消</Button>
                  <Button
                    type="primary"
                    onClick={() => form.validateFields().then(handleSubmitReview)}
                  >
                    提交复核
                  </Button>
                </Space>
              </div>
            )}
          </>
        )}
      </Modal>

      <Drawer
        title="📝 上报异常"
        width={450}
        placement="right"
        onClose={() => setExceptionDrawerVisible(false)}
        open={exceptionDrawerVisible}
      >
        <Form
          layout="vertical"
          onFinish={handleAddException}
        >
          <Form.Item
            label="异常类型"
            name="type"
            rules={[{ required: true, message: '请选择异常类型' }]}
          >
            <Select placeholder="请选择异常类型">
              {Object.entries(ExceptionTypeNames).map(([key, value]) => (
                <Option key={key} value={key}>{value}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="异常标题"
            name="title"
            rules={[{ required: true, message: '请输入异常标题' }]}
          >
            <Input placeholder="请输入异常标题" />
          </Form.Item>

          <Form.Item
            label="异常描述"
            name="description"
            rules={[{ required: true, message: '请输入异常描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述异常情况" />
          </Form.Item>

          <Form.Item
            label="严重程度"
            name="severity"
            rules={[{ required: true, message: '请选择严重程度' }]}
          >
            <Select placeholder="请选择严重程度">
              <Option value="LOW">低</Option>
              <Option value="MEDIUM">中</Option>
              <Option value="HIGH">高</Option>
              <Option value="CRITICAL">严重</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setExceptionDrawerVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交上报</Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default LoadingReviewPage;