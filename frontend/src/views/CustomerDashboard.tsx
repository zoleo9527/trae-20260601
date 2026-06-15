import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Layout, Tabs, Table, Button, Space, Modal, Form, App, Card, Row, Col, Input, InputNumber, Tag, Image, Descriptions } from "antd"
import { CarOutlined, CustomerServiceOutlined, ExclamationCircleOutlined, LogoutOutlined, EditOutlined, CheckOutlined, RollbackOutlined, DollarOutlined, CloseOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import StatusBadge from "@/components/StatusBadge"
import { useAuthStore } from "@/store/auth"
import type { Booking, ExceptionRecord, BookingStatus, ExceptionStatus, ExceptionType, HandleExceptionRequest } from "@/types"
import * as api from "@/services/api"

const { Header, Content } = Layout
const { TextArea } = Input

const mockBookings: Booking[] = [
  { id: "1", orderNo: "BK20260615001", customerName: "张三", customerPhone: "13800138001", moveFrom: "北京市朝阳区望京SOHO", moveTo: "北京市海淀区中关村软件园", moveDate: "2026-06-15", moveTime: "09:00", items: "家具、家电、衣物约20箱", areaSize: 90, floorFrom: 12, floorTo: 8, hasElevatorFrom: true, hasElevatorTo: true, estimatedPrice: 2800, status: "pending", createdAt: "2026-06-14 10:30:00" },
  { id: "3", orderNo: "BK20260615003", customerName: "王五", customerPhone: "13800138003", moveFrom: "北京市东城区东直门", moveTo: "北京市通州区运河核心区", moveDate: "2026-06-15", moveTime: "08:00", items: "办公用品、文件、设备", areaSize: 60, floorFrom: 5, floorTo: 1, hasElevatorFrom: true, hasElevatorTo: false, estimatedPrice: 1800, finalPrice: 1950, status: "in_progress", createdAt: "2026-06-14 09:15:00" },
  { id: "5", orderNo: "BK20260615005", customerName: "钱七", customerPhone: "13800138005", moveFrom: "北京市大兴区亦庄", moveTo: "北京市房山区良乡", moveDate: "2026-06-16", moveTime: "07:30", items: "大家电、大型家具、厨房用品", areaSize: 150, floorFrom: 1, floorTo: 3, hasElevatorFrom: true, hasElevatorTo: false, estimatedPrice: 5200, finalPrice: 5200, status: "completed", createdAt: "2026-06-12 11:00:00" },
];

const mockExceptions: ExceptionRecord[] = [
  { id: "e1", bookingId: "3", scheduleId: "s2", type: "delay", description: "客户小区临时封闭施工，原定路线无法进入，需要绕行约5公里", status: "pending", reportedBy: "c1", reporterName: "组长A", createdAt: "2026-06-15 07:30:00" },
  { id: "e2", bookingId: "2", scheduleId: "s1", type: "surcharge", description: "到现场发现额外物品未申报：两台大型鱼缸及附件，需加人工费", status: "processing", reportedBy: "c2", reporterName: "组长B", resultAmount: 300, createdAt: "2026-06-15 12:00:00" },
  { id: "e3", bookingId: "5", type: "damage", description: "搬运过程中客户古董花瓶外包装完好但内部受损", status: "resolved", reportedBy: "c1", reporterName: "组长A", resultAmount: 200, handleResult: "按照物损约定协商赔付200元，客户确认同意", handledAt: "2026-06-15 18:00:00", damagePhotos: [{ id: "p1", url: "https://via.placeholder.com/300x200.png?text=Damage+Photo+1", uploadedBy: "c1", uploadedAt: "2026-06-15 16:05:00", exceptionId: "e3", createdAt: "2026-06-15 16:05:00" }], createdAt: "2026-06-15 16:00:00" },
];

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState("bookings");
  const [priceModal, setPriceModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [priceForm] = Form.useForm();
  const [refundModal, setRefundModal] = useState(false);
  const [currentException, setCurrentException] = useState<ExceptionRecord | null>(null);
  const [refundForm] = Form.useForm();
  const [bookings, setBookings] = useState(mockBookings);
  const [exceptions, setExceptions] = useState(mockExceptions);

  const handleOpenPriceEdit = (b: Booking) => { setCurrentBooking(b); priceForm.setFieldsValue({ finalPrice: b.finalPrice || b.estimatedPrice, remark: "" }); setPriceModal(true); };
  const handleSubmitPrice = async () => {
    try { const values = await priceForm.validateFields(); await api.updateBooking(currentBooking!.id, { finalPrice: values.finalPrice, priceRemark: values.remark }); setBookings(prev => prev.map(b => b.id === currentBooking!.id ? { ...b, finalPrice: values.finalPrice, status: "scheduled" as BookingStatus } : b)); message.success("改价已保存并标记为已排班"); } catch (e: any) { if (e?.errorFields) return; message.success("改价已保存（Mock）"); setPriceModal(false); }
    setPriceModal(false);
  };
  const handleRefund = (ex: ExceptionRecord) => { setCurrentException(ex); refundForm.setFieldsValue({ refundAmount: ex.resultAmount || 0, remark: "" }); setRefundModal(true); };
  const handleCloseException = (id: string) => { try { api.handleException(id, { status: "resolved", handleResult: "客服关闭" } as HandleExceptionRequest); } catch {} setExceptions(prev => prev.map(e => e.id === id ? { ...e, status: "resolved" } : e)); message.success("异常已关闭"); };
  const handleRollbackException = (id: string) => { setExceptions(prev => prev.map(e => e.id === id ? { ...e, status: "pending" } : e)); message.warning("异常已退回给现场处理"); };
  const handleSubmitRefund = async () => {
    try { const values = await refundForm.validateFields(); await api.handleException(currentException!.id, { status: "resolved", resultAmount: values.refundAmount, handleResult: values.remark }); message.success("退款/赔付已处理完成"); } catch (e: any) { if (e?.errorFields) return; message.success("退款已处理（Mock）"); }
    setExceptions(prev => prev.map(e => e.id === currentException!.id ? { ...e, status: "resolved", resultAmount: refundForm.getFieldValue("refundAmount"), handleResult: refundForm.getFieldValue("remark") } : e));
    setRefundModal(false);
  };

  const bookingColumns = [
    { title: "订单号", dataIndex: "orderNo", width: 140 },
    { title: "客户", dataIndex: "customerName", width: 80 },
    { title: "搬出→搬入", width: 300, render: (_: any, r: Booking) => r.moveFrom + " → " + r.moveTo, ellipsis: true },
    { title: "时间", width: 150, render: (_: any, r: Booking) => r.moveDate + " " + r.moveTime },
    { title: "预估", dataIndex: "estimatedPrice", width: 90, render: (v: number) => "¥" + v },
    { title: "最终价", width: 100, dataIndex: "finalPrice", render: (v: number | undefined, r: Booking) => v ? <Tag color="blue">¥{v}</Tag> : <Tag color="orange">待确认 ¥{r.estimatedPrice}</Tag> },
    { title: "状态", width: 100, dataIndex: "status", render: (s: BookingStatus) => <StatusBadge type="booking" value={s} /> },
    { title: "操作", width: 150, key: "action", render: (_: any, r: Booking) => (
      <Space size="small"><Button size="small" icon={<EditOutlined />} type="primary" onClick={() => handleOpenPriceEdit(r)}>改价</Button><Button size="small" icon={<CheckOutlined />} disabled={r.status !== "pending"}>确认</Button></Space>
    )},
  ];

  const exceptionColumns = [
    { title: "编号", dataIndex: "id", width: 70 },
    { title: "订单号", width: 140, render: (_: any, r: ExceptionRecord) => mockBookings.find(b => b.id === r.bookingId)?.orderNo },
    { title: "类型", width: 90, dataIndex: "type", render: (v: ExceptionType) => <StatusBadge type="exception_type" value={v} /> },
    { title: "描述", dataIndex: "description", ellipsis: true },
    { title: "上报人", dataIndex: "reporterName", width: 80 },
    { title: "金额", dataIndex: "resultAmount", width: 90, render: (v?: number) => v ? "¥" + v : "-" },
    { title: "状态", width: 90, dataIndex: "status", render: (v: any) => <StatusBadge type="exception" value={v} /> },
    { title: "操作", width: 220, key: "action", render: (_: any, r: ExceptionRecord) => (
      <Space size="small">
        <Button size="small" icon={<DollarOutlined />} type="primary" onClick={() => handleRefund(r)} disabled={r.status === "resolved"}>退款/赔付</Button>
        <Button size="small" icon={<RollbackOutlined />} onClick={() => handleRollbackException(r.id)} disabled={r.status === "resolved"}>退回</Button>
        <Button size="small" icon={<CloseOutlined />} danger onClick={() => handleCloseException(r.id)} disabled={r.status === "resolved"}>关闭</Button>
      </Space>
    )},
  ];

  const renderBookings = () => <div><Table rowKey="id" columns={bookingColumns} dataSource={bookings} size="middle" pagination={{ pageSize: 8 }} /></div>;
  const renderExceptions = () => <div><Table rowKey="id" columns={exceptionColumns} dataSource={exceptions} size="middle" pagination={{ pageSize: 8 }} /></div>;

  const renderDamageView = () => {
    const damages = exceptions.filter(e => e.type === "damage");
    return (
      <Row gutter={[16, 16]}>
        {damages.map(d => {
          const b = mockBookings.find(x => x.id === d.bookingId);
          return (
            <Col span={12} key={d.id}>
              <Card title={"物损记录 - " + (b?.orderNo || "")} extra={<Tag color="red">物损</Tag>}>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="客户">{b?.customerName}</Descriptions.Item>
                  <Descriptions.Item label="物损描述">{d.description}</Descriptions.Item>
                  <Descriptions.Item label="上报时间">{d.createdAt}</Descriptions.Item>
                  <Descriptions.Item label="处理结果金额">{d.resultAmount ? "¥" + d.resultAmount : "未处理"}</Descriptions.Item>
                  <Descriptions.Item label="处理结果详情">{d.handleResult || "待处理"}</Descriptions.Item>
                  <Descriptions.Item label="物损照片">{d.damagePhotos && d.damagePhotos.length > 0 ? <Space>{d.damagePhotos.map(ph => <Image key={ph.id} width={120} height={90} src={ph.url} />)}</Space> : "无照片"}</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#fff", padding: "0 24px", display: "flex", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
        <span style={{ fontSize: 18, fontWeight: 600 }}><CustomerServiceOutlined /> 搬家管理系统 - 客服面板</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <span>{user?.name}（客服）</span>
          <Button size="small" icon={<LogoutOutlined />} onClick={() => { logout(); navigate("/login"); }}>退出</Button>
        </div>
      </Header>
      <Content style={{ padding: 24 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          { key: "bookings", label: "预约单处理", children: renderBookings() },
          { key: "exceptions", label: "异常处理", children: renderExceptions() },
          { key: "damage", label: "物损查看", children: renderDamageView() },
        ]} />
      </Content>
      <Modal title={"改价 - " + (currentBooking?.orderNo || "")} open={priceModal} onCancel={() => setPriceModal(false)} onOk={handleSubmitPrice} okText="保存改价并排班" width={520}>
        {currentBooking && (
          <Form form={priceForm} layout="vertical">
            <Card size="small" style={{ marginBottom: 16, background: "#fafafa" }}><b>{currentBooking.customerName}</b><br />{currentBooking.moveFrom} → {currentBooking.moveTo}<br />预估金额：<b>¥{currentBooking.estimatedPrice}</b></Card>
            <Form.Item label="最终价格（元）" name="finalPrice" rules={[{ required: true, message: "请输入最终价格" }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="改价说明/备注" name="remark"><TextArea rows={2} placeholder="改价原因说明（可选）" /></Form.Item>
          </Form>
        )}
      </Modal>
      <Modal title={"异常退款/赔付处理 - " + (currentException?.id || "")} open={refundModal} onCancel={() => setRefundModal(false)} onOk={handleSubmitRefund} okText="确认处理" width={520}>
        {currentException && (
          <Form form={refundForm} layout="vertical">
            <Card size="small" style={{ marginBottom: 16, background: "#fafafa" }}><b>类型：</b><StatusBadge type="exception_type" value={currentException.type} /><br /><b>描述：</b>{currentException.description}<br /><b>现场上报金额：</b>¥{currentException.resultAmount || 0}</Card>
            <Form.Item label="退款/赔付金额（元）" name="refundAmount" rules={[{ required: true, message: "请输入金额" }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="处理结果说明" name="remark" rules={[{ required: true, message: "请填写处理说明" }]}><TextArea rows={3} placeholder="请详细说明处理结果，包括原因、金额、客户反馈等" /></Form.Item>
          </Form>
        )}
      </Modal>
    </Layout>
  );
}
