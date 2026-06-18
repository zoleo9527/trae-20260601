import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Layout, Tabs, Table, Button, Space, Modal, Form, Select, DatePicker, App, Card, Tag, Spin, Input, Row, Col, Timeline } from "antd"
import { ScheduleOutlined, LogoutOutlined, TeamOutlined, ExclamationCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, CarOutlined, EyeOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import StatusBadge from "@/components/StatusBadge"
import { useAuthStore } from "@/store/auth"
import type {
  Booking,
  Vehicle,
  VehicleSchedule,
  CrewMember,
  ExceptionRecord,
  BookingStatus,
  ExceptionType,
  ScheduleStatus,
  CrewAssignment,
  TimelineResult,
} from "@/types"
import * as api from "@/services/api"

const { Header, Content } = Layout
const { Option } = Select
const { TextArea } = Input

const statusFilters: { key: BookingStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待派单" },
  { key: "assigned", label: "已派单" },
  { key: "in_progress", label: "进行中" },
  { key: "delayed", label: "已延误" },
  { key: "surcharged", label: "已加价" },
  { key: "completed", label: "已完成" },
]

const scheduleStatusFlow: { status: ScheduleStatus; label: string }[] = [
  { status: "created", label: "待派车" },
  { status: "assigned", label: "已派车" },
  { status: "departed", label: "已出车" },
  { status: "arrived", label: "已到达" },
  { status: "loading", label: "装车中" },
  { status: "moving", label: "运输中" },
  { status: "unloading", label: "卸车中" },
  { status: "done", label: "已完成" },
]

export default function DispatcherDashboard() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { user, logout } = useAuthStore()
  const today = dayjs().format("YYYY-MM-DD")

  const [activeTab, setActiveTab] = useState("bookings")
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all")

  const [bookings, setBookings] = useState<Booking[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [crews, setCrews] = useState<CrewMember[]>([])
  const [schedules, setSchedules] = useState<VehicleSchedule[]>([])
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([])
  const [timeline, setTimeline] = useState<TimelineResult>({ date: "", by_vehicle: {}, items: [] })

  const [scheduleModal, setScheduleModal] = useState(false)
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null)
  const [scheduleForm] = Form.useForm()
  const [submitLoading, setSubmitLoading] = useState(false)

  const [detailModal, setDetailModal] = useState(false)
  const [detailSchedule, setDetailSchedule] = useState<VehicleSchedule | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [triggerModal, setTriggerModal] = useState(false)
  const [triggerForm] = Form.useForm()

  const loadBookings = useCallback(async () => {
    try {
      const res = await api.listBookings({ page_size: 100 })
      setBookings(res.data)
    } catch (err: any) {
      message.error(err.message)
    }
  }, [message])

  const loadVehicles = useCallback(async () => {
    try {
      const res = await api.listVehicles({ page_size: 100 })
      setVehicles(res.data)
    } catch (err: any) {
      message.error(err.message)
    }
  }, [message])

  const loadCrews = useCallback(async () => {
    try {
      const res = await api.listCrews({ page_size: 100 })
      setCrews(res.data)
    } catch (err: any) {
      message.error(err.message)
    }
  }, [message])

  const loadSchedules = useCallback(async () => {
    try {
      const res = await api.listSchedules({ page_size: 100 })
      setSchedules(res.data)
    } catch (err: any) {
      message.error(err.message)
    }
  }, [message])

  const loadExceptions = useCallback(async () => {
    try {
      const res = await api.listExceptions({ page_size: 100 })
      setExceptions(res.data)
    } catch (err: any) {
      message.error(err.message)
    }
  }, [message])

  const loadTimeline = useCallback(async () => {
    try {
      const res = await api.getScheduleTimeline(today)
      setTimeline(res)
    } catch (err: any) {
      message.error(err.message)
    }
  }, [today, message])

  const loadScheduleDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    try {
      const res = await api.getSchedule(id)
      setDetailSchedule(res)
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setDetailLoading(false)
    }
  }, [message])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const [bRes, vRes, cRes, sRes, eRes] = await Promise.all([
          api.listBookings({ page_size: 100 }),
          api.listVehicles({ page_size: 100 }),
          api.listCrews({ page_size: 100 }),
          api.listSchedules({ page_size: 100 }),
          api.listExceptions({ page_size: 100 }),
        ])
        setBookings(bRes.data)
        setVehicles(vRes.data)
        setCrews(cRes.data)
        setSchedules(sRes.data)
        setExceptions(eRes.data)
      } catch (err: any) {
        message.error(err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [message])

  useEffect(() => {
    if (activeTab === "today") {
      loadTimeline()
    }
  }, [activeTab, loadTimeline])

  const idleVehicles = vehicles.filter(v => v.status === "idle")
  const leaders = crews.filter(c => c.position === "组长" && c.status === "active")
  const workers = crews.filter(c => c.position === "搬运工" && c.status === "active")

  const handleScheduleClick = (booking: Booking) => {
    setCurrentBooking(booking)
    scheduleForm.resetFields()
    setScheduleModal(true)
  }

  const handleSubmitSchedule = async () => {
    try {
      const values = await scheduleForm.validateFields()
      setSubmitLoading(true)
      const crew_list = [
        { crew_id: values.leader_id, role: "组长" },
        ...values.worker_ids.map((id: string) => ({ crew_id: id, role: "搬运工" })),
      ]
      await api.createSchedule({
        booking_id: currentBooking!.id,
        vehicle_id: values.vehicle_id,
        planned_start: dayjs(values.planned_start).toISOString(),
        planned_end: dayjs(values.planned_end).toISOString(),
        remarks: values.remarks || "",
        crew_list,
      })
      message.success("排班成功")
      setScheduleModal(false)
      loadBookings()
      loadSchedules()
    } catch (err: any) {
      if (err?.errorFields) return
      message.error(err.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleTriggerException = async () => {
    try {
      const values = await triggerForm.validateFields()
      await api.triggerException(values.booking_id, values.type)
      message.success("异常触发成功")
      setTriggerModal(false)
      triggerForm.resetFields()
      loadExceptions()
    } catch (err: any) {
      if (err?.errorFields) return
      message.error(err.message)
    }
  }

  const handleConfirmException = async (id: string) => {
    if (!user) return
    try {
      await api.handleException(id, {
        status: "confirmed",
        handler_id: user.id,
      })
      message.success("异常已确认")
      loadExceptions()
    } catch (err: any) {
      message.error(err.message)
    }
  }

  const handleRejectException = async (id: string) => {
    if (!user) return
    try {
      await api.handleException(id, {
        status: "rejected",
        handler_id: user.id,
        reject_reason: "需现场核实",
      })
      message.success("异常已退回")
      loadExceptions()
    } catch (err: any) {
      message.error(err.message)
    }
  }

  const handleViewDetail = (schedule: VehicleSchedule) => {
    setDetailSchedule(schedule)
    setDetailModal(true)
    loadScheduleDetail(schedule.id)
  }

  const handleStatusChange = async (scheduleId: string, nextStatus: ScheduleStatus) => {
    try {
      await api.updateScheduleStatus(scheduleId, { status: nextStatus })
      message.success("状态已更新")
      loadSchedules()
    } catch (err: any) {
      message.error(err.message)
    }
  }

  const getCurrentStatusIndex = (s: ScheduleStatus) =>
    scheduleStatusFlow.findIndex(f => f.status === s)

  const filteredBookings =
    statusFilter === "all" ? bookings : bookings.filter(b => b.status === statusFilter)

  const bookingsColumns = [
    { title: "客户", dataIndex: "customer_name", width: 100 },
    { title: "搬出地", dataIndex: "from_address", ellipsis: true },
    { title: "搬入地", dataIndex: "to_address", ellipsis: true },
    {
      title: "时间",
      width: 160,
      render: (_: any, r: Booking) => r.move_date + " " + r.move_time,
    },
    {
      title: "基础价",
      dataIndex: "base_price",
      width: 100,
      render: (v: number) => "¥" + v,
    },
    {
      title: "总价",
      width: 120,
      render: (_: any, r: Booking) => (
        <Space>
          <span>¥{r.total_price}</span>
          {r.extra_price !== 0 && <Tag color="blue">加价</Tag>}
        </Space>
      ),
    },
    {
      title: "状态",
      width: 100,
      dataIndex: "status",
      render: (s: BookingStatus) => <StatusBadge type="booking" value={s} />,
    },
    {
      title: "操作",
      width: 120,
      key: "action",
      render: (_: any, r: Booking) => (
        <Button
          size="small"
          type="primary"
          icon={<ScheduleOutlined />}
          disabled={r.status !== "pending"}
          onClick={() => handleScheduleClick(r)}
        >
          一键排班
        </Button>
      ),
    },
  ]

  const scheduleColumns = [
    {
      title: "车牌",
      width: 120,
      render: (_: any, r: VehicleSchedule) => r.vehicle?.plate_number || "-",
    },
    {
      title: "车型",
      width: 100,
      render: (_: any, r: VehicleSchedule) => r.vehicle?.vehicle_type || "-",
    },
    {
      title: "客户",
      width: 100,
      render: (_: any, r: VehicleSchedule) => r.booking?.customer_name || "-",
    },
    {
      title: "路线",
      ellipsis: true,
      render: (_: any, r: VehicleSchedule) =>
        (r.booking?.from_address || "-") + " → " + (r.booking?.to_address || "-"),
    },
    {
      title: "状态",
      width: 100,
      dataIndex: "status",
      render: (s: ScheduleStatus) => <StatusBadge type="schedule" value={s} />,
    },
    {
      title: "状态流转",
      key: "flow",
      width: 560,
      render: (_: any, r: VehicleSchedule) => {
        const idx = getCurrentStatusIndex(r.status)
        return (
          <Space size={4} wrap>
            {scheduleStatusFlow.map((f, i) => {
              const isCurrent = i === idx
              const isDone = i < idx
              const isNext = i === idx + 1
              let btnType: any = "default"
              if (isCurrent) btnType = "primary"
              if (isDone) btnType = "dashed"
              return (
                <Button
                  key={f.status}
                  size="small"
                  type={btnType}
                  disabled={!isNext && !isCurrent}
                  onClick={() => isNext && handleStatusChange(r.id, f.status)}
                >
                  {isDone ? "✓ " : ""}
                  {f.label}
                </Button>
              )
            })}
          </Space>
        )
      },
    },
    {
      title: "操作",
      width: 100,
      key: "action",
      render: (_: any, r: VehicleSchedule) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>
          详情
        </Button>
      ),
    },
  ]

  const exceptionColumns = [
    {
      title: "类型",
      width: 90,
      dataIndex: "type",
      render: (v: ExceptionType) => <StatusBadge type="exception_type" value={v} />,
    },
    { title: "标题", dataIndex: "title", width: 160, ellipsis: true },
    { title: "描述", dataIndex: "description", ellipsis: true },
    {
      title: "金额",
      width: 110,
      render: (_: any, r: ExceptionRecord) => {
        if (r.surcharge_amount > 0) return "+¥" + r.surcharge_amount
        if (r.refund_amount > 0) return "-¥" + r.refund_amount
        return "-"
      },
    },
    {
      title: "状态",
      width: 100,
      dataIndex: "status",
      render: (v: string) => <StatusBadge type="exception" value={v} />,
    },
    {
      title: "操作",
      width: 160,
      key: "action",
      render: (_: any, r: ExceptionRecord) => (
        <Space size="small">
          <Button
            size="small"
            icon={<CheckCircleOutlined />}
            type="primary"
            disabled={r.status !== "pending"}
            onClick={() => handleConfirmException(r.id)}
          >
            确认
          </Button>
          <Button
            size="small"
            icon={<CloseCircleOutlined />}
            danger
            disabled={r.status !== "pending"}
            onClick={() => handleRejectException(r.id)}
          >
            退回
          </Button>
        </Space>
      ),
    },
  ]

  const renderBookingPool = () => (
    <Spin spinning={loading}>
      <Space style={{ marginBottom: 16 }}>
        <span>状态筛选：</span>
        {statusFilters.map(s => (
          <Button
            key={s.key}
            type={statusFilter === s.key ? "primary" : "default"}
            onClick={() => setStatusFilter(s.key)}
            size="small"
          >
            {s.label}
          </Button>
        ))}
      </Space>
      <Table
        rowKey="id"
        columns={bookingsColumns}
        dataSource={filteredBookings}
        size="middle"
        pagination={{ pageSize: 10 }}
      />
    </Spin>
  )

  const renderVehicleSchedule = () => (
    <Spin spinning={loading}>
      <Table
        rowKey="id"
        columns={scheduleColumns}
        dataSource={schedules}
        size="middle"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />
    </Spin>
  )

  const renderTodayBoard = () => {
    const vids = Object.keys(timeline.by_vehicle || {})
    if (vids.length === 0)
      return (
        <Spin spinning={loading}>
          <Card>
            <div style={{ textAlign: "center", color: "#999" }}>暂无今日排班时间线数据</div>
          </Card>
        </Spin>
      )
    return (
      <Spin spinning={loading}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {vids.map(vid => {
            const scheds = (timeline.by_vehicle || {})[vid] || []
            const vh = scheds[0]?.vehicle || vehicles.find(v => v.id === vid)
            return (
              <Card
                key={vid}
                title={
                  <span>
                    <CarOutlined /> {vh?.plate_number || vid} - {vh?.vehicle_type || ""}
                  </span>
                }
                size="small"
              >
                <Timeline
                  items={scheds.map(s => ({
                    color:
                      s.status === "done"
                        ? "green"
                        : s.status === "exception"
                        ? "red"
                        : "blue",
                    children: (
                      <div>
                        <div>
                          <b>{s.booking?.customer_name || "-"}</b>：
                          {s.booking?.from_address || "-"} → {s.booking?.to_address || "-"}
                        </div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {dayjs(s.planned_start).format("HH:mm")} ~{" "}
                          {dayjs(s.planned_end).format("HH:mm")}
                          <span style={{ marginLeft: 8 }}>
                            <StatusBadge type="schedule" value={s.status} />
                          </span>
                        </div>
                      </div>
                    ),
                  }))}
                />
              </Card>
            )
          })}
        </div>
      </Spin>
    )
  }

  const renderExceptionCenter = () => (
    <Spin spinning={loading}>
      <Space style={{ marginBottom: 16 }}>
        <Button
          size="small"
          type="primary"
          icon={<ExclamationCircleOutlined />}
          onClick={() => {
            triggerForm.resetFields()
            setTriggerModal(true)
          }}
        >
          模拟异常
        </Button>
      </Space>
      <Table
        rowKey="id"
        columns={exceptionColumns}
        dataSource={exceptions}
        size="middle"
        pagination={{ pageSize: 10 }}
      />
    </Spin>
  )

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#fff",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 600 }}>
          <ScheduleOutlined /> 搬家管理系统 - 调度面板
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <span>
            <TeamOutlined /> {user?.name}（调度员）
          </span>
          <Button
            size="small"
            icon={<LogoutOutlined />}
            onClick={() => {
              logout()
              navigate("/login")
            }}
          >
            退出
          </Button>
        </div>
      </Header>
      <Content style={{ padding: 24 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "bookings", label: "预约单池", children: renderBookingPool() },
            { key: "schedules", label: "车辆排班", children: renderVehicleSchedule() },
            { key: "today", label: "今日看板", children: renderTodayBoard() },
            { key: "exceptions", label: "异常中心", children: renderExceptionCenter() },
          ]}
        />
      </Content>

      <Modal
        title={"一键排班 - " + (currentBooking?.customer_name || "")}
        open={scheduleModal}
        onCancel={() => setScheduleModal(false)}
        onOk={handleSubmitSchedule}
        okText="提交排班"
        confirmLoading={submitLoading}
        width={640}
        destroyOnClose
      >
        {currentBooking && (
          <Form form={scheduleForm} layout="vertical">
            <Card size="small" style={{ marginBottom: 16, background: "#fafafa" }}>
              <div>
                <b>{currentBooking.customer_name}</b>：{currentBooking.from_address} →{" "}
                {currentBooking.to_address}
              </div>
              <div style={{ color: "#666", marginTop: 4 }}>
                {currentBooking.move_date} {currentBooking.move_time} · ¥
                {currentBooking.base_price}
              </div>
            </Card>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="选择车辆"
                  name="vehicle_id"
                  rules={[{ required: true, message: "请选择车辆" }]}
                >
                  <Select placeholder="请选择车辆">
                    {idleVehicles.map(v => (
                      <Option key={v.id} value={v.id}>
                        {v.plate_number} - {v.vehicle_type}（{v.driver_name}）
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="选择组长"
                  name="leader_id"
                  rules={[{ required: true, message: "请选择组长" }]}
                >
                  <Select placeholder="请选择组长">
                    {leaders.map(c => (
                      <Option key={c.id} value={c.id}>
                        {c.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="选择搬运工（多选）"
                  name="worker_ids"
                  rules={[{ required: true, message: "请选择至少1名搬运工" }]}
                >
                  <Select mode="multiple" placeholder="请选择搬运工">
                    {workers.map(c => (
                      <Option key={c.id} value={c.id}>
                        {c.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="计划出发时间"
                  name="planned_start"
                  rules={[{ required: true, message: "请选择出发时间" }]}
                >
                  <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="计划到达时间"
                  name="planned_end"
                  rules={[{ required: true, message: "请选择到达时间" }]}
                >
                  <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="备注" name="remarks">
                  <TextArea rows={2} placeholder="请输入备注（可选）" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </Modal>

      <Modal
        title="排班详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Spin spinning={detailLoading}>
          {detailSchedule && (
            <div>
              <Card size="small" style={{ marginBottom: 12 }}>
                <div>
                  <b>车辆：</b>
                  {detailSchedule.vehicle?.plate_number || "-"}
                </div>
                <div>
                  <b>车型：</b>
                  {detailSchedule.vehicle?.vehicle_type || "-"}
                </div>
                <div>
                  <b>客户：</b>
                  {detailSchedule.booking?.customer_name || "-"}
                </div>
                <div>
                  <b>路线：</b>
                  {detailSchedule.booking?.from_address || "-"} →{" "}
                  {detailSchedule.booking?.to_address || "-"}
                </div>
                <div>
                  <b>计划时间：</b>
                  {dayjs(detailSchedule.planned_start).format("YYYY-MM-DD HH:mm")} ~{" "}
                  {dayjs(detailSchedule.planned_end).format("HH:mm")}
                </div>
                <div>
                  <b>状态：</b>
                  <StatusBadge type="schedule" value={detailSchedule.status} />
                </div>
                {detailSchedule.remarks && (
                  <div>
                    <b>备注：</b>
                    {detailSchedule.remarks}
                  </div>
                )}
              </Card>
              {detailSchedule.assignments && detailSchedule.assignments.length > 0 && (
                <Card size="small" title="派工列表">
                  {detailSchedule.assignments.map((a: CrewAssignment) => (
                    <div key={a.id} style={{ marginBottom: 4 }}>
                      {a.crew?.name || a.crew_id} - {a.role}{" "}
                      <StatusBadge type="assignment" value={a.status} />
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}
        </Spin>
      </Modal>

      <Modal
        title="模拟异常"
        open={triggerModal}
        onCancel={() => setTriggerModal(false)}
        onOk={handleTriggerException}
        okText="触发"
        width={500}
        destroyOnClose
      >
        <Form form={triggerForm} layout="vertical">
          <Form.Item
            label="选择预约单"
            name="booking_id"
            rules={[{ required: true, message: "请选择预约单" }]}
          >
            <Select placeholder="请选择预约单">
              {bookings.map(b => (
                <Option key={b.id} value={b.id}>
                  {b.customer_name} - {b.from_address}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="异常类型"
            name="type"
            rules={[{ required: true, message: "请选择异常类型" }]}
          >
            <Select placeholder="请选择异常类型">
              <Option value="delay">延误</Option>
              <Option value="surcharge">加价</Option>
              <Option value="damage">物损</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}
