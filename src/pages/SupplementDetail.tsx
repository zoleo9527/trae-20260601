import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Button,
  Card,
  Descriptions,
  Table,
  Tag,
  Space,
  Timeline,
  Row,
  Col,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Popconfirm,
  message,
  Divider,
  Tooltip,
  Avatar,
  Empty,
} from 'antd'
import {
  ArrowLeftOutlined,
  SendOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
  RocketOutlined,
  ExportOutlined,
  CalendarOutlined,
  UserOutlined,
  FileTextOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCurrentUser } from '@/layouts/MainLayout'
import { SupplementApi } from '@/api/supplement'
import {
  SUPPLEMENT_STATUS_MAP,
  type SupplementApplication,
  type HistoryRecord,
  type TileItem,
  type Role,
} from '@/types'

const { TextArea } = Input

export default function SupplementDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser } = useCurrentUser()

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SupplementApplication | null>(null)
  const [history, setHistory] = useState<HistoryRecord[]>([])

  const [actionType, setActionType] = useState<string | null>(null)
  const [form] = Form.useForm()

  const fetchDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [d, h] = await Promise.all([
        SupplementApi.detail(id),
        SupplementApi.history(id),
      ])
      setData(d)
      setHistory(h || [])
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  const canActionByRole = (): Record<string, boolean> => {
    if (!data) return {}
    const role: Role = currentUser.role
    const s = data.status
    return {
      submit: role === 'guide' && ['pending', 'supplemented'].includes(s),
      startDesign: role === 'designer' && ['pending', 'designing', 'supplemented'].includes(s),
      confirmDesign: role === 'designer' && ['designing', 'supplemented', 'rescheduled'].includes(s),
      rejectDesign: role === 'designer' && ['designing', 'supplemented', 'pending'].includes(s),
      rejectWarehouse: role === 'warehouse' && ['confirmed', 'warehousing', 'rescheduled'].includes(s),
      startWarehouse: role === 'warehouse' && ['confirmed', 'rescheduled', 'supplemented'].includes(s),
      ship: role === 'warehouse' && ['warehousing'].includes(s),
      complete: role === 'guide' && ['shipped'].includes(s),
      reschedule: role === 'guide' && !['completed', 'rejected'].includes(s),
      supplement: role === 'guide' && ['rejected'].includes(s),
    }
  }

  const openAction = (type: string) => {
    setActionType(type)
    form.resetFields()
  }

  const doAction = async () => {
    if (!data) return
    try {
      switch (actionType) {
        case 'submit': {
          await SupplementApi.submit(data.id, currentUser.id)
          message.success('已提交设计师复核')
          break
        }
        case 'startDesign': {
          const values = await form.validateFields()
          await SupplementApi.startDesign(data.id, currentUser.id, values.remark)
          message.success('已开始量房复核')
          break
        }
        case 'confirmDesign': {
          const values = await form.validateFields()
          await SupplementApi.confirmDesign(data.id, currentUser.id, { remark: values.remark })
          message.success('设计师确认无误')
          break
        }
        case 'reject': {
          const values = await form.validateFields()
          await SupplementApi.reject(data.id, currentUser.id, values.reason)
          message.success('已驳回')
          break
        }
        case 'startWarehouse': {
          await SupplementApi.startWarehouse(data.id, currentUser.id)
          message.success('已开始备货')
          break
        }
        case 'ship': {
          const values = await form.validateFields()
          await SupplementApi.ship(data.id, currentUser.id, values.expressNo, values.logisticsRemark)
          message.success('已安排发货')
          break
        }
        case 'complete': {
          const values = await form.validateFields()
          await SupplementApi.complete(data.id, currentUser.id, values.remark)
          message.success('已完成')
          break
        }
        case 'reschedule': {
          const values = await form.validateFields()
          await SupplementApi.reschedule(
            data.id,
            currentUser.id,
            values.newDate.format('YYYY-MM-DD'),
            values.remark
          )
          message.success('已改期')
          break
        }
        case 'supplement': {
          const values = await form.validateFields()
          const tiles = values.tiles?.map((t: any) => ({
            sku: t.sku,
            name: t.name,
            spec: t.spec,
            color: t.color,
            unit: t.unit,
            quantity: t.quantity,
            unitPrice: t.unitPrice,
            remark: t.remark,
          })) as TileItem[]
          const changes = values.changes?.split('\n').filter(Boolean).map((line: string) => {
            const [field, rest] = line.split(':')
            const [oldValue, newValue] = (rest || '').split('→')
            return { field: field?.trim() || '', oldValue: oldValue?.trim() || '', newValue: newValue?.trim() || '' }
          })
          await SupplementApi.supplement(data.id, currentUser.id, {
            remark: values.remark,
            tiles,
            expectedDeliveryDate: values.expectedDeliveryDate?.format('YYYY-MM-DD'),
            changes,
          })
          message.success('已补录信息')
          break
        }
      }
      setActionType(null)
      fetchDetail()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error(e?.message || '操作失败')
    }
  }

  const handleExport = async () => {
    if (!data) return
    try {
      const res = await SupplementApi.exportDetail(data.id)
      message.success(`已生成：${res.fileName}`)
    } catch {
      message.error('导出失败')
    }
  }

  const tileColumns: ColumnsType<TileItem> = [
    { title: 'SKU', dataIndex: 'sku', width: 120 },
    { title: '名称', dataIndex: 'name', width: 180 },
    { title: '规格', dataIndex: 'spec', width: 120 },
    { title: '颜色', dataIndex: 'color', width: 100 },
    { title: '单位', dataIndex: 'unit', width: 70, align: 'center' },
    { title: '数量', dataIndex: 'quantity', width: 90, align: 'right' },
    { title: '单价', dataIndex: 'unitPrice', width: 110, align: 'right', render: v => `¥${v.toLocaleString()}` },
    { title: '小计', width: 120, align: 'right', render: (_, r) => <span style={{ color: '#cf1322', fontWeight: 500 }}>¥{(r.quantity * r.unitPrice).toLocaleString()}</span> },
    { title: '备注', dataIndex: 'remark' },
  ]

  const can = canActionByRole()

  const actionTitleMap: Record<string, string> = {
    submit: '提交设计师复核',
    startDesign: '开始量房复核',
    confirmDesign: '设计师确认',
    reject: '驳回申请',
    startWarehouse: '开始备货',
    ship: '安排发货',
    complete: '客户签收完成',
    reschedule: '改期送达',
    supplement: '补录信息',
  }

  if (loading && !data) {
    return <div style={{ padding: 24 }}>加载中...</div>
  }
  if (!data) {
    return (
      <div style={{ padding: 48 }}>
        <Empty description="未找到该补砖申请" />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button onClick={() => navigate('/supplements')}>返回列表</Button>
        </div>
      </div>
    )
  }

  const statusCfg = SUPPLEMENT_STATUS_MAP[data.status]

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/supplements')}>返回</Button>
          <h2 className="page-title" style={{ margin: 0 }}>
            补砖申请详情
            <Tag color={statusCfg.color} style={{ marginLeft: 12 }}>{statusCfg.label}</Tag>
          </h2>
        </Space>
        <Space>
          <Button icon={<ExportOutlined />} onClick={handleExport}>导出详情</Button>
          {can.submit && (
            <Popconfirm
              title="确认提交设计师复核？"
              onConfirm={() => {
                setActionType('submit')
                setTimeout(() => doAction(), 0)
              }}
            >
              <Button type="primary" icon={<SendOutlined />}>提交</Button>
            </Popconfirm>
          )}
          {can.startDesign && (
            <Button type="primary" icon={<EditOutlined />} onClick={() => openAction('startDesign')}>开始量房</Button>
          )}
          {can.confirmDesign && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => openAction('confirmDesign')}>设计师确认</Button>
          )}
          {(can.rejectDesign || can.rejectWarehouse) && (
            <Button danger icon={<CloseCircleOutlined />} onClick={() => openAction('reject')}>驳回</Button>
          )}
          {can.startWarehouse && (
            <Popconfirm
              title="确认开始备货？"
              onConfirm={() => {
                setActionType('startWarehouse')
                setTimeout(() => doAction(), 0)
              }}
            >
              <Button type="primary" icon={<InboxOutlined />}>开始备货</Button>
            </Popconfirm>
          )}
          {can.ship && (
            <Button type="primary" icon={<RocketOutlined />} onClick={() => openAction('ship')}>安排发货</Button>
          )}
          {can.complete && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => openAction('complete')}>签收完成</Button>
          )}
          {can.reschedule && (
            <Button icon={<CalendarOutlined />} onClick={() => openAction('reschedule')}>改期</Button>
          )}
          {can.supplement && (
            <Button type="primary" icon={<EditOutlined />} onClick={() => openAction('supplement')}>补录信息</Button>
          )}
        </Space>
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card className="detail-card" bordered={false}>
            <h3 className="detail-section-title">基本信息</h3>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="补砖单号" span={1}>
                <span style={{ fontWeight: 600 }}>{data.id}</span>
              </Descriptions.Item>
              <Descriptions.Item label="销售单号">{data.orderNo}</Descriptions.Item>
              <Descriptions.Item label="客户姓名">{data.customerName}</Descriptions.Item>
              <Descriptions.Item label="客户电话">{data.customerPhone}</Descriptions.Item>
              <Descriptions.Item label="送货地址" span={2}>{data.address}</Descriptions.Item>
              {data.projectName && (
                <Descriptions.Item label="项目名称" span={2}>{data.projectName}</Descriptions.Item>
              )}
              <Descriptions.Item label="来源">
                <Space>
                  <Tag color="geekblue">{data.sourceLabel}</Tag>
                  {data.sourceRefNo && <span style={{ color: '#666' }}>编号: {data.sourceRefNo}</span>}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusCfg.color}>{statusCfg.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="导购">{data.guideName}</Descriptions.Item>
              <Descriptions.Item label="设计师">{data.designerName || '-'}</Descriptions.Item>
              <Descriptions.Item label="期望送达">{data.expectedDeliveryDate}</Descriptions.Item>
              <Descriptions.Item label="实际送达">{data.actualDeliveryDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={1}>
                {dayjs(data.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="补砖原因" span={2}>
                <div style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{data.reason}</div>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card className="detail-card" bordered={false} style={{ marginTop: 16 }}>
            <h3 className="detail-section-title">
              瓷砖明细
              <span style={{ float: 'right', fontSize: 14, fontWeight: 400, color: '#666' }}>
                合计：<span className="amount-highlight">¥{data.totalAmount.toLocaleString()}</span>
                <span style={{ marginLeft: 16 }}>共 {data.tiles.reduce((s, t) => s + t.quantity, 0)} {data.tiles[0]?.unit || '件'}</span>
              </span>
            </h3>
            <Table
              rowKey="sku"
              columns={tileColumns}
              dataSource={data.tiles}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="detail-card" bordered={false}>
            <h3 className="detail-section-title">
              <FileTextOutlined style={{ marginRight: 8 }} />
              流转记录
              <span style={{ float: 'right', fontSize: 13, fontWeight: 400, color: '#999' }}>
                共 {history.length} 条
              </span>
            </h3>
            {history.length === 0 ? (
              <Empty description="暂无历史记录" style={{ padding: '24px 0' }} />
            ) : (
              <Timeline
                style={{ paddingLeft: 8 }}
                items={history.map(h => {
                  const dotColor =
                    h.action === 'reject' ? 'red' :
                    h.action === 'complete' || h.action === 'refund' ? 'green' :
                    h.action === 'supplement' ? 'magenta' :
                    h.action === 'reschedule' ? 'purple' :
                    h.action === 'create' ? 'blue' :
                    'blue'
                  return {
                    color: dotColor as any,
                    children: (
                      <div style={{ paddingBottom: 8 }}>
                        <Space align="start" style={{ width: '100%' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontWeight: 500 }}>{h.actionLabel}</span>
                              {h.fromStatus && h.toStatus && (
                                <Space size={4}>
                                  <Tag color="default" style={{ padding: '0 4px', fontSize: 11 }}>
                                    {SUPPLEMENT_STATUS_MAP[h.fromStatus as keyof typeof SUPPLEMENT_STATUS_MAP]?.label || h.fromStatus}
                                  </Tag>
                                  <span style={{ color: '#999' }}>→</span>
                                  <Tag color={SUPPLEMENT_STATUS_MAP[h.toStatus as keyof typeof SUPPLEMENT_STATUS_MAP]?.color || 'default'} style={{ padding: '0 4px', fontSize: 11 }}>
                                    {SUPPLEMENT_STATUS_MAP[h.toStatus as keyof typeof SUPPLEMENT_STATUS_MAP]?.label || h.toStatus}
                                  </Tag>
                                </Space>
                              )}
                            </div>
                            <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
                              <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 6, transform: 'scale(0.85)' }} />
                              {h.operatorName}
                              <Tag color={
                                h.operatorRole === 'guide' ? 'blue' :
                                h.operatorRole === 'designer' ? 'purple' : 'orange'
                              } style={{ margin: '0 4px', fontSize: 11, padding: '0 4px' }}>
                                {h.operatorRoleName}
                              </Tag>
                              <span style={{ color: '#999' }}>
                                {dayjs(h.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                              </span>
                            </div>
                            {h.remark && (
                              <div style={{ background: '#fafafa', padding: '8px 12px', borderRadius: 4, marginTop: 6, fontSize: 13, lineHeight: 1.7 }}>
                                {h.remark}
                              </div>
                            )}
                            {h.changes && h.changes.length > 0 && (
                              <div style={{ marginTop: 6 }}>
                                <Divider style={{ margin: '8px 0' }} />
                                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>变更内容：</div>
                                {h.changes.map((c, i) => (
                                  <div key={i} style={{ fontSize: 12, color: '#555', padding: '2px 0' }}>
                                    <span style={{ color: '#1677ff' }}>{c.field}：</span>
                                    <Tooltip title="旧值">
                                      <span style={{ textDecoration: 'line-through', color: '#999' }}>{c.oldValue || '(空)'}</span>
                                    </Tooltip>
                                    <span style={{ margin: '0 4px' }}>→</span>
                                    <Tooltip title="新值">
                                      <span style={{ color: '#52c41a', fontWeight: 500 }}>{c.newValue || '(空)'}</span>
                                    </Tooltip>
                                  </div>
                                ))}
                              </div>
                            )}
                            {h.attachments && h.attachments.length > 0 && (
                              <div style={{ marginTop: 6 }}>
                                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>附件：</div>
                                <Space wrap>
                                  {h.attachments.map((a, i) => (
                                    <Tag key={i} icon={<FileTextOutlined />} color="cyan" style={{ cursor: 'pointer' }}>
                                      {a.name}
                                    </Tag>
                                  ))}
                                </Space>
                              </div>
                            )}
                          </div>
                        </Space>
                      </div>
                    ),
                  }
                })}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={actionType ? actionTitleMap[actionType] : ''}
        open={!!actionType && actionType !== 'submit' && actionType !== 'startWarehouse'}
        onCancel={() => setActionType(null)}
        onOk={doAction}
        okText="确认"
        okButtonProps={actionType === 'reject' ? { danger: true } : { type: 'primary' }}
        destroyOnHidden
        width={actionType === 'supplement' ? 720 : 520}
      >
        <Form form={form} layout="vertical">
          {(actionType === 'startDesign' || actionType === 'confirmDesign' || actionType === 'complete') && (
            <Form.Item name="remark" label={actionType === 'complete' ? '签收说明' : '备注'}>
              <TextArea rows={3} placeholder="请填写备注说明" />
            </Form.Item>
          )}
          {actionType === 'reject' && (
            <Form.Item name="reason" label="驳回原因" rules={[{ required: true, message: '请填写驳回原因' }]}>
              <TextArea rows={4} placeholder="请详细说明驳回原因" />
            </Form.Item>
          )}
          {actionType === 'ship' && (
            <>
              <Form.Item name="expressNo" label="物流单号" rules={[{ required: true }]}>
                <Input placeholder="请输入物流单号" />
              </Form.Item>
              <Form.Item name="logisticsRemark" label="物流备注">
                <TextArea rows={2} placeholder="填写司机、预计到达时间等" />
              </Form.Item>
            </>
          )}
          {actionType === 'reschedule' && (
            <>
              <Form.Item name="newDate" label="新的送达日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
              </Form.Item>
              <Form.Item name="remark" label="改期说明" rules={[{ required: true }]}>
                <TextArea rows={3} placeholder="说明改期原因" />
              </Form.Item>
            </>
          )}
          {actionType === 'supplement' && (
            <>
              <Form.Item label="瓷砖明细">
                <Form.List name="tiles">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline" wrap>
                          <Form.Item {...restField} name={[name, 'sku']} rules={[{ required: true, message: '缺SKU' }]}>
                            <Input placeholder="SKU" style={{ width: 110 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true }]}>
                            <Input placeholder="名称" style={{ width: 150 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'spec']}>
                            <Input placeholder="规格" style={{ width: 110 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'color']}>
                            <Input placeholder="颜色" style={{ width: 90 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'unit']}>
                            <Input placeholder="单位" style={{ width: 70 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true }]}>
                            <InputNumber placeholder="数量" min={0} style={{ width: 90 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'unitPrice']} rules={[{ required: true }]}>
                            <InputNumber placeholder="单价" min={0} style={{ width: 90 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'remark']}>
                            <Input placeholder="备注" style={{ width: 110 }} />
                          </Form.Item>
                          <MinusCircleOutlined onClick={() => remove(name)} />
                        </Space>
                      ))}
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        添加瓷砖
                      </Button>
                    </>
                  )}
                </Form.List>
              </Form.Item>
              <Form.Item name="expectedDeliveryDate" label="更新期望送达日期">
                <DatePicker style={{ width: '100%' }} placeholder="可选" />
              </Form.Item>
              <Form.Item name="changes" label="变更摘要（每行一条，格式：字段名:旧值→新值）">
                <TextArea rows={3} placeholder={'SKU: TL-004A→TL-004\n数量: 10箱→12箱'} />
              </Form.Item>
              <Form.Item name="remark" label="补录说明" rules={[{ required: true }]}>
                <TextArea rows={3} placeholder="请详细说明补录内容" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}
