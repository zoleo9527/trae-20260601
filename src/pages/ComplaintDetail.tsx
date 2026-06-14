import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  UserPlus,
  AlertTriangle,
  Undo2,
  TrendingUp,
  PhoneCall,
  CheckSquare,
  Edit3,
  FileText,
  User,
  Phone,
  Hash,
  Clock,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ComplaintStatusBadge, VisitStatusBadge } from '@/components/ui/StatusBadge';
import { Timeline } from '@/components/ui/Timeline';
import { Modal } from '@/components/ui/Modal';
import { Input, Label, Select, Textarea } from '@/components/ui/Form';
import {
  COMPLAINT_CATEGORY_LABEL,
  ROLE_LABEL,
  type ComplaintStatus,
  type RoleType,
} from '@/types';
import { cn, formatDateTime, timeAgo } from '@/lib/utils';

const ABNORMAL_RULES = [
  '客户为VIP且投诉服务态度',
  '投诉涉及资金安全/账务差错',
  '超时4小时未闭环',
  '回访客户明确不满意',
  '被主管退回超过2次',
  '客户表示将投诉至监管机构',
];

const ComplaintDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentUser,
    getComplaint,
    getVisit,
    usersByRole,
    assignComplaint,
    updateComplaintStatus,
    escalateComplaint,
    rejectComplaint,
    resolveComplaint,
    triggerAbnormalSample,
    createVisitFromComplaint,
  } = useApp();

  const complaint = id ? getComplaint(id) : undefined;
  const isLobby = currentUser.role === 'lobby';
  const isManager = currentUser.role === 'manager';
  const isSupervisor = currentUser.role === 'supervisor';

  const [assignOpen, setAssignOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [abnormalOpen, setAbnormalOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);

  if (!complaint) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        找不到该投诉记录
        <div className="mt-4">
          <Button onClick={() => navigate('/complaints')}>返回列表</Button>
        </div>
      </div>
    );
  }

  const visits = complaint.visits.map((v) => getVisit(v)).filter(Boolean) as ReturnType<typeof getVisit>[];
  const managers = usersByRole('manager');

  const InfoRow: React.FC<{ icon: React.ElementType; label: string; children: React.ReactNode }> = ({
    icon: Icon,
    label,
    children,
  }) => (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="mt-0.5 text-slate-400" />
      <div className="text-sm">
        <span className="text-slate-500">{label}：</span>
        <span className="text-slate-800">{children}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/complaints')}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold text-slate-900">{complaint.title}</h1>
            <ComplaintStatusBadge status={complaint.status} />
            {complaint.isAbnormal && (
              <Badge tone="danger" dot>
                <AlertTriangle size={12} className="mr-0.5" />
                异常
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="font-mono">{complaint.code}</span>
            <span>登记：{timeAgo(complaint.registeredAt)} · {complaint.registeredByName}</span>
            {complaint.branch && <span>{complaint.branch}</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSupervisor && complaint.status === 'registered' && (
            <Button leftIcon={<UserPlus size={15} />} onClick={() => setAssignOpen(true)}>
              分派给客户经理
            </Button>
          )}
          {isManager && complaint.handlerId === currentUser.id &&
            (complaint.status === 'assigned' || complaint.status === 'rejected') && (
              <Button onClick={() => updateComplaintStatus(complaint.id, 'investigating', '已开始调查，调阅业务单据和监控录像')}>
                开始调查
              </Button>
            )}
          {isManager && complaint.handlerId === currentUser.id && complaint.status === 'investigating' && (
            <Button variant="secondary" leftIcon={<Edit3 size={15} />} onClick={() => setUpdateOpen(true)}>
              更新调查进展
            </Button>
          )}
          {isManager && complaint.handlerId === currentUser.id && complaint.status === 'investigating' && (
            <Button leftIcon={<CheckSquare size={15} />} onClick={() => setResolveOpen(true)}>
              处理完成待回访
            </Button>
          )}
          {isSupervisor && complaint.status !== 'resolved' && complaint.status !== 'escalated' && (
            <Button variant="warning" leftIcon={<TrendingUp size={15} />} onClick={() => setEscalateOpen(true)}>
              升级处理
            </Button>
          )}
          {isSupervisor && (complaint.status === 'investigating' || complaint.status === 'assigned') && (
            <Button variant="danger" leftIcon={<Undo2 size={15} />} onClick={() => setRejectOpen(true)}>
              退回补材料
            </Button>
          )}
          {(complaint.status === 'pending_verification' || complaint.status === 'investigating') && (
            <Button variant="secondary" leftIcon={<PhoneCall size={15} />} onClick={() => setVisitOpen(true)}>
              创建回访任务
            </Button>
          )}
          <Button variant="outline" leftIcon={<Sparkles size={15} />} onClick={() => setAbnormalOpen(true)}>
            触发异常样例
          </Button>
        </div>
      </div>

      {complaint.isAbnormal && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <ShieldAlert size={18} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-red-700">异常提醒</div>
            <p className="mt-1 text-sm text-red-600">{complaint.abnormalReason ?? '该投诉触发异常规则，请重点关注。'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>投诉详情</CardTitle>
              <Badge tone="primary">{COMPLAINT_CATEGORY_LABEL[complaint.category]}</Badge>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {complaint.content}
              </p>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                <InfoRow icon={Hash} label="排队号/窗口">
                  {complaint.queueNo ? (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5">
                      {complaint.queueNo}{complaint.counterNo ? ` · ${complaint.counterNo}` : ''}
                    </span>
                  ) : (
                    <span className="text-slate-400">无</span>
                  )}
                </InfoRow>
                <InfoRow icon={Clock} label="登记时间">
                  {formatDateTime(complaint.registeredAt)}
                </InfoRow>
              </div>
              {complaint.resolution && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                  <div className="mb-1 text-xs font-medium text-emerald-700">处理方案</div>
                  <p className="text-sm leading-relaxed text-emerald-800">{complaint.resolution}</p>
                  {complaint.resolvedAt && (
                    <div className="mt-2 text-xs text-emerald-600">提交于 {formatDateTime(complaint.resolvedAt)}</div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>处理时间线</CardTitle>
              <span className="text-xs text-slate-500">共 {complaint.timeline.length} 条记录</span>
            </CardHeader>
            <CardBody>
              <Timeline events={complaint.timeline} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>客户信息</CardTitle>
              {complaint.customer.level === 'vip' && <Badge tone="warning">VIP</Badge>}
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bank-100 text-bank-700">
                  <User size={18} />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">{complaint.customer.name}</div>
                  <div className="text-xs text-slate-500">个人客户</div>
                </div>
              </div>
              <div className="space-y-2 border-t border-slate-100 pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500"><Phone size={13} /> 手机号</span>
                  <span className="text-slate-800">{complaint.customer.phone}</span>
                </div>
                {complaint.customer.accountNo && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500"><FileText size={13} /> 账号</span>
                    <span className="font-mono text-slate-800">{complaint.customer.accountNo}</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>责任交接</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-slate-500">登记人（大堂）</span>
                <span className="font-medium text-slate-800">{complaint.registeredByName}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-slate-500">处理人（经理）</span>
                <span className={cn('font-medium', complaint.handlerName ? 'text-slate-800' : 'text-slate-400')}>
                  {complaint.handlerName ?? '未分派'}
                </span>
              </div>
              {complaint.assignedAt && (
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">分派时间</span>
                  <span className="text-slate-800">{formatDateTime(complaint.assignedAt)}</span>
                </div>
              )}
              <p className="text-xs text-slate-400">
                登记人负责现场客户安抚和资料交接，处理人负责调查、方案和回访闭环，主管负责分派、监督和异常升级。
              </p>
            </CardBody>
          </Card>

          {visits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>回访记录</CardTitle>
                <span className="text-xs text-slate-500">{visits.length} 次</span>
              </CardHeader>
              <CardBody className="space-y-2">
                {visits.map((v) =>
                  v ? (
                    <Link
                      key={v.id}
                      to={`/visits/${v.id}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 hover:bg-slate-50"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          {v.assigneeName} · {ROLE_LABEL[v.assigneeRole]}
                        </div>
                        <div className="text-xs text-slate-500">{formatDateTime(v.assignedAt)}</div>
                      </div>
                      <VisitStatusBadge status={v.status} />
                    </Link>
                  ) : null,
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={assignOpen}
        title="分派投诉处理人"
        onClose={() => setAssignOpen(false)}
        footer={
          <AssignFooter complaintId={complaint.id} managers={managers} onClose={() => setAssignOpen(false)} />
        }
      >
        <Label>选择客户经理</Label>
        <div id="assign-target" data-cid={complaint.id} />
      </Modal>

      {escalateOpen && (
        <EscalateModal
          onClose={() => setEscalateOpen(false)}
          onConfirm={(reason) => {
            escalateComplaint(complaint.id, reason);
            setEscalateOpen(false);
          }}
        />
      )}

      {rejectOpen && (
        <RejectModal
          onClose={() => setRejectOpen(false)}
          onConfirm={(reason) => {
            rejectComplaint(complaint.id, reason);
            setRejectOpen(false);
          }}
        />
      )}

      {resolveOpen && (
        <ResolveModal
          onClose={() => setResolveOpen(false)}
          onConfirm={(text) => {
            resolveComplaint(complaint.id, text);
            setResolveOpen(false);
          }}
        />
      )}

      {updateOpen && (
        <UpdateProgressModal
          currentStatus={complaint.status}
          onClose={() => setUpdateOpen(false)}
          onConfirm={(text) => {
            updateComplaintStatus(complaint.id, complaint.status, text);
            setUpdateOpen(false);
          }}
        />
      )}

      {abnormalOpen && (
        <TriggerAbnormalModal
          onClose={() => setAbnormalOpen(false)}
          onConfirm={(rule) => {
            triggerAbnormalSample(complaint.id, rule);
            setAbnormalOpen(false);
          }}
        />
      )}

      {visitOpen && (
        <CreateVisitModal
          complaintId={complaint.id}
          managers={managers}
          defaultAssignee={complaint.handlerId}
          onClose={() => setVisitOpen(false)}
          onConfirm={(assigneeId) => {
            createVisitFromComplaint(complaint.id, assigneeId);
            setVisitOpen(false);
          }}
        />
      )}
    </div>
  );
};

const AssignFooter: React.FC<{
  complaintId: string;
  managers: { id: string; name: string; role: RoleType; phone?: string }[];
  onClose: () => void;
}> = ({ complaintId, managers, onClose }) => {
  const { assignComplaint } = useApp();
  const [handlerId, setHandlerId] = useState(managers[0]?.id ?? '');
  return (
    <>
      <div className="mr-auto flex items-center gap-2">
        <Select value={handlerId} onChange={(e) => setHandlerId(e.target.value)} className="w-48">
          {managers.map((m) => (
            <option key={m.id} value={m.id}>{m.name} · {ROLE_LABEL[m.role]}</option>
          ))}
        </Select>
      </div>
      <Button variant="outline" onClick={onClose}>取消</Button>
      <Button
        disabled={!handlerId}
        onClick={() => {
          assignComplaint(complaintId, handlerId);
          onClose();
        }}
      >
        确认分派
      </Button>
    </>
  );
};

const EscalateModal: React.FC<{
  onClose: () => void;
  onConfirm: (reason: string) => void;
}> = ({ onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const preset = ['客户情绪激动，有投诉监管倾向', '涉及资金损失，风险较高', '超过24小时仍未闭环', '需分行或科技部门协同'];
  return (
    <Modal
      open
      title="升级投诉处理"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button variant="warning" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>确认升级</Button>
        </>
      }
    >
      <Label required>升级原因</Label>
      <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="请说明升级原因及上报层级" />
      <div className="mt-3 flex flex-wrap gap-2">
        {preset.map((p) => (
          <button
            key={p}
            onClick={() => setReason(p)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:border-bank-400 hover:text-bank-600"
          >
            {p}
          </button>
        ))}
      </div>
    </Modal>
  );
};

const RejectModal: React.FC<{
  onClose: () => void;
  onConfirm: (reason: string) => void;
}> = ({ onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const preset = ['调查材料不完整，请补充双录证据', '缺少客户签字确认书', '处理方案不明确，无法回访', '需补充涉及单据/流水'];
  return (
    <Modal
      open
      title="退回补充材料"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button variant="danger" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>确认退回</Button>
        </>
      }
    >
      <Label required>退回原因</Label>
      <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="请描述退回原因和需要补充的材料" />
      <div className="mt-3 flex flex-wrap gap-2">
        {preset.map((p) => (
          <button
            key={p}
            onClick={() => setReason(p)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:border-red-300 hover:text-red-600"
          >
            {p}
          </button>
        ))}
      </div>
    </Modal>
  );
};

const ResolveModal: React.FC<{
  onClose: () => void;
  onConfirm: (text: string) => void;
}> = ({ onClose, onConfirm }) => {
  const [text, setText] = useState('');
  return (
    <Modal
      open
      title="提交处理方案"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button disabled={!text.trim()} onClick={() => onConfirm(text.trim())}>提交并生成回访</Button>
        </>
      }
    >
      <Label required>处理结果说明</Label>
      <Textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="说明调查结论、整改措施、客户补偿方案等，提交后将进入待回访状态"
      />
    </Modal>
  );
};

const UpdateProgressModal: React.FC<{
  currentStatus: ComplaintStatus;
  onClose: () => void;
  onConfirm: (text: string) => void;
}> = ({ onClose, onConfirm }) => {
  const [text, setText] = useState('');
  const preset = ['已联系客户，约定面谈时间', '已调阅业务单据，正在核对', '已与相关柜员谈话，形成初步结论', '已协调科技部门排查系统日志'];
  return (
    <Modal
      open
      title="更新调查进展"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button variant="secondary" disabled={!text.trim()} onClick={() => onConfirm(text.trim())}>保存进展</Button>
        </>
      }
    >
      <Label required>进展说明</Label>
      <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="简要说明当前调查进展" />
      <div className="mt-3 flex flex-wrap gap-2">
        {preset.map((p) => (
          <button
            key={p}
            onClick={() => setText(p)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:border-bank-400 hover:text-bank-600"
          >
            {p}
          </button>
        ))}
      </div>
    </Modal>
  );
};

const TriggerAbnormalModal: React.FC<{
  onClose: () => void;
  onConfirm: (rule: string) => void;
}> = ({ onClose, onConfirm }) => (
  <Modal
    open
    title="触发异常样例 / 模拟提醒"
    onClose={onClose}
  >
    <p className="mb-3 text-sm text-slate-600">
      点击下方任一规则，将模拟该投诉命中异常提醒，便于验证流程是否正确接住该场景。
    </p>
    <div className="space-y-2">
      {ABNORMAL_RULES.map((rule) => (
        <button
          key={rule}
          onClick={() => onConfirm(rule)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-left text-sm hover:border-red-300 hover:bg-red-50"
        >
          <span className="flex items-center gap-2">
            <Sparkles size={15} className="text-amber-500" />
            {rule}
          </span>
          <ArrowRightIcon />
        </button>
      ))}
    </div>
    <div className="mt-5 flex justify-end">
      <Button variant="outline" onClick={onClose}>关闭</Button>
    </div>
  </Modal>
);

const ArrowRightIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);

const CreateVisitModal: React.FC<{
  complaintId: string;
  managers: { id: string; name: string; role: RoleType; phone?: string }[];
  defaultAssignee?: string;
  onClose: () => void;
  onConfirm: (assigneeId: string) => void;
}> = ({ managers, defaultAssignee, onClose, onConfirm }) => {
  const [assigneeId, setAssigneeId] = useState(defaultAssignee ?? managers[0]?.id ?? '');
  return (
    <Modal
      open
      title="创建回访任务"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button disabled={!assigneeId} onClick={() => onConfirm(assigneeId)}>创建并分派</Button>
        </>
      }
    >
      <Label>回访负责人</Label>
      <Select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
        {managers.map((m) => (
          <option key={m.id} value={m.id}>{m.name} · {ROLE_LABEL[m.role]}</option>
        ))}
      </Select>
      <p className="mt-3 text-xs text-slate-500">
        创建后将在回访处理列表中出现，并给负责人发送消息提醒。
      </p>
    </Modal>
  );
};

export default ComplaintDetail;
