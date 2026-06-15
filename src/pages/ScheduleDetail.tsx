import { useParams, useNavigate } from 'react-router-dom';
import {
  Descriptions,
  Tag,
  Button,
  Space,
  Card,
  Table,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Divider,
  Steps,
} from 'antd';
import { ArrowLeftOutlined, CameraOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { useApi } from '@/services/api';
import { useWorkflow } from '@/hooks/useWorkflow';
import {
  statusDisplayMap,
  roleDisplayMap,
} from '@/utils/stateMachine';
import ActionButtons from '@/components/ActionButtons';
import AuditTimeline from '@/components/AuditTimeline';
import MaterialPickupDialog from '@/components/MaterialPickupDialog';
import type { ColumnsType } from 'antd/es/table';
import type { MaterialPickup, InstallationRecord, ExceptionRecord } from '@/types';

const stepTitles = [
  '草稿',
  '已提交',
  '材料已确认',
  '喷绘中',
  '喷绘完成',
  '安装中',
  '已完成',
];

const stepStatusMap: Record<string, number> = {
  draft: 0,
  submitted: 1,
  material_confirmed: 2,
  printing: 3,
  printed: 4,
  installing: 5,
  completed: 6,
  cancelled: 0,
};

export default function ScheduleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = useApi();
  const workflow = useWorkflow();
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [installTimeDialogOpen, setInstallTimeDialogOpen] = useState(false);
  const [colorComplaintDialog, setColorComplaintDialog] = useState(false);
  const [form] = Form.useForm();

  const schedule = api.getScheduleById(id || '');
  const materialPickups = id ? api.getMaterialPickupsByScheduleId(id) : [];
  const installation = id ? api.getInstallationByScheduleId(id) : null;
  const exceptions = id ? api.getExceptionsByScheduleId(id) : [];
  const auditLogs = id ? api.getAuditLogsByEntity('schedule', id) : [];
  const materialLogs = materialPickups.flatMap((p) =>
    api.getAuditLogsByEntity('material', p.id)
  );
  const installLogs = installation
    ? api.getAuditLogsByEntity('installation', installation.id)
    : [];
  const allLogs = [...auditLogs, ...materialLogs, ...installLogs].sort(
    (a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf()
  );

  useEffect(() => {
    if (!schedule) {
      message.error('排产不存在');
      navigate('/schedules');
    }
  }, [schedule, navigate]);

  if (!schedule) return null;

  const currentStep = stepStatusMap[schedule.status] ?? 0;

  const pickupColumns: ColumnsType<MaterialPickup> = [
    {
      title: '领用单号',
      dataIndex: 'pickupNo',
      key: 'pickupNo',
    },
    {
      title: '材料明细',
      key: 'items',
      render: (_, record) => (
        <div>
          {record.items.map((item, idx) => (
            <div key={idx}>
              {item.materialType} {item.specification} × {item.quantity}
              {item.unit}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v) => `¥${v.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Tag color={statusDisplayMap[s]?.color}>{statusDisplayMap[s]?.text}</Tag>
      ),
    },
    {
      title: '操作人',
      key: 'operator',
      render: (_, record) => {
        const user = api.getAllUsers().find((u) => u.id === record.pickedBy);
        return (
          <span>
            {user?.name} ({roleDisplayMap[user?.role || 'reception']})
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <ActionButtons
          actions={workflow.getMaterialPickupAvailableActions(record.status)}
          onAction={(target) =>
            workflow.transitionMaterialPickup(record.id, target as any)
          }
          entityType="material"
          entityId={record.id}
        />
      ),
    },
  ];

  const exceptionColumns: ColumnsType<ExceptionRecord> = [
    {
      title: '异常类型',
      dataIndex: 'type',
      key: 'type',
      render: (t) => {
        const map: Record<string, string> = {
          size_error: '尺寸错误',
          color_complaint: '色差投诉',
          install_time_change: '安装时间变更',
          other: '其他问题',
        };
        return <Tag color="orange">{map[t] || t}</Tag>;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Tag
          color={s === 'resolved' ? 'green' : s === 'pending' ? 'gold' : 'default'}
        >
          {s === 'resolved' ? '已解决' : s === 'pending' ? '待处理' : '已关闭'}
        </Tag>
      ),
    },
    {
      title: '上报人',
      key: 'reporter',
      render: (_, record) => {
        const user = api.getAllUsers().find((u) => u.id === record.reportedBy);
        return user?.name || record.reportedBy;
      },
    },
    {
      title: '解决方案',
      dataIndex: 'resolution',
      key: 'resolution',
    },
  ];

  const handleInstallTimeChange = () => {
    form.validateFields().then((values) => {
      if (installation) {
        workflow.changeInstallTime(
          installation.id,
          values.newDate.format('YYYY-MM-DD'),
          values.reason
        );
        setInstallTimeDialogOpen(false);
        form.resetFields();
      }
    });
  };

  const handleColorComplaint = () => {
    form.validateFields().then((values) => {
      workflow.reportColorComplaint(schedule.id, values.description);
      setColorComplaintDialog(false);
      form.resetFields();
    });
  };

  const getSubmittedBy = () => {
    const user = api.getAllUsers().find((u) => u.id === schedule.submittedBy);
    return user ? `${user.name} (${roleDisplayMap[user.role]})` : schedule.submittedBy;
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/schedules')}>
          返回列表
        </Button>
        <h2 style={{ margin: 0 }}>排产详情 - {schedule.scheduleNo}</h2>
        <Tag color={statusDisplayMap[schedule.status]?.color}>
          {statusDisplayMap[schedule.status]?.text}
        </Tag>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Steps
          current={schedule.status === 'cancelled' ? 0 : currentStep}
          items={stepTitles.map((title, idx) => ({
            title,
            status:
              schedule.status === 'cancelled'
                ? 'error'
                : idx < currentStep
                ? 'finish'
                : idx === currentStep
                ? 'process'
                : 'wait',
          }))}
        />
      </Card>

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="排产编号">{schedule.scheduleNo}</Descriptions.Item>
          <Descriptions.Item label="订单编号">{schedule.orderNo}</Descriptions.Item>
          <Descriptions.Item label="客户名称">{schedule.customerName}</Descriptions.Item>
          <Descriptions.Item label="提交人">{getSubmittedBy()}</Descriptions.Item>
          <Descriptions.Item label="喷绘内容">{schedule.content}</Descriptions.Item>
          <Descriptions.Item label="数量">{schedule.quantity} 份</Descriptions.Item>
          <Descriptions.Item label="尺寸">
            {schedule.width} × {schedule.height} {schedule.unit}
          </Descriptions.Item>
          <Descriptions.Item label="材料类型">{schedule.materialType}</Descriptions.Item>
          <Descriptions.Item label="颜色要求">{schedule.colorRequirement}</Descriptions.Item>
          <Descriptions.Item label="优先级">
            <Tag
              color={
                schedule.priority === 'emergency'
                  ? 'red'
                  : schedule.priority === 'urgent'
                  ? 'orange'
                  : 'default'
              }
            >
              {schedule.priority === 'emergency'
                ? '特急'
                : schedule.priority === 'urgent'
                ? '加急'
                : '普通'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="安装地址" span={2}>
            {schedule.installationAddress}
          </Descriptions.Item>
          <Descriptions.Item label="预计安装日期">{schedule.scheduledInstallDate}</Descriptions.Item>
          <Descriptions.Item label="实际安装日期">{schedule.actualInstallDate || '-'}</Descriptions.Item>
          {schedule.remark && (
            <Descriptions.Item label="备注" span={2}>
              {schedule.remark}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card
        title="可用操作"
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Button onClick={() => setColorComplaintDialog(true)}>
              上报色差投诉
            </Button>
            <Button onClick={() => setInstallTimeDialogOpen(true)}>
              变更安装时间
            </Button>
          </Space>
        }
      >
        <ActionButtons
          actions={workflow.getScheduleAvailableActions(schedule.status)}
          onAction={(target, remark) =>
            workflow.transitionSchedule(schedule.id, target as any, remark)
          }
          entityType="schedule"
          entityId={schedule.id}
          showMaterialDialog={() => setMaterialDialogOpen(true)}
        />
      </Card>

      {schedule.status === 'submitted' && materialPickups.length === 0 && (
        <Card style={{ marginBottom: 16 }}>
          <p style={{ color: 'orange' }}>
            ⚠️ 请先登记材料领用，然后确认材料领用后才能开始喷绘
          </p>
          <Button type="primary" onClick={() => setMaterialDialogOpen(true)}>
            登记材料领用
          </Button>
        </Card>
      )}

      <Card title="材料领用记录" style={{ marginBottom: 16 }}>
        <Table
          columns={pickupColumns}
          dataSource={materialPickups}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {installation && (
        <Card title="安装记录" style={{ marginBottom: 16 }}>
          <Descriptions column={2}>
            <Descriptions.Item label="安装状态">
              <Tag color={statusDisplayMap[installation.status]?.color}>
                {statusDisplayMap[installation.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="计划安装日期">{installation.scheduledDate}</Descriptions.Item>
            <Descriptions.Item label="实际安装日期">{installation.actualDate || '-'}</Descriptions.Item>
            <Descriptions.Item label="安装人员">
              {installation.installers.length > 0
                ? installation.installers.join('、')
                : '待安排'}
            </Descriptions.Item>
            <Descriptions.Item label="客户签字">
              {installation.customerSigned ? (
                <span style={{ color: 'green' }}>
                  已签字 ({installation.signerName})
                </span>
              ) : (
                <span style={{ color: '#999' }}>未签字</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="安装照片">
              {installation.photos.length > 0 ? (
                <Space>
                  {installation.photos.map((photo, idx) => (
                    <Button
                      key={idx}
                      icon={<CameraOutlined />}
                      onClick={() => message.info('查看照片: ' + photo)}
                    >
                      照片 {idx + 1}
                    </Button>
                  ))}
                </Space>
              ) : (
                <span style={{ color: '#999' }}>暂无照片</span>
              )}
            </Descriptions.Item>
            {installation.remark && (
              <Descriptions.Item label="备注" span={2}>
                {installation.remark}
              </Descriptions.Item>
            )}
          </Descriptions>
          <Divider />
          <h4>安装操作</h4>
          <ActionButtons
            actions={workflow.getInstallationAvailableActions(installation.status)}
            onAction={(target, remark) =>
              workflow.transitionInstallation(installation.id, target as any, {
                remark,
              })
            }
            entityType="installation"
            entityId={installation.id}
            showInstallTimeDialog={() => setInstallTimeDialogOpen(true)}
          />
        </Card>
      )}

      {exceptions.length > 0 && (
        <Card title="异常记录" style={{ marginBottom: 16 }}>
          <Table
            columns={exceptionColumns}
            dataSource={exceptions}
            rowKey="id"
            pagination={false}
          />
        </Card>
      )}

      <Card title="操作留痕 (审计日志)">
        <AuditTimeline logs={allLogs} />
      </Card>

      <MaterialPickupDialog
        open={materialDialogOpen}
        onCancel={() => setMaterialDialogOpen(false)}
        scheduleId={schedule.id}
        onSuccess={() => setMaterialDialogOpen(false)}
      />

      <Modal
        title="变更安装时间"
        open={installTimeDialogOpen}
        onOk={handleInstallTimeChange}
        onCancel={() => {
          setInstallTimeDialogOpen(false);
          form.resetFields();
        }}
        okText="确认变更"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="newDate" label="新安装日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="reason" label="变更原因" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="请输入变更原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="上报色差投诉"
        open={colorComplaintDialog}
        onOk={handleColorComplaint}
        onCancel={() => {
          setColorComplaintDialog(false);
          form.resetFields();
        }}
        okText="提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="description" label="问题描述" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请详细描述色差问题" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
