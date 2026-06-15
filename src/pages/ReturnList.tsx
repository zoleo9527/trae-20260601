import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  Button,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Space,
  Tag,
  Modal,
  Form,
  DatePicker as AntDatePicker,
  message,
  Popconfirm,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  EditOutlined,
  DollarOutlined,
  AppstoreOutlined,
  InboxOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCurrentUser } from '@/layouts/MainLayout'
import { ReturnApi } from '@/api/return'
import {
  RETURN_STATUS_MAP,
  type ReturnReview,
  type ReturnStatus,
  type ReturnListQuery,
  type TileItem,
  type Role,
} from '@/types'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

export default function ReturnList() {
  const navigate = useNavigate()
  const { currentUser } = useCurrentUser()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ReturnReview[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })

  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<ReturnStatus | undefined>()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [inspectId, setInspectId] = useState<string | null>(null)
  const [inspectForm] = Form.useForm()
  const [passId, setPassId] = useState<string | null>(null)
  const [passForm] = Form.useForm()
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectForm] = Form.useForm()
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [rescheduleForm] = Form.useForm()
  const [refundId, setRefundId] = useState<string | null>(null)
  const [refundForm] = Form.useForm()
  const [createForm] = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const query: ReturnListQuery = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword: keyword || undefined,
        status,
        dateFrom: dateRange?.[0]?.format('YYYY-MM-DD'),
        dateTo: dateRange?.[1]?.format('YYYY-MM-DD'),
      }
      const res = await ReturnApi.list(query)
      setData(res.list)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [pagination, keyword, status, dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => setPagination(p => ({ ...p, page: 1 }))
  const handleReset = () => {
    setKeyword('')
    setStatus(undefined)
    setDateRange(null)
    setPagination({ page: 1, pageSize: 10 })
  }

  const handleExport = async () => {
    const query = {
      keyword: keyword || undefined,
      status,
      dateFrom: dateRange?.[0]?.format('YYYY-MM-DD'),
      dateTo: dateRange?.[1]?.format('YYYY-MM-DD'),
    }
    try {
      const res = await ReturnApi.exportList(query)
      message.success(`已生成导出文件：${res.fileName}，共 ${res.recordCount} 条记录`)
    } catch {
      message.error('导出失败')
    }
  }

  const handleInspect = async () => {
    try {
      const values = await inspectForm.validateFields()
      await ReturnApi.inspect(inspectId!, currentUser.id, {
        remark: values.remark,
        warehouseId: currentUser.role === 'warehouse' ? currentUser.id : undefined,
      })
      message.success('已启动验货')
      setInspectId(null)
      inspectForm.resetFields()
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  const handlePass = async () => {
    try {
      const values = await passForm.validateFields()
      await ReturnApi.pass(passId!, currentUser.id, {
        remark: values.remark,
        inspectionResult: values.inspectionResult,
        changes: [{ field: '验货结果', oldValue: '', newValue: values.inspectionResult || '通过' }],
      })
      message.success('复核通过')
      setPassId(null)
      passForm.resetFields()
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  const handleReject = async () => {
    try {
      const values = await rejectForm.validateFields()
      await ReturnApi.reject(rejectId!, currentUser.id, values.reason)
      message.success('已驳回')
      setRejectId(null)
      rejectForm.resetFields()
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  const handleReschedule = async () => {
    try {
      const values = await rescheduleForm.validateFields()
      await ReturnApi.reschedule(
        rescheduleId!,
        currentUser.id,
        values.newDate.format('YYYY-MM-DD'),
        values.remark
      )
      message.success('已改期')
      setRescheduleId(null)
      rescheduleForm.resetFields()
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  const handleRefund = async () => {
    try {
      const values = await refundForm.validateFields()
      const changes = [{ field: '退款金额', oldValue: '', newValue: `¥${values.refundAmount?.toLocaleString() || 0}` }]
      await ReturnApi.refund(refundId!, currentUser.id, {
        remark: values.remark,
        changes,
      })
      message.success('退款完成')
      setRefundId(null)
      refundForm.resetFields()
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields()
      const tiles: TileItem[] = values.tiles?.map((t: any) => ({
        sku: t.sku,
        name: t.name,
        spec: t.spec,
        color: t.color,
        unit: t.unit,
        quantity: t.quantity,
        unitPrice: t.unitPrice,
        remark: t.remark,
      })) || []
      const created = await ReturnApi.create({
        orderNo: values.orderNo,
        supplementId: values.supplementId,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        address: values.address,
        applicantId: currentUser.id,
        reason: values.reason,
        tiles,
        pickupDate: values.pickupDate.format('YYYY-MM-DD'),
      })
      message.success('创建成功，已跳转到详情页')
      setCreateOpen(false)
      createForm.resetFields()
      fetchData()
      setTimeout(() => navigate(`/returns/${created.id}`), 300)
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('创建失败')
    }
  }

  const canActionByRole = (record: ReturnReview): Record<string, boolean> => {
    const role: Role = currentUser.role
    const s = record.status
    return {
      inspect: role === 'warehouse' && ['pending', 'supplemented', 'rescheduled'].includes(s),
      pass: role === 'warehouse' && ['inspecting', 'supplemented', 'rescheduled'].includes(s),
      reject: role === 'warehouse' && ['inspecting', 'pending', 'supplemented', 'rescheduled'].includes(s),
      refund: role === 'guide' && ['confirmed'].includes(s),
      reschedule: role === 'guide' && !['refunded', 'rejected'].includes(s),
      supplement: role === 'guide' && ['rejected'].includes(s),
    }
  }

  const columns: ColumnsType<ReturnReview> = [
    {
      title: '退货单号',
      dataIndex: 'id',
      width: 160,
      fixed: 'left',
      render: v => <a onClick={() => navigate(`/returns/${v}`)} style={{ fontWeight: 500 }}>{v}</a>,
    },
    {
      title: '关联单号',
      width: 170,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 12 }}>销售: {r.orderNo}</span>
          {r.supplementId && (
            <a
              style={{ fontSize: 12, color: '#1677ff' }}
              onClick={() => navigate(`/supplements/${r.supplementId}`)}
            >
              补砖: {r.supplementId}
            </a>
          )}
        </Space>
      ),
    },
    {
      title: '客户信息',
      width: 200,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <span>{r.customerName}</span>
          <span style={{ color: '#999', fontSize: 12 }}>{r.customerPhone}</span>
        </Space>
      ),
    },
    {
      title: '退货原因',
      dataIndex: 'reason',
      width: 180,
      ellipsis: true,
    },
    {
      title: '退货数量',
      width: 100,
      align: 'center',
      render: (_, r) => r.tiles.reduce((s, t) => s + t.quantity, 0),
    },
    {
      title: '退款金额',
      dataIndex: 'totalAmount',
      width: 120,
      align: 'right',
      render: v => <span className="amount-highlight">¥{v.toLocaleString()}</span>,
    },
    {
      title: '预约取货',
      dataIndex: 'pickupDate',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: v => {
        const cfg = RETURN_STATUS_MAP[v as ReturnStatus]
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '申请人',
      dataIndex: 'applicantName',
      width: 90,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: v => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right',
      render: (_, record) => {
        const can = canActionByRole(record)
        const btns: JSX.Element[] = [
          <Tooltip key="view" title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/returns/${record.id}`)}
            >
              详情
            </Button>
          </Tooltip>,
        ]
        if (can.inspect) {
          btns.push(
            <Button
              key="inspect"
              type="link"
              size="small"
              icon={<InboxOutlined />}
              onClick={() => { setInspectId(record.id); inspectForm.resetFields() }}
            >
              验货
            </Button>
          )
        }
        if (can.pass) {
          btns.push(
            <Button
              key="pass"
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => { setPassId(record.id); passForm.resetFields() }}
            >
              通过
            </Button>
          )
        }
        if (can.reject) {
          btns.push(
            <Button
              key="reject"
              type="link"
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => { setRejectId(record.id); rejectForm.resetFields() }}
            >
              驳回
            </Button>
          )
        }
        if (can.refund) {
          btns.push(
            <Button
              key="refund"
              type="link"
              size="small"
              icon={<DollarOutlined />}
              onClick={() => { setRefundId(record.id); refundForm.resetFields() }}
            >
              退款
            </Button>
          )
        }
        if (can.reschedule) {
          btns.push(
            <Button
              key="reschedule"
              type="link"
              size="small"
              icon={<CalendarOutlined />}
              onClick={() => { setRescheduleId(record.id); rescheduleForm.resetFields() }}
            >
              改期
            </Button>
          )
        }
        if (can.supplement) {
          btns.push(
            <Button
              key="supplement"
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/returns/${record.id}`)}
            >
              补录
            </Button>
          )
        }
        return <Space wrap size={0}>{btns}</Space>
      },
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">退货复核</h2>
        <Space>
          <Button icon={<ExportOutlined />} onClick={handleExport}>导出清单</Button>
          {currentUser.role === 'guide' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              新建退货申请
            </Button>
          )}
        </Space>
      </div>

      <div className="filter-bar">
        <Space wrap>
          <Input
            placeholder="搜索单号/客户名/电话"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            style={{ width: 240 }}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="状态筛选"
            allowClear
            value={status}
            onChange={v => setStatus(v)}
            style={{ width: 160 }}
          >
            {(Object.entries(RETURN_STATUS_MAP) as Array<[ReturnStatus, { label: string; color: string }]>).map(([k, v]) => (
              <Option key={k} value={k}>{v.label}</Option>
            ))}
          </Select>
          <RangePicker
            value={dateRange as any}
            onChange={v => setDateRange(v as any)}
            placeholder={['开始日期', '结束日期']}
          />
          <Button type="primary" onClick={handleSearch}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <div className="table-card">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1700 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: t => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ page, pageSize }),
          }}
        />
      </div>

      <Modal
        title="新建退货申请"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okText="创建"
        width={720}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="orderNo" label="关联销售单号" rules={[{ required: true }]}>
            <Input placeholder="请输入销售单号" />
          </Form.Item>
          <Form.Item name="supplementId" label="关联补砖单号（可选）">
            <Input placeholder="如与补砖相关请填写补砖单号，便于追溯" prefix={<AppstoreOutlined />} />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="customerName" label="客户姓名" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="客户姓名" />
            </Form.Item>
            <Form.Item name="customerPhone" label="客户电话" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="客户电话" />
            </Form.Item>
          </Space>
          <Form.Item name="address" label="取货地址" rules={[{ required: true }]}>
            <Input placeholder="详细地址" />
          </Form.Item>
          <Form.Item name="pickupDate" label="预约取货日期" rules={[{ required: true }]}>
            <AntDatePicker style={{ width: '100%' }} placeholder="选择日期" />
          </Form.Item>
          <Form.Item name="reason" label="退货原因" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="说明退货原因" />
          </Form.Item>
          <Form.Item label="退货明细（可创建后在详情页继续补充）">
            <Form.List name="tiles">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline" wrap>
                      <Form.Item {...restField} name={[name, 'sku']} rules={[{ required: true, message: 'SKU' }]}>
                        <Input placeholder="SKU" style={{ width: 110 }} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: '名称' }]}>
                        <Input placeholder="名称" style={{ width: 140 }} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'spec']}>
                        <Input placeholder="规格" style={{ width: 100 }} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'color']}>
                        <Input placeholder="颜色" style={{ width: 80 }} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'unit']}>
                        <Input placeholder="单位" style={{ width: 65 }} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: '数量' }]}>
                        <InputNumber placeholder="数量" min={0} style={{ width: 85 }} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'unitPrice']} rules={[{ required: true, message: '单价' }]}>
                        <InputNumber placeholder="单价" min={0} style={{ width: 85 }} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'remark']}>
                        <Input placeholder="备注" style={{ width: 90 }} />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加退货明细
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="启动仓库验货"
        open={!!inspectId}
        onCancel={() => { setInspectId(null); inspectForm.resetFields() }}
        onOk={handleInspect}
        okText="确认验货"
        destroyOnClose
      >
        <Form form={inspectForm} layout="vertical">
          <Form.Item name="remark" label="验货备注">
            <TextArea rows={3} placeholder="填写验货安排说明，如上门时间等" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="复核通过"
        open={!!passId}
        onCancel={() => { setPassId(null); passForm.resetFields() }}
        onOk={handlePass}
        okText="确认通过"
        destroyOnClose
      >
        <Form form={passForm} layout="vertical">
          <Form.Item name="inspectionResult" label="验货结果" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="详细描述验货情况，如包装是否完好、数量是否一致等" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="复核驳回"
        open={!!rejectId}
        onCancel={() => { setRejectId(null); rejectForm.resetFields() }}
        onOk={handleReject}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="reason" label="驳回原因" rules={[{ required: true, message: '请填写驳回原因' }]}>
            <TextArea rows={4} placeholder="请详细说明驳回原因，如缺少凭证、货物不符等" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="改期取货"
        open={!!rescheduleId}
        onCancel={() => { setRescheduleId(null); rescheduleForm.resetFields() }}
        onOk={handleReschedule}
        okText="确认改期"
        destroyOnClose
      >
        <Form form={rescheduleForm} layout="vertical">
          <Form.Item name="newDate" label="新的取货日期" rules={[{ required: true }]}>
            <AntDatePicker style={{ width: '100%' }} placeholder="选择日期" />
          </Form.Item>
          <Form.Item name="remark" label="改期说明" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="说明改期原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="完成退款"
        open={!!refundId}
        onCancel={() => { setRefundId(null); refundForm.resetFields() }}
        onOk={handleRefund}
        okText="确认退款"
        destroyOnClose
      >
        <Form form={refundForm} layout="vertical">
          <Form.Item
            name="refundAmount"
            label="退款金额（元）"
            rules={[{ required: true, message: '请填写退款金额' }]}
          >
            <Input
              style={{ width: '100%' }}
              prefix="¥"
              placeholder="填写实际退款金额"
            />
          </Form.Item>
          <Form.Item name="remark" label="退款备注" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="填写退款方式、到账时间说明等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
