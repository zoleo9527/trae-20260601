import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Modal,
  Form,
  InputNumber,
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
  SendOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  RocketOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCurrentUser } from '@/layouts/MainLayout'
import { SupplementService } from '@/services/supplementService'
import {
  SUPPLEMENT_STATUS_MAP,
  type SupplementApplication,
  type SupplementStatus,
  type SupplementListQuery,
  type TileItem,
  type Role,
} from '@/types'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

export default function SupplementList() {
  const navigate = useNavigate()
  const { currentUser } = useCurrentUser()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SupplementApplication[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })

  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<SupplementStatus | undefined>()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [submitId, setSubmitId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectForm] = Form.useForm()
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [rescheduleForm] = Form.useForm()
  const [confirmForm] = Form.useForm()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [shipId, setShipId] = useState<string | null>(null)
  const [shipForm] = Form.useForm()
  const [createForm] = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const query: SupplementListQuery = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword: keyword || undefined,
        status,
        dateFrom: dateRange?.[0]?.format('YYYY-MM-DD'),
        dateTo: dateRange?.[1]?.format('YYYY-MM-DD'),
      }
      const res = await SupplementService.list(query)
      setData(res.list)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [pagination, keyword, status, dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    setPagination(p => ({ ...p, page: 1 }))
  }

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
      const res = await SupplementService.exportList(query)
      message.success(`已生成导出文件：${res.fileName}，共 ${res.recordCount} 条记录`)
    } catch (e) {
      message.error('导出失败')
    }
  }

  const handleSubmit = async (id: string) => {
    try {
      await SupplementService.submit(id, currentUser.id)
      message.success('已提交设计师复核')
      setSubmitId(null)
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  const handleStartDesign = async (id: string) => {
    try {
      await SupplementService.startDesign(id, currentUser.id)
      message.success('已开始量房复核')
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  const handleConfirmDesign = async () => {
    try {
      const values = await confirmForm.validateFields()
      await SupplementService.confirmDesign(confirmId!, currentUser.id, {
        remark: values.remark,
      })
      message.success('设计师确认无误')
      setConfirmId(null)
      confirmForm.resetFields()
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  const handleReject = async () => {
    try {
      const values = await rejectForm.validateFields()
      await SupplementService.reject(rejectId!, currentUser.id, values.reason)
      message.success('已驳回')
      setRejectId(null)
      rejectForm.resetFields()
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  const handleStartWarehouse = async (id: string) => {
    try {
      await SupplementService.startWarehouse(id, currentUser.id)
      message.success('已开始备货')
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  const handleShip = async () => {
    try {
      const values = await shipForm.validateFields()
      await SupplementService.ship(shipId!, currentUser.id, values.logisticsRemark)
      message.success('已安排发货')
      setShipId(null)
      shipForm.resetFields()
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  const handleComplete = async (id: string) => {
    try {
      await SupplementService.complete(id, currentUser.id, '客户签收确认')
      message.success('已完成')
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  const handleReschedule = async () => {
    try {
      const values = await rescheduleForm.validateFields()
      await SupplementService.reschedule(
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

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields()
      const tiles: TileItem[] = values.tiles || []
      await SupplementService.create({
        orderNo: values.orderNo,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        address: values.address,
        projectName: values.projectName,
        guideId: currentUser.id,
        source: values.source,
        sourceRefNo: values.sourceRefNo,
        reason: values.reason,
        tiles,
        expectedDeliveryDate: values.expectedDeliveryDate.format('YYYY-MM-DD'),
      })
      message.success('创建成功')
      setCreateOpen(false)
      createForm.resetFields()
      fetchData()
    } catch {
      message.error('创建失败')
    }
  }

  const canActionByRole = (record: SupplementApplication): Record<string, boolean> => {
    const role: Role = currentUser.role
    const s = record.status
    return {
      submit: role === 'guide' && s === 'pending',
      startDesign: role === 'designer' && (s === 'designing' || s === 'pending' || s === 'supplemented'),
      confirmDesign: role === 'designer' && (s === 'designing' || s === 'supplemented'),
      rejectDesign: role === 'designer' && (s === 'designing' || s === 'supplemented'),
      rejectWarehouse: role === 'warehouse' && (s === 'confirmed' || s === 'warehousing'),
      startWarehouse: role === 'warehouse' && s === 'confirmed',
      ship: role === 'warehouse' && s === 'warehousing',
      complete: role === 'guide' && s === 'shipped',
      reschedule: (role === 'guide') && !['completed', 'rejected'].includes(s),
      supplement: role === 'guide' && s === 'rejected',
    }
  }

  const columns: ColumnsType<SupplementApplication> = [
    {
      title: '补砖单号',
      dataIndex: 'id',
      width: 160,
      fixed: 'left',
      render: v => <a onClick={() => navigate(`/supplements/${v}`)} style={{ fontWeight: 500 }}>{v}</a>,
    },
    {
      title: '销售单号',
      dataIndex: 'orderNo',
      width: 140,
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
      title: '来源',
      dataIndex: 'sourceLabel',
      width: 100,
      render: (v, r) => (
        <Space>
          <Tag color="geekblue" className="tag-source">{v}</Tag>
          {r.sourceRefNo && <span style={{ color: '#999', fontSize: 12 }}>{r.sourceRefNo}</span>}
        </Space>
      ),
    },
    {
      title: '瓷砖数量',
      width: 100,
      align: 'center',
      render: (_, r) => r.tiles.reduce((s, t) => s + t.quantity, 0),
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      width: 120,
      align: 'right',
      render: v => <span className="amount-highlight">¥{v.toLocaleString()}</span>,
    },
    {
      title: '期望送达',
      dataIndex: 'expectedDeliveryDate',
      width: 120,
      render: v => v,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: v => {
        const cfg = SUPPLEMENT_STATUS_MAP[v as SupplementStatus]
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
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
      width: 320,
      fixed: 'right',
      render: (_, record) => {
        const can = canActionByRole(record)
        const btns: JSX.Element[] = [
          <Tooltip key="view" title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/supplements/${record.id}`)}
            >
              详情
            </Button>
          </Tooltip>,
        ]
        if (can.submit) {
          btns.push(
            <Popconfirm
              key="submit"
              title="确认提交设计师复核？"
              onConfirm={() => handleSubmit(record.id)}
            >
              <Button type="link" size="small" icon={<SendOutlined />}>提交</Button>
            </Popconfirm>
          )
        }
        if (can.startDesign) {
          btns.push(
            <Button
              key="startDesign"
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleStartDesign(record.id)}
            >
              量房
            </Button>
          )
        }
        if (can.confirmDesign) {
          btns.push(
            <Button
              key="confirm"
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => { setConfirmId(record.id); confirmForm.resetFields() }}
            >
              确认
            </Button>
          )
        }
        if (can.rejectDesign || can.rejectWarehouse) {
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
        if (can.startWarehouse) {
          btns.push(
            <Button
              key="warehouse"
              type="link"
              size="small"
              icon={<InboxOutlined />}
              onClick={() => handleStartWarehouse(record.id)}
            >
              备货
            </Button>
          )
        }
        if (can.ship) {
          btns.push(
            <Button
              key="ship"
              type="link"
              size="small"
              icon={<RocketOutlined />}
              onClick={() => { setShipId(record.id); shipForm.resetFields() }}
            >
              发货
            </Button>
          )
        }
        if (can.complete) {
          btns.push(
            <Popconfirm
              key="complete"
              title="确认客户签收完成？"
              onConfirm={() => handleComplete(record.id)}
            >
              <Button type="link" size="small" icon={<CheckCircleOutlined />}>完成</Button>
            </Popconfirm>
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
              onClick={() => navigate(`/supplements/${record.id}`)}
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
        <h2 className="page-title">补砖申请</h2>
        <Space>
          <Button icon={<ExportOutlined />} onClick={handleExport}>导出清单</Button>
          {currentUser.role === 'guide' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              新建补砖申请
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
            {(Object.entries(SUPPLEMENT_STATUS_MAP) as Array<[SupplementStatus, { label: string; color: string }]>).map(([k, v]) => (
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
          scroll={{ x: 1600 }}
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
        title="新建补砖申请"
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
          <Space style={{ width: '100%' }}>
            <Form.Item name="customerName" label="客户姓名" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="客户姓名" />
            </Form.Item>
            <Form.Item name="customerPhone" label="客户电话" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="客户电话" />
            </Form.Item>
          </Space>
          <Form.Item name="address" label="送货地址" rules={[{ required: true }]}>
            <Input placeholder="详细地址" />
          </Form.Item>
          <Form.Item name="projectName" label="项目名称">
            <Input placeholder="可选" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="source" label="来源" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select placeholder="选择来源">
                <Option value="sample_book">样板册</Option>
                <Option value="measurement_sheet">量房单</Option>
                <Option value="replenish_form">补货申请单</Option>
                <Option value="other">其他</Option>
              </Select>
            </Form.Item>
            <Form.Item name="sourceRefNo" label="来源编号" style={{ flex: 1 }}>
              <Input placeholder="可选，关联编号" />
            </Form.Item>
          </Space>
          <Form.Item name="expectedDeliveryDate" label="期望送达日期" rules={[{ required: true }]}>
            <AntDatePicker style={{ width: '100%' }} placeholder="选择日期" />
          </Form.Item>
          <Form.Item name="reason" label="补砖原因" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="说明补砖原因" />
          </Form.Item>
          <div style={{ color: '#999', fontSize: 12 }}>
            注：瓷砖明细可在创建后在详情页录入，或直接联系设计师。
          </div>
        </Form>
      </Modal>

      <Modal
        title="设计师确认"
        open={!!confirmId}
        onCancel={() => { setConfirmId(null); confirmForm.resetFields() }}
        onOk={handleConfirmDesign}
        okText="确认无误"
        destroyOnClose
      >
        <Form form={confirmForm} layout="vertical">
          <Form.Item name="remark" label="复核备注">
            <TextArea rows={3} placeholder="可填写复核说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="驳回申请"
        open={!!rejectId}
        onCancel={() => { setRejectId(null); rejectForm.resetFields() }}
        onOk={handleReject}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="reason" label="驳回原因" rules={[{ required: true, message: '请填写驳回原因' }]}>
            <TextArea rows={4} placeholder="请详细说明驳回原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="改期送达"
        open={!!rescheduleId}
        onCancel={() => { setRescheduleId(null); rescheduleForm.resetFields() }}
        onOk={handleReschedule}
        okText="确认改期"
        destroyOnClose
      >
        <Form form={rescheduleForm} layout="vertical">
          <Form.Item name="newDate" label="新的送达日期" rules={[{ required: true }]}>
            <AntDatePicker style={{ width: '100%' }} placeholder="选择日期" />
          </Form.Item>
          <Form.Item name="remark" label="改期说明" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="说明改期原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="安排发货"
        open={!!shipId}
        onCancel={() => { setShipId(null); shipForm.resetFields() }}
        onOk={handleShip}
        okText="确认发货"
        destroyOnClose
      >
        <Form form={shipForm} layout="vertical">
          <Form.Item name="logisticsRemark" label="物流信息">
            <TextArea rows={3} placeholder="填写物流单号、司机、预计到达时间等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
