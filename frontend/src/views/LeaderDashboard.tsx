import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Layout, Tabs, Table, Button, Space, Modal, Form, Select, App, Card, Upload, Input, InputNumber, Spin } from "antd"
import { CarOutlined, TeamOutlined, ExclamationCircleOutlined, LogoutOutlined, UploadOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import StatusBadge from "@/components/StatusBadge"
import { useAuthStore } from "@/store/auth"
import type {
  VehicleSchedule,
  ScheduleStatus,
  ExceptionType,
  CrewReviewResult,
  DamagePhoto,
} from "@/types"
import * as api from "@/services/api"

const { Header, Content } = Layout
const { Option } = Select
const { TextArea } = Input

const statusFlow: { status: ScheduleStatus; label: string }[] = [
  { status: "created", label: "待派车" },
  { status: "assigned", label: "已派车" },
  { status: "departed", label: "已出车" },
  { status: "arrived", label: "已到达" },
  { status: "loading", label: "装车中" },
  { status: "moving", label: "运输中" },
  { status: "unloading", label: "卸车中" },
  { status: "done", label: "已完成" },
]

export default function LeaderDashboard() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { user, logout } = useAuthStore()

  const [activeTab, setActiveTab] = useState("assignments")
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  const [schedules, setSchedules] = useState<VehicleSchedule[]>([])
  const [review, setReview] = useState<CrewReviewResult | null>(null)

  const [exceptionModal, setExceptionModal] = useState(false)
  const [currentSchedule, setCurrentSchedule] = useState<VehicleSchedule | null>(null)
  const [exceptionForm] = Form.useForm()
  const [photoList, setPhotoList] = useState<any[]>([])

  const loadSchedules = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await api.listSchedules({ leader_id: user.id, page_size: 100 })
      setSchedules(res.data)
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, message])

  const loadReview = useCallback(async () => {
    if (!user) return
    try {
      const res = await api.getCrewReview(user.id)
      setReview(res)
    } catch (err: any) {
      message.error(err.message)
    }
  }, [user, message])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  useEffect(() => {
    if (activeTab === "review") {
      loadReview()
    }
  }, [activeTab, loadReview])

  const getCurrentStatusIndex = (s: ScheduleStatus) =>
    statusFlow.findIndex(f => f.status === s)

  const handleStatusChange = async (scheduleId: string, nextStatus: ScheduleStatus) => {
    try {
      await api.updateScheduleStatus(scheduleId, { status: nextStatus })
      setSchedules(prev => prev.map(s => (s.id === scheduleId ? { ...s, status: nextStatus } : s)))
      message.success("状态已更新")
    } catch (err: any) {
      message.error(err.message)
    }
  }

  const handleOpenException = (schedule: VehicleSchedule) => {
    setCurrentSchedule(schedule)
    exceptionForm.resetFields()
    setPhotoList([])
    setExceptionModal(true)
  }

  const handleSubmitException = async () => {
    if (!currentSchedule || !user) return
    try {
      const values = await exceptionForm.validateFields()
      setSubmitLoading(true)

      const excRes = await api.createException({
        booking_id: currentSchedule.booking_id || "",
        schedule_id: currentSchedule.id,
        type: values.type,
        title: values.title || "",
        description: values.description || "",
        surcharge_amount: values.surcharge_amount || 0,
        reporter_id: user.id,
      })

      if (values.type === "damage" && photoList.length > 0) {
        for (const p of photoList) {
          if (p.originFileObj) {
            try {
              await api.uploadDamagePhoto({
                booking_id: currentSchedule.booking_id || "",
                exception_id: excRes.id,
                url: p.name || "",
                file_name: p.name,
                uploaded_by: user.id,
              })
            } catch (e) {}
          }
        }
      }

      message.success("已上报")
      setExceptionModal(false)
      exceptionForm.resetFields()
      setPhotoList([])
    } catch (err: any) {
      if (err?.errorFields) return
      message.error(err.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  const todaySchedules = schedules.filter(s =>
    dayjs(s.planned_start).format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD")
  )

  const scheduleColumns = [
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
      title: "车辆",
      width: 120,
      render: (_: any, r: VehicleSchedule) => r.vehicle?.plate_number || "-",
    },
    {
      title: "当前状态",
      width: 120,
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
            {statusFlow.map((f, i) => {
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
      title: "异常",
      width: 100,
      key: "ex",
      render: (_: any, r: VehicleSchedule) => (
        <Button
          size="small"
          danger
          icon={<ExclamationCircleOutlined />}
          onClick={() => handleOpenException(r)}
        >
          上报
        </Button>
      ),
    },
  ]

  const renderAssignments = () => (
    <Spin spinning={loading}>
      <Table
        rowKey="id"
        dataSource={todaySchedules}
        size="middle"
        pagination={false}
        columns={scheduleColumns}
        scroll={{ x: 1200 }}
      />
    </Spin>
  )

  const renderReview = () => (
    <Spin spinning={loading}>
      {review ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card size="small" title="派工回看">
            <p>
              <b>累计派工次数：</b>
              {review.total_count}
            </p>
            <p>
              <b>完成次数：</b>
              {review.completed_count}
            </p>
            <p>
              <b>准时率：</b>
              {(review.on_time_rate * 100).toFixed(1)}%
            </p>
            <p>
              <b>累计服务客户：</b>
              {review.unique_customers}
            </p>
          </Card>
          {review.recent_assignments && review.recent_assignments.length > 0 && (
            <Card size="small" title="最近派工记录">
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={review.recent_assignments}
                columns={[
                  {
                    title: "客户",
                    dataIndex: "customer_name",
                    width: 100,
                  },
                  {
                    title: "路线",
                    width: 240,
                    render: (_: any, r: any) => r.from_address + " → " + r.to_address,
                  },
                  {
                    title: "日期",
                    dataIndex: "planned_start",
                    width: 180,
                    render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
                  },
                  {
                    title: "状态",
                    dataIndex: "status",
                    width: 100,
                    render: (s: string) => <StatusBadge type="assignment" value={s as any} />,
                  },
                ]}
              />
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <div style={{ textAlign: "center", color: "#999" }}>暂无回看数据</div>
        </Card>
      )}
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
          <CarOutlined /> 搬家管理系统 - 组长面板
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <span>
            <TeamOutlined /> {user?.name}（组长）
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
            { key: "assignments", label: "今日派工", children: renderAssignments() },
            { key: "review", label: "派工回看", children: renderReview() },
          ]}
        />
      </Content>

      <Modal
        title="异常上报"
        open={exceptionModal}
        onCancel={() => setExceptionModal(false)}
        onOk={handleSubmitException}
        okText="提交"
        confirmLoading={submitLoading}
        width={600}
        destroyOnClose
      >
        {currentSchedule && (
          <Card size="small" style={{ marginBottom: 16, background: "#fafafa" }}>
            <div>
              <b>客户：</b>
              {currentSchedule.booking?.customer_name || "-"}
            </div>
            <div>
              <b>路线：</b>
              {currentSchedule.booking?.from_address || "-"} →{" "}
              {currentSchedule.booking?.to_address || "-"}
            </div>
          </Card>
        )}
        <Form form={exceptionForm} layout="vertical">
          <Form.Item
            label="异常类型"
            name="type"
            rules={[{ required: true, message: "请选择异常类型" }]}
          >
            <Select placeholder="请选择">
              <Option value="delay">延误</Option>
              <Option value="surcharge">加价</Option>
              <Option value="damage">物损</Option>
            </Select>
          </Form.Item>
          <Form.Item label="标题" name="title">
            <Input placeholder="异常标题（可选）" />
          </Form.Item>
          <Form.Item label="金额（元）" name="surcharge_amount">
            <InputNumber
              placeholder="加价金额或赔付金额"
              style={{ width: "100%" }}
              min={0}
            />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <TextArea rows={2} placeholder="异常描述（可选）" />
          </Form.Item>
          <Form.Item label="物损照片" name="photos">
            <Upload
              listType="picture-card"
              multiple
              beforeUpload={() => false}
              fileList={photoList}
              onChange={({ fileList }) => setPhotoList(fileList)}
            >
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>上传照片</div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}
