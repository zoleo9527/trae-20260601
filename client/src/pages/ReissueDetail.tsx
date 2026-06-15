import { useState, useEffect } from 'react';
import { 
  Card, 
  Descriptions, 
  Tag, 
  Table, 
  Button, 
  Space, 
  Timeline, 
  Modal,
  Form,
  Input,
  Select,
  message,
  Steps,
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
  TruckOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { 
  REISSUE_STATUS_MAP, 
  REQUEST_STATUS_MAP,
  USER_ROLE_MAP,
  type ReissueStatus,
  type RequestStatus,
  type OperationLog,
  type ReissueItem,
} from '../types';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

export default function ReissueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    reissueDetail, 
    loadingReissues,
    error,
    fetchReissueDetail,
    startPicking,
    shipReissue,
    outForDelivery,
    deliverReissue,
    cancelReissue,
    currentUser,
  } = useAppStore();

  const [pickingModalVisible, setPickingModalVisible] = useState(false);
  const [shipModalVisible, setShipModalVisible] = useState(false);
  const [outForDeliveryModalVisible, setOutForDeliveryModalVisible] = useState(false);
  const [deliverModalVisible, setDeliverModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [pickingForm] = Form.useForm();
  const [shipForm] = Form.useForm();
  const [outForm] = Form.useForm();
  const [deliverForm] = Form.useForm();
  const [cancelForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchReissueDetail(id);
    }
  }, [id]);

  if (loadingReissues && !reissueDetail) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error && !reissueDetail) {
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
        <Button type="primary" onClick={() => id && fetchReissueDetail(id)}>
          重新加载
        </Button>
      </div>
    );
  }

  if (!reissueDetail) {
    return (
      <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>
        暂无数据
      </div>
    );
  }

  const statusSteps = [
    { status: 'pending', title: '待处理', icon: <SyncOutlined /> },
    { status: 'picking', title: '拣货中', icon: <ShoppingOutlined /> },
    { status: 'shipped', title: '已发货', icon: <TruckOutlined /> },
    { status: 'out_for_delivery', title: '派送中', icon: <TruckOutlined /> },
    { status: 'delivered', title: '已签收', icon: <CheckCircleOutlined /> },
  ];

  const getCurrentStep = () => {
    const statusOrder = ['pending', 'picking', 'shipped', 'out_for_delivery', 'delivered'];
    if (reissueDetail.status === 'cancelled') return -1;
    return statusOrder.indexOf(reissueDetail.status);
  };

  const canPicking = reissueDetail.status === 'pending' && 
    (currentUser.role === 'warehouse_manager');

  const canShip = reissueDetail.status === 'picking' && 
    (currentUser.role === 'warehouse_manager' || currentUser.role === 'driver');

  const canOutForDelivery = reissueDetail.status === 'shipped' && 
    currentUser.role === 'driver';

  const canDeliver = reissueDetail.status === 'out_for_delivery' && 
    currentUser.role === 'driver';

  const canCancel = !['delivered', 'cancelled'].includes(reissueDetail.status) &&
    (currentUser.role === 'warehouse_manager' || currentUser.role === 'customer_service');

  const handlePicking = async (values: any) => {
    if (!id) return;
    try {
      await startPicking(id, {
        operator: currentUser.name,
        operator_role: currentUser.role,
        warehouse_location: values.warehouse_location,
        remark: values.remark,
      });
      message.success('已开始拣货');
      setPickingModalVisible(false);
    } catch (error: any) {
      message.error(error.error || '操作失败');
    }
  };

  const handleShip = async (values: any) => {
    if (!id) return;
    try {
      await shipReissue(id, {
        operator: currentUser.name,
        operator_role: currentUser.role,
        driver_name: values.driver_name,
        vehicle_no: values.vehicle_no,
        remark: values.remark,
      });
      message.success('已发货');
      setShipModalVisible(false);
    } catch (error: any) {
      message.error(error.error || '操作失败');
    }
  };

  const handleOutForDelivery = async (values: any) => {
    if (!id) return;
    try {
      await outForDelivery(id, {
        operator: currentUser.name,
        operator_role: currentUser.role,
        remark: values.remark,
      });
      message.success('已更新为派送中');
      setOutForDeliveryModalVisible(false);
    } catch (error: any) {
      message.error(error.error || '操作失败');
    }
  };

  const handleDeliver = async (values: any) => {
    if (!id) return;
    try {
      await deliverReissue(id, {
        operator: currentUser.name,
        operator_role: currentUser.role,
        signer_name: values.signer_name,
        remark: values.remark,
      });
      message.success('签收完成');
      setDeliverModalVisible(false);
    } catch (error: any) {
      message.error(error.error || '操作失败');
    }
  };

  const handleCancel = async (values: any) => {
    if (!id) return;
    try {
      await cancelReissue(id, {
        operator: currentUser.name,
        operator_role: currentUser.role,
        reason: values.reason,
      });
      message.success('已取消');
      setCancelModalVisible(false);
    } catch (error: any) {
      message.error(error.error || '操作失败');
    }
  };

  const itemColumns: ColumnsType<ReissueItem> = [
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '商品编码', dataIndex: 'product_code', key: 'product_code', width: 120 },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 100, render: (q, r) => `${q} ${r.unit || ''}` },
    { title: '库位', dataIndex: 'warehouse_location', key: 'warehouse_location', width: 100 },
  ];

  return (
    <div>
      {error && reissueDetail && (
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reissues')}>
            返回列表
          </Button>
          <h2 style={{ margin: 0 }}>补发跟踪详情</h2>
          <Tag color={REISSUE_STATUS_MAP[reissueDetail.status as ReissueStatus].color}>
            {REISSUE_STATUS_MAP[reissueDetail.status as ReissueStatus].label}
          </Tag>
        </Space>
        <Space>
          {canPicking && (
            <Button 
              type="primary" 
              icon={<ShoppingOutlined />}
              onClick={() => setPickingModalVisible(true)}
            >
              开始拣货
            </Button>
          )}
          {canShip && (
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={() => setShipModalVisible(true)}
            >
              发货
            </Button>
          )}
          {canOutForDelivery && (
            <Button 
              type="primary" 
              icon={<TruckOutlined />}
              onClick={() => setOutForDeliveryModalVisible(true)}
            >
              派送中
            </Button>
          )}
          {canDeliver && (
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />}
              onClick={() => setDeliverModalVisible(true)}
            >
              签收
            </Button>
          )}
          {canCancel && (
            <Popconfirm
              title="确认取消"
              description="确定要取消这个补发单吗？"
              onConfirm={() => setCancelModalVisible(true)}
              okText="确认"
              cancelText="再想想"
            >
              <Button danger icon={<CloseCircleOutlined />}>
                取消补发
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }} title="补发状态流转">
        <Steps 
          current={getCurrentStep()} 
          status={reissueDetail.status === 'cancelled' ? 'error' : undefined}
          items={statusSteps.map(s => ({
            title: s.title,
            icon: s.icon,
          }))}
        />
        {reissueDetail.status === 'cancelled' && (
          <div style={{ marginTop: 16, color: '#ff4d4f' }}>
            补发已取消
          </div>
        )}
      </Card>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="补发单号">{reissueDetail.tracking_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={REISSUE_STATUS_MAP[reissueDetail.status as ReissueStatus].color}>
                  {REISSUE_STATUS_MAP[reissueDetail.status as ReissueStatus].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="关联申请">{reissueDetail.request_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="关联订单">{reissueDetail.order_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="客户名称">{reissueDetail.customer_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{(reissueDetail as any).customer_phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="收货地址">{reissueDetail.address || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理人">
                {reissueDetail.handler ? `${reissueDetail.handler}（${USER_ROLE_MAP[reissueDetail.handler_role as keyof typeof USER_ROLE_MAP] || ''}）` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="库位">{reissueDetail.warehouse_location || '-'}</Descriptions.Item>
              <Descriptions.Item label="司机">{reissueDetail.driver_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="车牌号">{reissueDetail.vehicle_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="预计送达">{reissueDetail.estimated_delivery_date || '-'}</Descriptions.Item>
              {reissueDetail.actual_delivery_date && (
                <Descriptions.Item label="实际送达">{reissueDetail.actual_delivery_date}</Descriptions.Item>
              )}
              {reissueDetail.signer_name && (
                <>
                  <Descriptions.Item label="签收人">{reissueDetail.signer_name}</Descriptions.Item>
                  <Descriptions.Item label="签收时间">
                    {reissueDetail.sign_time ? dayjs(reissueDetail.sign_time).format('YYYY-MM-DD HH:mm') : '-'}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="创建时间">
                {dayjs(reissueDetail.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(reissueDetail.updated_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {reissueDetail.remarks || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="补发商品" style={{ marginBottom: 16 }}>
            <Table
              rowKey="id"
              columns={itemColumns}
              dataSource={reissueDetail.items || []}
              pagination={false}
              size="small"
            />
          </Card>

          {reissueDetail.request_status && (
            <Card 
              title="关联退换货申请" 
              extra={
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => navigate(`/returns/${reissueDetail.request_id}`)}
                >
                  查看申请
                </Button>
              }
              style={{ marginBottom: 16 }}
            >
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="申请单号">{reissueDetail.request_no}</Descriptions.Item>
                <Descriptions.Item label="申请状态">
                  <Tag color={REQUEST_STATUS_MAP[reissueDetail.request_status as RequestStatus]?.color}>
                    {REQUEST_STATUS_MAP[reissueDetail.request_status as RequestStatus]?.label}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </Col>

        <Col span={8}>
          <Card title="操作日志">
            <Timeline
              items={reissueDetail.logs?.map((log: OperationLog) => ({
                color: log.action.includes('取消') ? 'red' : log.action.includes('完成') || log.action.includes('签收') ? 'green' : 'blue',
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
        title="开始拣货"
        open={pickingModalVisible}
        onCancel={() => setPickingModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={pickingForm} layout="vertical" onFinish={handlePicking}>
          <Form.Item name="warehouse_location" label="仓库库位">
            <Input placeholder="请输入库位，如 A-01-01" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注信息（可选）" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setPickingModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认拣货</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="发货"
        open={shipModalVisible}
        onCancel={() => setShipModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={shipForm} layout="vertical" onFinish={handleShip}>
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
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注信息（可选）" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setShipModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认发货</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="标记派送中"
        open={outForDeliveryModalVisible}
        onCancel={() => setOutForDeliveryModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={outForm} layout="vertical" onFinish={handleOutForDelivery}>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注信息（可选）" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setOutForDeliveryModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="签收确认"
        open={deliverModalVisible}
        onCancel={() => setDeliverModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={deliverForm} layout="vertical" onFinish={handleDeliver}>
          <Form.Item name="signer_name" label="签收人" rules={[{ required: true, message: '请输入签收人' }]}>
            <Input placeholder="请输入签收人姓名" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注信息（可选）" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setDeliverModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认签收</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="取消补发"
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
    </div>
  );
}
