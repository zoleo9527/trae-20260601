import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Layout, Tabs, Table, Button, Space, Modal, Form, Select, App, Card, Upload, Input, InputNumber } from "antd"
import { CarOutlined, TeamOutlined, ExclamationCircleOutlined, LogoutOutlined, UploadOutlined } from "@ant-design/icons"
import StatusBadge from "@/components/StatusBadge"
import { useAuthStore } from "@/store/auth"
import type { VehicleSchedule, ScheduleStatus, ExceptionType, UpdateScheduleStatusRequest } from "@/types"
import * as api from "@/services/api"

const { Header, Content } = Layout
const { Option } = Select
const { TextArea } = Input

const statusFlow: { status: ScheduleStatus; label: string }[] = [
  { status: "pending", label: "待出车" },
  { status: "departed", label: "出车" },
  { status: "arrived_origin", label: "到达" },
  { status: "loading", label: "装车" },
  { status: "transporting", label: "运输" },
  { status: "arrived_dest", label: "到终点" },
  { status: "unloading", label: "卸车" },
  { status: "completed", label: "完成" },
];

const todaySchedules: (VehicleSchedule & { orderNo?: string; customerName?: string; route?: string })[] = [
  { id: "s2", bookingId: "3", vehicleId: "v1", leaderId: "c1", departureTime: "2026-06-15 07:00", arrivalTime: "2026-06-15 11:00", status: "transporting", createdAt: "2026-06-14 09:00:00", orderNo: "BK20260615003", customerName: "王五", route: "东直门 → 运河核心区" },
  { id: "s1", bookingId: "2", vehicleId: "v2", leaderId: "c2", departureTime: "2026-06-15 13:00", arrivalTime: "2026-06-15 16:30", status: "pending", createdAt: "2026-06-14 10:00:00", orderNo: "BK20260615002", customerName: "李四", route: "金融街 → 回龙观" },
];

export default function LeaderDashboard() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState("assignments");
  const [exceptionModal, setExceptionModal] = useState(false);
  const [currentScheduleId, setCurrentScheduleId] = useState<string>("");
  const [exceptionForm] = Form.useForm();
  const [schedules, setSchedules] = useState(todaySchedules);

  const handleStatusChange = async (scheduleId: string, nextStatus: ScheduleStatus) => {
    try { await api.updateScheduleStatus(scheduleId, ({ status: nextStatus } as UpdateScheduleStatusRequest)); } catch {}
    setSchedules(prev => prev.map(s => s.id === scheduleId ? { ...s, status: nextStatus } : s));
    message.success("状态已更新为：" + statusFlow.find(f => f.status === nextStatus)?.label);
  };
  const getCurrentStatusIndex = (s: ScheduleStatus) => statusFlow.findIndex(f => f.status === s);

  const handleSubmitException = async () => {
    try {
      const values = await exceptionForm.validateFields();
      await api.createException({ bookingId: schedules.find(s => s.id === currentScheduleId)?.bookingId || "", scheduleId: currentScheduleId, type: values.type, description: values.description, resultAmount: values.resultAmount });
      message.success("异常已上报，已自动通知调度员和客服！");
    } catch (e: any) { if (e?.errorFields) return; message.success("异常已上报（Mock）"); }
    setExceptionModal(false); exceptionForm.resetFields();
  };

  const renderAssignments = () => (
    <Table rowKey="id" dataSource={schedules} size="middle" pagination={false} columns={[
      { title: "订单号", dataIndex: "orderNo", width: 140 },
      { title: "客户", dataIndex: "customerName", width: 80 },
      { title: "路线", dataIndex: "route", ellipsis: true },
      { title: "当前状态", width: 120, dataIndex: "status", render: (s: ScheduleStatus) => <StatusBadge type="schedule" value={s} /> },
      { title: "状态流转（一排按钮点击流转）", key: "flow", width: 520, render: (_: any, r: VehicleSchedule) => {
        const idx = getCurrentStatusIndex(r.status);
        return (
          <Space size={4} wrap>
            {statusFlow.map((f, i) => {
              const isCurrent = i === idx; const isDone = i < idx; const isNext = i === idx + 1;
              let btnType: any = "default"; if (isCurrent) btnType = "primary"; if (isDone) btnType = "dashed";
              return (
                <Button key={f.status} size="small" type={btnType} disabled={!isNext && !isCurrent} onClick={() => isNext && handleStatusChange(r.id, f.status)}>
                  {isDone ? "✓ " : ""}{f.label}
                </Button>
              );
            })}
          </Space>
        );
      }},
      { title: "异常", width: 100, key: "ex", render: (_: any, r: VehicleSchedule) => (
        <Button size="small" danger icon={<ExclamationCircleOutlined />} onClick={() => { setCurrentScheduleId(r.id); exceptionForm.resetFields(); setExceptionModal(true); }}>上报异常</Button>
      )},
    ]} />
  );

  const renderExceptionReport = () => (
    <Card title="异常上报说明" style={{ maxWidth: 720 }}>
      <p>在「今日派工」表格中点击任意任务右侧的 <b>【上报异常】</b> 按钮，即可打开异常上报表单。</p>
      <p>表单支持：选择异常类型（延误/加价/物损）、填写结果金额、上传物损照片、填写说明，<b>一步提交</b>。</p>
    </Card>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#fff", padding: "0 24px", display: "flex", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
        <span style={{ fontSize: 18, fontWeight: 600 }}><CarOutlined /> 搬家管理系统 - 组长面板</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <span><TeamOutlined /> {user?.name}（组长）</span>
          <Button size="small" icon={<LogoutOutlined />} onClick={() => { logout(); navigate("/login"); }}>退出</Button>
        </div>
      </Header>
      <Content style={{ padding: 24 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          { key: "assignments", label: "今日派工", children: renderAssignments() },
          { key: "exception", label: "异常上报", children: renderExceptionReport() },
        ]} />
      </Content>
      <Modal title="异常上报 - 一步提交" open={exceptionModal} onCancel={() => setExceptionModal(false)} onOk={handleSubmitException} okText="提交并通知" width={600}>
        <Form form={exceptionForm} layout="vertical">
          <Form.Item label="异常类型" name="type" rules={[{ required: true, message: "请选择异常类型" }]}><Select placeholder="请选择"><Option value="delay">延误</Option><Option value="surcharge">加价</Option><Option value="damage">物损</Option></Select></Form.Item>
          <Form.Item label="结果金额（元）" name="resultAmount"><InputNumber placeholder="加价金额或赔付金额" style={{ width: "100%" }} min={0} /></Form.Item>
          <Form.Item label="异常描述说明" name="description" rules={[{ required: true, message: "请填写异常说明" }]}><TextArea rows={3} placeholder="请详细描述异常情况，包括原因、预计影响等" /></Form.Item>
          <Form.Item label="物损照片（可选，支持多张）" name="photos"><Upload listType="picture-card" multiple beforeUpload={() => false}><UploadOutlined /><div style={{ marginTop: 8 }}>上传照片</div></Upload></Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
