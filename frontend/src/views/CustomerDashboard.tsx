import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Layout, Tabs, Table, Button, Space, Modal, Form, App, Card, Row, Col, Input, InputNumber, Tag, Image, Spin } from "antd"
import { CustomerServiceOutlined, ExclamationCircleOutlined, LogoutOutlined, EditOutlined, CheckOutlined, RollbackOutlined, DollarOutlined, CloseOutlined, TeamOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import StatusBadge from "@/components/StatusBadge"
import { useAuthStore } from "@/store/auth"
import type {
  Booking,
  ExceptionRecord,
  BookingStatus,
  ExceptionStatus,
  ExceptionType,
  HandleExceptionRequest,
} from "@/types"
import * as api from "@/services/api"

const { Header, Content } = Layout
const { TextArea } = Input

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { user, logout } = useAuthStore()

  const [activeTab, setActiveTab] = useState("bookings")
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([])

  const [priceModal, setPriceModal] = useState(false)
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null)
  const [priceForm] = Form.useForm()

  const [refundModal, setRefundModal] = useState(false)
  const [currentException, setCurrentException] = useState<ExceptionRecord | null>(null)
  const [refundForm] = Form.useForm()

  const loadBookings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.listBookings({ page_size: 100 })
      setBookings(res.data)
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setLoading(false)
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

  useEffect(() => {
    loadBookings()
    loadExceptions()
  }, [loadBookings, loadExceptions])

  const handleOpenPriceEdit = (b: Booking) => {
    setCurrentBooking(b)
    priceForm.setFieldsValue({
      final_price: b.total_price || b.base_price,
      price_remark: b.price_remark || "",
    })
    setPriceModal(true)
  }

  const handleSubmitPrice = async () => {
    if (!currentBooking) return
    try {
      const values = await priceForm.validateFields()
      setSubmitLoading(true)
      await api.updateBooking(currentBooking.id, {
        final_price: values.final_price,
        price_remark: values.price_remark,
        price_adjusted: true,
      })
      message.success("改价已保存")
      setPriceModal(false)
      loadBookings()
    } catch (err: any) {
      if (err?.errorFields) return
      message.error(err.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleRefund = (ex: ExceptionRecord) => {
    setCurrentException(ex)
    refundForm.setFieldsValue({
      refund_amount: ex.surcharge_amount || ex.refund_amount || 0,
      handle_remark: "",
    })
    setRefundModal(true)
  }

  const handleCloseException = async (id: string) => {
    if (!user) return
    try {
      await api.handleException(id, {
        status: "resolved",
        handler_id: user.id,
        handle_remark: "客服关闭",
      })
      message.success("异常已关闭")
      loadExceptions()
    } catch (err: any) {
      message.error(err.message)
    }
  }

  const handleRollbackException = async (id: string) => {
    if (!user) return
    try {
      await api.handleException(id, {
        status: "rejected",
        handler_id: user.id,
        reject_reason: "退回，请现场重新核实",
      })
      message.success("异常已退回")
      loadExceptions()
    } catch (err: any) {
      message.error(err.message)
    }
  }

  const handleSubmitRefund = async () => {
    if (!currentException || !user) return
    try {
      const values = await refundForm.validateFields()
      setSubmitLoading(true)
      await api.handleException(currentException.id, {
        status: "refunded",
        handler_id: user.id,
        refund_amount: values.refund_amount,
        handle_remark: values.handle_remark,
      })
      message.success("退款/赔付已处理完成")
      setRefundModal(false)
      loadExceptions()
    } catch (err: any) {
      if (err?.errorFields) return
      message.error(err.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  const bookingColumns = [
    { title: "客户", dataIndex: "customer_name", width: 100 },
    {
      title: "搬出地",
      dataIndex: "from_address",
      ellipsis: true,
    },
    {
      title: "搬入地",
      dataIndex: "to_address",
      ellipsis: true,
    },
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
          icon={<EditOutlined />}
          type="primary"
          onClick={() => handleOpenPriceEdit(r)}
        >
          改价
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
    {
      title: "客户",
      width: 100,
      render: (_: any, r: ExceptionRecord) => r.booking?.customer_name || "-",
    },
    { title: "标题", dataIndex: "title", width: 140, ellipsis: true },
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
      width: 240,
      key: "action",
      render: (_: any, r: ExceptionRecord) => (
        <Space size="small">
          <Button
            size="small"
            icon={<DollarOutlined />}
            type="primary"
            onClick={() => handleRefund(r)}
            disabled={r.status === "resolved" || r.status === "refunded"}
          >
            退款/赔付
          </Button>
          <Button
            size="small"
            icon={<RollbackOutlined />}
            onClick={() => handleRollbackException(r.id)}
            disabled={r.status !== "pending" && r.status !== "confirmed"}
          >
            退回
          </Button>
          <Button
            size="small"
            icon={<CloseOutlined />}
            danger
            onClick={() => handleCloseException(r.id)}
            disabled={r.status === "resolved"}
          >
            关闭
          </Button>
        </Space>
      ),
    },
  ]

  const renderBookings = () => (
    <Spin spinning={loading}>
      <Table
        rowKey="id"
        columns={bookingColumns}
        dataSource={bookings}
        size="middle"
        pagination={{ pageSize: 10 }}
      />
    </Spin>
  )

  const renderExceptions = () => (
    <Spin spinning={loading}>
      <Table
        rowKey="id"
        columns={exceptionColumns}
        dataSource={exceptions}
        size="middle"
        pagination={{ pageSize: 10 }}
      />
    </Spin>
  )

  const renderDamageView = () => {
    const damages = exceptions.filter(e => e.type === "damage")
    if (damages.length === 0)
      return (
        <Card>
          <div style={{ textAlign: "center", color: "#999" }}>暂无物损记录</div>
        </Card>
      )
    return (
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {damages.map(d => {
            return (
              <Col span={12} key={d.id}>
                <Card
                  title={"物损记录 - " + (d.booking?.customer_name || d.booking_id)}
                  extra={<Tag color="red">物损</Tag>}
                >
                  <div>
                    <b>客户：</b>
                    {d.booking?.customer_name || "-"}
                  </div>
                  <div>
                    <b>物损描述：</b>
                    {d.description}
                  </div>
                  <div>
                    <b>上报时间：</b>
                    {dayjs(d.created_at).format("YYYY-MM-DD HH:mm")}
                  </div>
                  <div>
                    <b>赔付金额：</b>
                    {d.refund_amount > 0 ? "¥" + d.refund_amount : "未处理"}
                  </div>
                  <div>
                    <b>处理结果：</b>
                    {d.handle_remark || "待处理"}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <b>物损照片：</b>
                    {d.photos && d.photos.length > 0 ? (
                      <Space wrap>
                        {d.photos.map(ph => (
                          <Image
                            key={ph.id}
                            width={120}
                            height={90}
                            src={ph.url}
                          />
                        ))}
                      </Space>
                    ) : (
                      "无照片"
                    )}
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      </Spin>
    )
  }

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
          <CustomerServiceOutlined /> 搬家管理系统 - 客服面板
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <span>
            <TeamOutlined /> {user?.name}（客服）
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
            { key: "bookings", label: "预约单处理", children: renderBookings() },
            { key: "exceptions", label: "异常处理", children: renderExceptions() },
            { key: "damage", label: "物损查看", children: renderDamageView() },
          ]}
        />
      </Content>

      <Modal
        title={"改价 - " + (currentBooking?.customer_name || "")}
        open={priceModal}
        onCancel={() => setPriceModal(false)}
        onOk={handleSubmitPrice}
        okText="保存改价"
        confirmLoading={submitLoading}
        width={520}
        destroyOnClose
      >
        {currentBooking && (
          <Form form={priceForm} layout="vertical">
            <Card size="small" style={{ marginBottom: 16, background: "#fafafa" }}>
              <div>
                <b>{currentBooking.customer_name}</b>
              </div>
              <div>
                {currentBooking.from_address} → {currentBooking.to_address}
              </div>
              <div>
                基础价：<b>¥{currentBooking.base_price}</b>
              </div>
              {currentBooking.price_remark && (
                <div>
                  上次改价说明：{currentBooking.price_remark}
                </div>
              )}
            </Card>
            <Form.Item
              label="最终价格（元）"
              name="final_price"
              rules={[{ required: true, message: "请输入最终价格" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="改价说明" name="price_remark">
              <TextArea rows={2} placeholder="改价说明（可选）" />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title={"异常退款/赔付处理 - " + (currentException?.id || "")}
        open={refundModal}
        onCancel={() => setRefundModal(false)}
        onOk={handleSubmitRefund}
        okText="确认处理"
        confirmLoading={submitLoading}
        width={520}
        destroyOnClose
      >
        {currentException && (
          <Form form={refundForm} layout="vertical">
            <Card size="small" style={{ marginBottom: 16, background: "#fafafa" }}>
              <div>
                <b>类型：</b>
                <StatusBadge type="exception_type" value={currentException.type} />
              </div>
              <div>
                <b>客户：</b>
                {currentException.booking?.customer_name || "-"}
              </div>
              <div>
                <b>描述：</b>
                {currentException.description}
              </div>
              {currentException.surcharge_amount > 0 && (
                <div>
                  <b>现场加价金额：</b>¥{currentException.surcharge_amount}
                </div>
              )}
            </Card>
            <Form.Item
              label="退款/赔付金额（元）"
              name="refund_amount"
              rules={[{ required: true, message: "请输入金额" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label="处理说明"
              name="handle_remark"
              rules={[{ required: true, message: "请填写处理说明" }]}
            >
              <TextArea rows={2} placeholder="请详细说明处理结果" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Layout>
  )
}
