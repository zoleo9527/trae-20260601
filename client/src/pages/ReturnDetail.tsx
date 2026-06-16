import { useState, useEffect } from 'react';
import { 
  Card, 
  Descriptions, 
  Tag, 
  Table, 
  Button, 
  Space, 
  Timeline, 
  List, 
  Avatar,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Upload,
  message,
  Steps,
  Divider,
  Row,
  Col,
  Popconfirm,
  Spin,
  Alert,
} from 'antd';
import { 
  ArrowLeftOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  SyncOutlined,
  PaperClipOutlined,
  FileTextOutlined,
  UserOutlined,
  InboxOutlined,
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { addHealthListener } from '../api';
import { 
  REQUEST_STATUS_MAP, 
  REQUEST_TYPE_MAP, 
  REISSUE_STATUS_MAP,
  USER_ROLE_MAP,
  REASON_CATEGORIES,
  type RequestStatus,
  type ReissueStatus,
  type ReturnItem,
  type OperationLog,
  type Attachment,
} from '../types';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { Dragger } = Upload;

export default function ReturnDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    returnDetail, 
    loadingReturns,
    error,
    fetchReturnDetail,
    submitReturnRequest,
    warehouseConfirm,
    cancelReturnRequest,
    completeReturnRequest,
    createReissue,
    currentUser,
    addAttachment,
    deleteAttachment,
    fetchWarehouseLocations,
    warehouseLocations,
    serviceHealthy,
    setServiceHealthy,
  } = useAppStore();

  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [reissueModalVisible, setReissueModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [attachModalVisible, setAttachModalVisible] = useState(false);
  const [submitForm] = Form.useForm();
  const [confirmForm] = Form.useForm();
  const [reissueForm] = Form.useForm();
  const [cancelForm] = Form.useForm();
  const [completeForm] = Form.useForm();
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [attachForm] = Form.useForm();

  useEffect(() => {
    const removeListener = addHealthListener(setServiceHealthy);
    return removeListener;
  }, [setServiceHealthy]);

  useEffect(() => {
    if (id) {
      fetchReturnDetail(id);
    }
  }, [id]);

  useEffect(() => {
    fetchWarehouseLocations();
  }, []);

  if (loadingReturns && !returnDetail) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error && !returnDetail) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Alert
          type="error"
          message="服务暂时不可用"
          description={error}
          showIcon
          style={{ marginBottom: 16, maxWidth: 400, display: 'inline-block', textAlign: 'left' }}
        />
        <br />
        <Button type="primary" onClick={() => id && fetchReturnDetail(id)}>
          重新加载
        </Button>
      </div>
    );
  }

  if (!returnDetail) {
    return (
      <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>
        暂无数据
      </div>
    );
  }

  const statusSteps = returnDetail.type === 'return' 
    ? [
        { title: '创建草稿', status: 'draft' },
        { title: '待仓库确认', status: 'pending_warehouse' },
        { title: '仓库已确认', status: 'warehouse_confirmed' },
        { title: '已完成', status: 'completed' },
      ]
    : [
        { title: '创建草稿', status: 'draft' },
        { title: '待仓库确认', status: 'pending_warehouse' },
        { title: '仓库已确认', status: 'warehouse_confirmed' },
        { title: '补发中', status: 'reissuing' },
        { title: '已完成', status: 'completed' },
      ];

  const getCurrentStep = () => {
    const statusOrder = returnDetail.type === 'return'
      ? ['draft', 'pending_warehouse', 'warehouse_confirmed', 'completed']
      : ['draft', 'pending_warehouse', 'warehouse_confirmed', 'reissuing', 'completed'];
    if (returnDetail.status === 'cancelled') return -1;
    return statusOrder.indexOf(returnDetail.status);
  };

  const canSubmit = returnDetail.status === 'draft' && 
    (currentUser.role === 'customer_service' || currentUser.role === 'warehouse_manager');
  
  const canWarehouseConfirm = returnDetail.status === 'pending_warehouse' && 
    currentUser.role === 'warehouse_manager';

  const canCreateReissue = returnDetail.status === 'warehouse_confirmed' && 
    returnDetail.type === 'exchange' &&
    currentUser.role === 'warehouse_manager';

  const canComplete = 
    returnDetail.status === 'warehouse_confirmed' && 
    returnDetail.type === 'return' &&
    ['warehouse_manager', 'customer_service'].includes(currentUser.role);

  const canCancel = !['completed', 'cancelled'].includes(returnDetail.status) &&
    (currentUser.role === 'customer_service' || currentUser.role === 'warehouse_manager');

  const handleSubmit = async (values: any) => {
    if (!id) return;
    try {
      await submitReturnRequest(id, {
        operator: currentUser.name,
        operator_role: currentUser.role,
        remark: values.remark,
      });
      message.success('提交成功');
      setSubmitModalVisible(false);
    } catch (error: any) {
      message.error(error.error || '提交失败');
    }
  };

  const handleWarehouseConfirm = async (values: any) => {
    if (!id) return;
    try {
      const items = returnDetail.returnItems?.map(item => ({
        id: item.id,
        actual_quantity: values[`actual_${item.id}`] ?? item.quantity,
        inspection_result: values[`result_${item.id}`],
        inspection_remark: values[`remark_${item.id}`],
      }));

      await warehouseConfirm(id, {
        operator: currentUser.name,
        operator_role: currentUser.role,
        items,
        remark: values.remark,
      });
      message.success('确认成功');
      setConfirmModalVisible(false);
    } catch (error: any) {
      message.error(error.error || '确认失败');
    }
  };

  const handleCreateReissue = async (values: any) => {
    if (!id) return;
    try {
      const items = values.items?.filter((item: any) => item.quantity > 0) || [];
      if (items.length === 0) {
        message.error('请至少填写一项补发商品');
        return;
      }

      await createReissue({
        request_id: id,
        handler: currentUser.name,
        handler_role: currentUser.role,
        items: items.map((item: any) => ({
          product_name: item.product_name,
          product_code: item.product_code,
          quantity: item.quantity,
          unit: item.unit,
          warehouse_location: item.warehouse_location,
        })),
        driver_name: values.driver_name,
        vehicle_no: values.vehicle_no,
        estimated_delivery_date: values.estimated_delivery_date?.format('YYYY-MM-DD'),
        remarks: values.remarks,
      });
      message.success('补发单创建成功');
      setReissueModalVisible(false);
      fetchReturnDetail(id);
    } catch (error: any) {
      message.error(error.error || '创建失败');
    }
  };

  const handleCancel = async (values: any) => {
    if (!id) return;
    try {
      await cancelReturnRequest(id, {
        operator: currentUser.name,
        operator_role: currentUser.role,
        reason: values.reason,
      });
      message.success('取消成功');
      setCancelModalVisible(false);
    } catch (error: any) {
      message.error(error.error || '取消失败');
    }
  };

  const handleComplete = async (values: any) => {
    if (!id) return;
    try {
      await completeReturnRequest(id, {
        operator: currentUser.name,
        operator_role: currentUser.role,
        remark: values.remark,
      });
      message.success('退货完成');
      setCompleteModalVisible(false);
    } catch (error: any) {
      try {
        await fetchReturnDetail(id);
        const detail = useAppStore.getState().returnDetail;
        if (detail?.status === 'completed') {
          message.success('退货完成');
          setCompleteModalVisible(false);
          return;
        }
      } catch {}
      message.error(error.message || '操作失败');
    }
  };

  const handleAddAttachment = async (values: any) => {
    if (!id) return;
    try {
      await addAttachment(id, {
        file_name: values.file_name,
        file_type: values.file_type,
        file_size: values.file_size,
        placeholder: values.placeholder ?? false,
        uploaded_by: currentUser.name,
      });
      message.success('附件添加成功');
      setAttachModalVisible(false);
      attachForm.resetFields();
    } catch (error: any) {
      try {
        const oldCount = useAppStore.getState().returnDetail?.attachments?.length || 0;
        await fetchReturnDetail(id);
        const newCount = useAppStore.getState().returnDetail?.attachments?.length || 0;
        if (newCount > oldCount) {
          message.success('附件添加成功');
          setAttachModalVisible(false);
          attachForm.resetFields();
          return;
        }
      } catch {}
      message.error(error.message || '添加失败');
    }
  };

  const returnItemColumns: ColumnsType<ReturnItem> = [
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '商品编码', dataIndex: 'product_code', key: 'product_code', width: 120 },
    { title: '申请数量', dataIndex: 'quantity', key: 'quantity', width: 100, render: (q, r) => `${q} ${r.unit || ''}` },
    { title: '库位', dataIndex: 'warehouse_location', key: 'warehouse_location', width: 100 },
    { 
      title: '实际数量', 
      dataIndex: 'actual_quantity', 
      key: 'actual_quantity', 
      width: 100, 
      render: (q, r) => q !== undefined ? `${q} ${r.unit || ''}` : '-' 
    },
    { title: '检验结果', dataIndex: 'inspection_result', key: 'inspection_result', width: 120 },
    { title: '检验备注', dataIndex: 'inspection_remark', key: 'inspection_remark', width: 150 },
  ];

  return (
    <div>
      {!serviceHealthy && (
        <Alert
          type="warning"
          message="后端服务暂时不可用"
          description="正在尝试自动重连，服务恢复后将自动刷新数据..."
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {error && serviceHealthy && returnDetail && (
        <Alert
          type="warning"
          message={error}
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/returns')}>
            返回列表
          </Button>
          <h2 style={{ margin: 0 }}>退换货申请详情</h2>
          <Tag color={REQUEST_STATUS_MAP[returnDetail.status as RequestStatus].color}>
            {REQUEST_STATUS_MAP[returnDetail.status as RequestStatus].label}
          </Tag>
          <Tag color={REQUEST_TYPE_MAP[returnDetail.type as keyof typeof REQUEST_TYPE_MAP].color}>
            {REQUEST_TYPE_MAP[returnDetail.type as keyof typeof REQUEST_TYPE_MAP].label}
          </Tag>
        </Space>
        <Space>
          {canSubmit && (
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={() => setSubmitModalVisible(true)}
            >
              提交申请
            </Button>
          )}
          {canWarehouseConfirm && (
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />}
              onClick={() => setConfirmModalVisible(true)}
            >
              仓库确认
            </Button>
          )}
          {canCreateReissue && (
            <Button 
              type="primary" 
              icon={<SyncOutlined />}
              onClick={() => setReissueModalVisible(true)}
            >
              创建补发
            </Button>
          )}
          {canComplete && (
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />}
              onClick={() => setCompleteModalVisible(true)}
            >
              完成退货
            </Button>
          )}
          {canCancel && (
            <Popconfirm
              title="确认取消"
              description="确定要取消这个申请吗？"
              onConfirm={() => setCancelModalVisible(true)}
              okText="确认"
              cancelText="再想想"
            >
              <Button danger icon={<CloseCircleOutlined />}>
                取消申请
              </Button>
            </Popconfirm>
          )}
          <Button 
            icon={<PaperClipOutlined />}
            onClick={() => setAttachModalVisible(true)}
          >
            添加附件
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }} title="状态流转">
        <Steps 
          current={getCurrentStep()} 
          status={returnDetail.status === 'cancelled' ? 'error' : undefined}
          items={statusSteps.map(s => ({
            title: s.title,
          }))}
        />
        {returnDetail.status === 'cancelled' && (
          <div style={{ marginTop: 16, color: '#ff4d4f' }}>
            申请已取消
          </div>
        )}
      </Card>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="申请单号">{returnDetail.request_no}</Descriptions.Item>
              <Descriptions.Item label="申请类型">
                <Tag color={REQUEST_TYPE_MAP[returnDetail.type as keyof typeof REQUEST_TYPE_MAP].color}>
                  {REQUEST_TYPE_MAP[returnDetail.type as keyof typeof REQUEST_TYPE_MAP].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="关联订单">{returnDetail.order_no}</Descriptions.Item>
              <Descriptions.Item label="客户名称">{returnDetail.customer_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{returnDetail.customer_phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="收货地址">{returnDetail.address || '-'}</Descriptions.Item>
              <Descriptions.Item label="原因分类">{returnDetail.reason_category || '-'}</Descriptions.Item>
              <Descriptions.Item label="申请人">
                {returnDetail.applicant}（{USER_ROLE_MAP[returnDetail.applicant_role as keyof typeof USER_ROLE_MAP]}）
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {dayjs(returnDetail.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(returnDetail.updated_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              {returnDetail.warehouse_confirmer && (
                <>
                  <Descriptions.Item label="仓库确认人">{returnDetail.warehouse_confirmer}</Descriptions.Item>
                  <Descriptions.Item label="仓库确认时间">
                    {returnDetail.warehouse_confirm_time ? dayjs(returnDetail.warehouse_confirm_time).format('YYYY-MM-DD HH:mm') : '-'}
                  </Descriptions.Item>
                </>
              )}
              {returnDetail.reissue_handler && (
                <>
                  <Descriptions.Item label="补发处理人">{returnDetail.reissue_handler}</Descriptions.Item>
                  <Descriptions.Item label="补发处理时间">
                    {returnDetail.reissue_handle_time ? dayjs(returnDetail.reissue_handle_time).format('YYYY-MM-DD HH:mm') : '-'}
                  </Descriptions.Item>
                </>
              )}
              {returnDetail.completer && (
                <>
                  <Descriptions.Item label="完成人">{returnDetail.completer}</Descriptions.Item>
                  <Descriptions.Item label="完成时间">
                    {returnDetail.complete_time ? dayjs(returnDetail.complete_time).format('YYYY-MM-DD HH:mm') : '-'}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="原因说明" span={2}>
                {returnDetail.reason || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {returnDetail.remarks || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="退货商品" style={{ marginBottom: 16 }}>
            <Table
              rowKey="id"
              columns={returnItemColumns}
              dataSource={returnDetail.returnItems || []}
              pagination={false}
              size="small"
            />
          </Card>

          {returnDetail.reissue && (
            <Card 
              title="补发跟踪" 
              extra={
                <Button 
                  type="link" 
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/reissues/${returnDetail.reissue?.id}`)}
                >
                  查看详情
                </Button>
              }
              style={{ marginBottom: 16 }}
            >
              <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="补发单号">{returnDetail.reissue.tracking_no}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={REISSUE_STATUS_MAP[returnDetail.reissue.status as ReissueStatus].color}>
                    {REISSUE_STATUS_MAP[returnDetail.reissue.status as ReissueStatus].label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="处理人">{returnDetail.reissue.handler || '-'}</Descriptions.Item>
                <Descriptions.Item label="司机">{returnDetail.reissue.driver_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="车牌号">{returnDetail.reissue.vehicle_no || '-'}</Descriptions.Item>
                <Descriptions.Item label="预计送达">
                  {returnDetail.reissue.estimated_delivery_date || '-'}
                </Descriptions.Item>
                {returnDetail.reissue.actual_delivery_date && (
                  <Descriptions.Item label="实际送达">
                    {returnDetail.reissue.actual_delivery_date}
                  </Descriptions.Item>
                )}
                {returnDetail.reissue.signer_name && (
                  <Descriptions.Item label="签收人">{returnDetail.reissue.signer_name}</Descriptions.Item>
                )}
              </Descriptions>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>补发商品：</div>
              <Table
                rowKey="id"
                columns={[
                  { title: '商品名称', dataIndex: 'product_name' },
                  { title: '商品编码', dataIndex: 'product_code', width: 120 },
                  { title: '数量', dataIndex: 'quantity', width: 80, render: (q, r: any) => `${q} ${r.unit || ''}` },
                  { title: '库位', dataIndex: 'warehouse_location', width: 100 },
                ]}
                dataSource={returnDetail.reissue.items || []}
                pagination={false}
                size="small"
              />
            </Card>
          )}

          <Card title="附件">
            {returnDetail.attachments?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                暂无附件
              </div>
            ) : (
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4 }}
                dataSource={returnDetail.attachments}
                renderItem={(item: Attachment) => (
                  <List.Item>
                    <Card 
                      size="small" 
                      hoverable
                      actions={[
                        <Button type="text" size="small" key="view">查看</Button>,
                        <Popconfirm
                          key="delete"
                          title="确认删除"
                          description="确定要删除这个附件吗？"
                          onConfirm={async () => {
                            try {
                              await deleteAttachment(item.id);
                              message.success('删除成功');
                              if (id) fetchReturnDetail(id);
                            } catch (error: any) {
                              try {
                                const oldAttachments = useAppStore.getState().returnDetail?.attachments || [];
                                if (id) await fetchReturnDetail(id);
                                const newAttachments = useAppStore.getState().returnDetail?.attachments || [];
                                const stillExists = newAttachments.some((a) => a.id === item.id);
                                if (!stillExists) {
                                  message.success('删除成功');
                                  return;
                                }
                              } catch {}
                              message.error(error.message || '删除失败');
                            }
                          }}
                          okText="确认"
                          cancelText="取消"
                        >
                          <Button type="text" size="small" danger>删除</Button>
                        </Popconfirm>,
                      ]}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <FileTextOutlined style={{ fontSize: 32, color: item.placeholder ? '#d9d9d9' : '#1677ff' }} />
                        <div style={{ marginTop: 8, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.file_name}
                        </div>
                        {item.placeholder && (
                          <Tag color="default" style={{ marginTop: 4 }}>占位</Tag>
                        )}
                        {item.file_type && (
                          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                            {item.file_type}
                          </div>
                        )}
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="操作日志">
            <Timeline
              items={returnDetail.logs?.map((log: OperationLog) => ({
                color: log.action.includes('取消') ? 'red' : log.action.includes('完成') ? 'green' : 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{log.action}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      {log.operator}（{USER_ROLE_MAP[log.operator_role as keyof typeof USER_ROLE_MAP]}）
                    </div>
                    {log.detail && (
                      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        {log.detail}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </div>
                  </div>
                ),
              })) || []}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="提交申请"
        open={submitModalVisible}
        onCancel={() => setSubmitModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={submitForm} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息（可选）" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setSubmitModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="仓库确认"
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        footer={null}
        width={700}
        destroyOnHidden
      >
        <Form form={confirmForm} layout="vertical" onFinish={handleWarehouseConfirm}>
          <div style={{ marginBottom: 16, fontWeight: 500 }}>退货商品验收：</div>
          {returnDetail.returnItems?.map((item, index) => (
            <Card key={item.id} size="small" style={{ marginBottom: 8 }}>
              <Row gutter={8}>
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#666' }}>商品名称</div>
                  <div>{item.product_name}</div>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name={`actual_${item.id}`}
                    style={{ marginBottom: 0 }}
                    initialValue={item.quantity}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} addonBefore="实收件数" />
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item
                    name={`result_${item.id}`}
                    style={{ marginBottom: 0 }}
                  >
                    <Select placeholder="检验结果">
                      <Option value="完好">完好</Option>
                      <Option value="包装破损">包装破损</Option>
                      <Option value="质量问题">质量问题</Option>
                      <Option value="数量短缺">数量短缺</Option>
                      <Option value="其他">其他</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item
                    name={`remark_${item.id}`}
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="检验备注" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          ))}
          <Form.Item name="remark" label="确认备注" style={{ marginTop: 16 }}>
            <Input.TextArea rows={2} placeholder="请输入备注信息（可选）" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setConfirmModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认收货</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="创建补发单"
        open={reissueModalVisible}
        onCancel={() => setReissueModalVisible(false)}
        footer={null}
        width={700}
        destroyOnHidden
      >
        <Form 
          form={reissueForm} 
          layout="vertical" 
          onFinish={handleCreateReissue}
          initialValues={{
            items: returnDetail.returnItems?.map(item => ({
              product_name: item.product_name,
              product_code: item.product_code,
              quantity: item.quantity,
              unit: item.unit,
              warehouse_location: item.warehouse_location,
            })) || [],
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="driver_name" label="司机姓名">
                <Input placeholder="请输入司机姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="vehicle_no" label="车牌号">
                <Input placeholder="请输入车牌号" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="补发商品">
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={8} style={{ marginBottom: 8 }} align="bottom">
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'product_name']}
                          rules={[{ required: true, message: '请输入商品名称' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="商品名称" />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, 'product_code']}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="商品编码" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          rules={[{ required: true, message: '请输入数量' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={0} style={{ width: '100%' }} placeholder="数量" />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...restField}
                          name={[name, 'unit']}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="单位" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'warehouse_location']}
                          style={{ marginBottom: 0 }}
                        >
                          <Select placeholder="库位">
                            {warehouseLocations.map(loc => (
                              <Option key={loc.id} value={loc.location_code}>
                                {loc.location_code}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加商品
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setReissueModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建补发</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="取消申请"
        open={cancelModalVisible}
        onCancel={() => setCancelModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={cancelForm} layout="vertical" onFinish={handleCancel}>
          <Form.Item name="reason" label="取消原因" rules={[{ required: true, message: '请输入取消原因' }]}>
            <Input.TextArea rows={4} placeholder="请输入取消原因" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setCancelModalVisible(false)}>返回</Button>
              <Button danger htmlType="submit">确认取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="完成退货"
        open={completeModalVisible}
        onCancel={() => setCompleteModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={completeForm} layout="vertical" onFinish={handleComplete}>
          <div style={{ marginBottom: 16, padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
            <p style={{ margin: 0, color: '#389e0d' }}>
              <strong>确认完成退货？</strong>
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#52c41a' }}>
              完成后申请状态将变为"已完成"，不可再修改。
            </p>
          </div>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息（可选）" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setCompleteModalVisible(false)}>返回</Button>
              <Button type="primary" htmlType="submit">确认完成</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加附件"
        open={attachModalVisible}
        onCancel={() => setAttachModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={attachForm} layout="vertical" onFinish={handleAddAttachment}>
          <Form.Item name="file_name" label="文件名" rules={[{ required: true, message: '请输入文件名' }]}>
            <Input placeholder="请输入文件名，如：现场照片.jpg" />
          </Form.Item>
          <Form.Item name="file_type" label="文件类型">
            <Select placeholder="请选择文件类型">
              <Option value="image/jpeg">图片 (JPEG)</Option>
              <Option value="image/png">图片 (PNG)</Option>
              <Option value="application/pdf">PDF文档</Option>
              <Option value="application/msword">Word文档</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="file_size" label="文件大小（字节）">
            <InputNumber style={{ width: '100%' }} placeholder="请输入文件大小" />
          </Form.Item>
          <Form.Item name="placeholder" label="附件类型" initialValue={false}>
            <Select>
              <Option value={false}>真实附件</Option>
              <Option value={true}>占位附件</Option>
            </Select>
          </Form.Item>
          <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, marginBottom: 16, fontSize: 12, color: '#666' }}>
            <strong>说明：</strong>当前系统未对接真实的文件存储服务。选择"占位附件"可模拟上传流程，
            文件元数据会保存在数据库中，但不会有实际文件内容。如需对接真实的 OSS/文件服务器，
            请参考交付说明中的扩展指引。
          </div>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setAttachModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">添加</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
