import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Layout, Tabs, Table, Button, Space, Modal, Form, Select, DatePicker, App, Card, Row, Col, Tag, Statistic } from "antd"
import { PlusOutlined, CarOutlined, TeamOutlined, ExclamationCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, ScheduleOutlined, LogoutOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import StatusBadge from "@/components/StatusBadge"
import { useAuthStore } from "@/store/auth"
import type { Booking, Vehicle, VehicleSchedule, ExceptionRecord, BookingStatus, ScheduleStatus, ExceptionType, CrewMember } from "@/types"
import * as api from "@/services/api"

const { Header, Content } = Layout
const { Option } = Select

const mockBookings: Booking[] = [
  { id: "1", orderNo: "BK20260615001", customerName: "张三", customerPhone: "13800138001", moveFrom: "北京市朝阳区望京SOHO", moveTo: "北京市海淀区中关村软件园", moveDate: "2026-06-15", moveTime: "09:00", items: "家具、家电、衣物约20箱", areaSize: 90, floorFrom: 12, floorTo: 8, hasElevatorFrom: true, hasElevatorTo: true, estimatedPrice: 2800, status: "pending", createdAt: "2026-06-14 10:30:00" },
  { id: "2", orderNo: "BK20260615002", customerName: "李四", customerPhone: "13800138002", moveFrom: "北京市西城区金融街", moveTo: "北京市昌平区回龙观", moveDate: "2026-06-15", moveTime: "14:00", items: "钢琴、保险柜、红木家具", areaSize: 120, floorFrom: 3, floorTo: 15, hasElevatorFrom: false, hasElevatorTo: true, estimatedPrice: 4500, status: "scheduled", createdAt: "2026-06-13 15:20:00" },
  { id: "3", orderNo: "BK20260615003", customerName: "王五", customerPhone: "13800138003", moveFrom: "北京市东城区东直门", moveTo: "北京市通州区运河核心区", moveDate: "2026-06-15", moveTime: "08:00", items: "办公用品、文件、设备", areaSize: 60, floorFrom: 5, floorTo: 1, hasElevatorFrom: true, hasElevatorTo: false, estimatedPrice: 1800, status: "in_progress", createdAt: "2026-06-14 09:15:00" },
  { id: "4", orderNo: "BK20260615004", customerName: "赵六", customerPhone: "13800138004", moveFrom: "上海市浦东新区陆家嘴", moveTo: "上海市闵行区莘庄", moveDate: "2026-06-16", moveTime: "10:00", items: "个人物品", areaSize: 75, floorFrom: 10, floorTo: 6, hasElevatorFrom: true, hasElevatorTo: true, estimatedPrice: 2200, status: "pending", createdAt: "2026-06-14 16:45:00" },
  { id: "5", orderNo: "BK20260615005", customerName: "钱七", customerPhone: "13800138005", moveFrom: "北京市大兴区亦庄", moveTo: "北京市房山区良乡", moveDate: "2026-06-16", moveTime: "07:30", items: "大家电、大型家具、厨房用品", areaSize: 150, floorFrom: 1, floorTo: 3, hasElevatorFrom: true, hasElevatorTo: false, estimatedPrice: 5200, status: "completed", createdAt: "2026-06-12 11:00:00" },
];

const mockVehicles: Vehicle[] = [
  { id: "v1", plateNumber: "京A·12345", type: "4.2米厢式货车", capacity: "4.2T", status: "available", driverName: "王师傅", driverPhone: "13900139001" },
  { id: "v2", plateNumber: "京B·67890", type: "6.8米厢式货车", capacity: "6.8T", status: "busy", driverName: "李师傅", driverPhone: "13900139002" },
  { id: "v3", plateNumber: "京C·54321", type: "9.6米厢式货车", capacity: "9.6T", status: "available", driverName: "张师傅", driverPhone: "13900139003" },
];

const mockCrew: CrewMember[] = [
  { id: "c1", name: "组长A", role: "leader", phone: "13700137001", status: "available" },
  { id: "c2", name: "组长B", role: "leader", phone: "13700137002", status: "available" },
  { id: "c3", name: "搬运工1", role: "worker", phone: "13700137003", status: "available" },
  { id: "c4", name: "搬运工2", role: "worker", phone: "13700137004", status: "available" },
  { id: "c5", name: "搬运工3", role: "worker", phone: "13700137005", status: "busy" },
  { id: "c6", name: "搬运工4", role: "worker", phone: "13700137006", status: "available" },
];

const mockSchedules: VehicleSchedule[] = [
  { id: "s1", bookingId: "2", vehicleId: "v2", leaderId: "c2", departureTime: "2026-06-15 13:00", arrivalTime: "2026-06-15 16:30", status: "pending", createdAt: "2026-06-14 10:00:00" },
  { id: "s2", bookingId: "3", vehicleId: "v1", leaderId: "c1", departureTime: "2026-06-15 07:00", arrivalTime: "2026-06-15 11:00", status: "transporting", createdAt: "2026-06-14 09:00:00" },
];

const mockExceptions: ExceptionRecord[] = [
  { id: "e1", bookingId: "3", scheduleId: "s2", type: "delay", description: "客户小区临时封闭施工，原定路线无法进入，需要绕行约5公里", status: "pending", reportedBy: "c1", reporterName: "组长A", createdAt: "2026-06-15 07:30:00" },
  { id: "e2", bookingId: "2", scheduleId: "s1", type: "surcharge", description: "到现场发现额外物品未申报：两台大型鱼缸及附件，需加人工费", status: "processing", reportedBy: "c2", reporterName: "组长B", resultAmount: 300, createdAt: "2026-06-15 12:00:00" },
  { id: "e3", bookingId: "5", type: "damage", description: "搬运过程中客户古董花瓶外包装完好但内部受损", status: "resolved", reportedBy: "c1", reporterName: "组长A", resultAmount: 200, handleResult: "按照物损约定协商赔付200元，客户确认同意", handledAt: "2026-06-15 18:00:00", createdAt: "2026-06-15 16:00:00" },
];

export default function DispatcherDashboard() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState("bookings");
  const [scheduleModal, setScheduleModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [scheduleForm] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const today = dayjs().format("YYYY-MM-DD");

  const handleScheduleClick = (booking: Booking) => { setCurrentBooking(booking); scheduleForm.resetFields(); setScheduleModal(true); };

  const handleSubmitSchedule = async () => {
    try { const values = await scheduleForm.validateFields(); await api.createSchedule({ bookingId: currentBooking!.id, vehicleId: values.vehicleId, leaderId: values.leaderId, workerIds: values.workerIds, departureTime: values.departureTime?.format("YYYY-MM-DD HH:mm"), arrivalTime: values.arrivalTime?.format("YYYY-MM-DD HH:mm") }); message.success("排班+派工创建成功！"); setScheduleModal(false); }
    catch (e: any) { if (e?.errorFields) return; message.success("排班+派工创建成功！（Mock）"); setScheduleModal(false); } };

  const handleTriggerException = async (type: ExceptionType) => { try { await api.triggerException({ type, bookingId: mockBookings[0].id, scheduleId: mockSchedules[0]?.id }); message.success("已触发模拟异常：" + type); } catch { message.success("已触发模拟异常：" + type + "（Mock）"); } };
  const handleConfirmException = (id: string) => { message.success("异常 " + id + " 已确认处理"); };
  const handleRejectException = (id: string) => { message.warning("异常 " + id + " 已退回"); };

  const bookingsColumns = [
    { title: "订单号", dataIndex: "orderNo", width: 140 },
    { title: "客户", dataIndex: "customerName", width: 80 },
    { title: "搬出地", dataIndex: "moveFrom", ellipsis: true },
    { title: "搬入地", dataIndex: "moveTo", ellipsis: true },
    { title: "时间", width: 150, render: (_: any, r: Booking) => r.moveDate + " " + r.moveTime },
    { title: "预估金额", dataIndex: "estimatedPrice", width: 100, render: (v: number) => "¥" + v },
    { title: "状态", width: 100, dataIndex: "status", render: (s: BookingStatus) => <StatusBadge type="booking" value={s} /> },
    { title: "操作", width: 120, key: "action", render: (_: any, r: Booking) => <Button size="small" type="primary" icon={<ScheduleOutlined />} disabled={r.status !== "pending"} onClick={() => handleScheduleClick(r)}>一键排班</Button> },
  ];

  const exceptionsColumns = [
    { title: "编号", dataIndex: "id", width: 80 },
    { title: "订单号", width: 140, render: (_: any, r: ExceptionRecord) => mockBookings.find(b => b.id === r.bookingId)?.orderNo },
    { title: "类型", width: 100, dataIndex: "type", render: (v: ExceptionType) => <StatusBadge type="exception_type" value={v} /> },
    { title: "描述", dataIndex: "description", ellipsis: true },
    { title: "上报人", dataIndex: "reporterName", width: 100 },
    { title: "状态", width: 100, dataIndex: "status", render: (v: any) => <StatusBadge type="exception" value={v} /> },
    { title: "结果金额", dataIndex: "resultAmount", width: 100, render: (v?: number) => v ? "¥" + v : "-" },
    { title: "操作", width: 180, key: "action", render: (_: any, r: ExceptionRecord) => <Space size="small"><Button size="small" icon={<CheckCircleOutlined />} type="primary" disabled={r.status === "resolved"} onClick={() => handleConfirmException(r.id)}>确认</Button><Button size="small" icon={<CloseCircleOutlined />} danger disabled={r.status === "resolved"} onClick={() => handleRejectException(r.id)}>退回</Button></Space> },
  ];

  const filteredBookings = statusFilter === "all" ? mockBookings : mockBookings.filter(b => b.status === statusFilter);

  const renderBookingPool = () => (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <span>状态筛选：</span>
        { (["all", "pending", "scheduled", "in_progress", "completed"] as const).map(s => (<Button key={s} type={statusFilter === s ? "primary" : "default"} onClick={() => setStatusFilter(s)} size="small">{s === "all" ? "全部" : <StatusBadge type="booking" value={s} />}</Button>)) }
        <Button type="primary" icon={<PlusOutlined />} style={{ marginLeft: "auto" }} onClick={() => message.info("创建预约单功能")}>新建预约</Button>
      </Space>
      <Table rowKey="id" columns={bookingsColumns} dataSource={filteredBookings} size="middle" pagination={{ pageSize: 10 }} />
    </div>
  );

  const renderVehicleSchedule = () => {
    const hours = Array.from({ length: 13 }, (_, i) => i + 7);
    const getVehicleBookings = (vehicleId: string) => mockSchedules.filter(s => s.vehicleId === vehicleId);
    const getStatusColor = (status: ScheduleStatus): string => (({ pending: "#faad14", departed: "#1677ff", arrived_origin: "#722ed1", loading: "#eb2f96", transporting: "#13c2c2", arrived_dest: "#52c41a", unloading: "#fa8c16", completed: "#52c41a" } as any)[status] || "#d9d9d9");
    const getStatusLabel = (status: ScheduleStatus) => (({ pending: "待出车", departed: "已出车", arrived_origin: "已到起点", loading: "装车中", transporting: "运输中", arrived_dest: "已到终点", unloading: "卸车中", completed: "已完成" } as any)[status]);
    return (
      <div style={{ overflowX: "auto" }}>
        <Space style={{ marginBottom: 16, flexWrap: "wrap" }}>
          <Tag color="gold">待出车</Tag><Tag color="blue">已出车</Tag><Tag color="purple">已到起点</Tag><Tag color="magenta">装车中</Tag><Tag color="cyan">运输中</Tag><Tag color="green">已完成</Tag>
          <Tag color="geekblue">{today} 车辆排班时间线</Tag>
        </Space>
        <div style={{ minWidth: 900 }}>
          <div style={{ display: "grid", gridTemplateColumns: "200px repeat(" + hours.length + ", 70px)", borderBottom: "1px solid #f0f0f0", padding: "8px 0", fontWeight: 600, background: "#fafafa" }}>
            <div style={{ paddingLeft: 12 }}>车辆 / 时间</div>
            {hours.map(h => <div key={h} style={{ textAlign: "center" }}>{h.toString().padStart(2, "0")}:00</div>)}
          </div>
          {mockVehicles.map(v => {
            const scheds = getVehicleBookings(v.id);
            return (
              <div key={v.id} style={{ display: "grid", gridTemplateColumns: "200px repeat(" + hours.length + ", 70px)", borderBottom: "1px solid #f0f0f0", padding: "4px 0", alignItems: "center" }}>
                <div style={{ paddingLeft: 12 }}><div><CarOutlined /> {v.plateNumber}</div><div style={{ fontSize: 12, color: "#888" }}>{v.type} · {v.driverName}</div></div>
                {hours.map(h => {
                  const matched = scheds.find(s => { const dep = dayjs(s.departureTime); const arr = dayjs(s.arrivalTime || s.departureTime).add(3, "hour"); return h >= dep.hour() && h <= arr.hour(); });
                  if (matched) { const booking = mockBookings.find(b => b.id === matched.bookingId); return (<div key={h} title={booking?.orderNo + " - " + getStatusLabel(matched.status)} style={{ background: getStatusColor(matched.status), color: "#fff", padding: "8px 2px", textAlign: "center", borderRadius: 4, fontSize: 11 }}>{booking?.orderNo?.slice(-4)}</div>); }
                  return <div key={h} />;
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTodayBoard = () => (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}><Card><Statistic title="今日预约单" value={mockBookings.filter(b => b.moveDate === today).length} /></Card></Col>
        <Col span={6}><Card><Statistic title="今日排班" value={mockSchedules.length} /></Card></Col>
        <Col span={6}><Card><Statistic title="进行中" value={mockSchedules.filter(s => s.status !== "pending" && s.status !== "completed").length} /></Card></Col>
        <Col span={6}><Card><Statistic title="待处理异常" value={mockExceptions.filter(e => e.status !== "resolved").length} valueStyle={{ color: "#cf1322" }} /></Card></Col>
      </Row>
      <Card title="今日排班详情" style={{ marginTop: 16 }}>
        <Table rowKey="id" size="middle" pagination={false} dataSource={mockSchedules} columns={[
          { title: "排班ID", dataIndex: "id", width: 80 },
          { title: "订单号", width: 140, render: (_: any, r: VehicleSchedule) => mockBookings.find(b => b.id === r.bookingId)?.orderNo },
          { title: "车辆", width: 150, render: (_: any, r: VehicleSchedule) => mockVehicles.find(v => v.id === r.vehicleId)?.plateNumber },
          { title: "组长", width: 100, render: (_: any, r: VehicleSchedule) => mockCrew.find(c => c.id === r.leaderId)?.name },
          { title: "出发时间", dataIndex: "departureTime", width: 160 },
          { title: "状态", dataIndex: "status", width: 100, render: (s: ScheduleStatus) => <StatusBadge type="schedule" value={s} /> },
        ]} />
      </Card>
    </div>
  );

  const renderExceptionCenter = () => (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <span><ExclamationCircleOutlined style={{ color: "#faad14" }} /> 模拟触发异常测试：</span>
        <Button size="small" onClick={() => handleTriggerException("delay")}>延误</Button>
        <Button size="small" type="primary" onClick={() => handleTriggerException("surcharge")}>加价</Button>
        <Button size="small" danger onClick={() => handleTriggerException("damage")}>物损</Button>
      </Space>
      <Table rowKey="id" columns={exceptionsColumns} dataSource={mockExceptions} size="middle" pagination={{ pageSize: 10 }} />
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#fff", padding: "0 24px", display: "flex", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
        <span style={{ fontSize: 18, fontWeight: 600 }}><ScheduleOutlined /> 搬家管理系统 - 调度面板</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <span><TeamOutlined /> {user?.name}（调度员）</span>
          <Button size="small" icon={<LogoutOutlined />} onClick={() => { logout(); navigate("/login"); }}>退出</Button>
        </div>
      </Header>
      <Content style={{ padding: 24 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          { key: "bookings", label: "预约单池", children: renderBookingPool() },
          { key: "schedules", label: "车辆排班", children: renderVehicleSchedule() },
          { key: "today", label: "今日看板", children: renderTodayBoard() },
          { key: "exceptions", label: "异常中心", children: renderExceptionCenter() },
        ]} />
      </Content>
      <Modal title={"一键排班 - " + (currentBooking?.orderNo || "")} open={scheduleModal} onCancel={() => setScheduleModal(false)} onOk={handleSubmitSchedule} okText="提交排班+派工" width={640}>
        {currentBooking && (
          <Form form={scheduleForm} layout="vertical">
            <Card size="small" style={{ marginBottom: 16, background: "#fafafa" }}>
              <div>📦 <b>{currentBooking.customerName}</b>：{currentBooking.moveFrom} → {currentBooking.moveTo}</div>
              <div style={{ color: "#666", marginTop: 4 }}>📅 {currentBooking.moveDate} {currentBooking.moveTime} · 约{currentBooking.areaSize}㎡ · ¥{currentBooking.estimatedPrice}</div>
            </Card>
            <Row gutter={16}>
              <Col span={12}><Form.Item label="选择车辆" name="vehicleId" rules={[{ required: true, message: "请选择车辆" }]}><Select placeholder="请选择车辆">{mockVehicles.filter(v => v.status === "available").map(v => <Option key={v.id} value={v.id}>{v.plateNumber} - {v.type}（{v.driverName}）</Option>)}</Select></Form.Item></Col>
              <Col span={12}><Form.Item label="选择组长" name="leaderId" rules={[{ required: true, message: "请选择组长" }]}><Select placeholder="请选择组长">{mockCrew.filter(c => c.role === "leader").map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}</Select></Form.Item></Col>
              <Col span={24}><Form.Item label="选择搬运工（多选）" name="workerIds" rules={[{ required: true, message: "请选择至少1名搬运工" }]}><Select mode="multiple" placeholder="请选择搬运工">{mockCrew.filter(c => c.role === "worker").map(c => <Option key={c.id} value={c.id}>{c.name}（{c.status === "available" ? "空闲" : "忙"}）</Option>)}</Select></Form.Item></Col>
              <Col span={12}><Form.Item label="出发时间" name="departureTime" rules={[{ required: true, message: "请选择出发时间" }]}><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: "100%" }} /></Form.Item></Col>
              <Col span={12}><Form.Item label="预计到达时间" name="arrivalTime" rules={[{ required: true, message: "请选择到达时间" }]}><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: "100%" }} /></Form.Item></Col>
            </Row>
          </Form>
        )}
      </Modal>
    </Layout>
  );
}
