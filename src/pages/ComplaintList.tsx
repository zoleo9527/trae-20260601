import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  UserPlus,
  ArrowRight,
  ShieldAlert,
  CheckSquare,
  AlertTriangle,
  ClipboardList,
  Inbox,
  Flame,
} from 'lucide-react';
import { useApp, mockCustomers } from '@/store/AppContext';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ComplaintStatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Input, Label, Select, Textarea } from '@/components/ui/Form';
import {
  COMPLAINT_CATEGORY_LABEL,
  COMPLAINT_STATUS_LABEL,
  ROLE_LABEL,
  type ComplaintCategory,
  type ComplaintStatus,
  type Customer,
  type RoleType,
  type Complaint,
} from '@/types';
import { formatDateTime, cn, timeAgo } from '@/lib/utils';

type ComplaintSection = {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  tone: string;
  items: Complaint[];
};

const ComplaintList: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    complaints,
    visits,
    usersByRole,
    registerComplaint,
    assignComplaint,
    triggerAbnormalSample,
    resolveComplaint,
    rejectComplaint,
    escalateComplaint,
    updateComplaintStatus,
  } = useApp();

  const isLobby = currentUser.role === 'lobby';
  const isManager = currentUser.role === 'manager';
  const isSupervisor = currentUser.role === 'supervisor';

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [resolveOpen, setResolveOpen] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [escalateOpen, setEscalateOpen] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const managers = usersByRole('manager');

  const matchKeyword = (c: Complaint) => {
    if (!keyword) return true;
    const kw = keyword.trim().toLowerCase();
    return (
      c.title.toLowerCase().includes(kw) ||
      c.content.toLowerCase().includes(kw) ||
      c.code.toLowerCase().includes(kw) ||
      c.customer.name.toLowerCase().includes(kw) ||
      c.customer.phone.includes(kw)
    );
  };
  const matchStatus = (c: Complaint) => statusFilter === 'all' || c.status === statusFilter;

  const allComplaints = useMemo(
    () => complaints.filter((c) => matchKeyword(c) && matchStatus(c)),
    [complaints, keyword, statusFilter],
  );

  const sections = useMemo<ComplaintSection[]>(() => {
    if (isLobby) {
      const mine = allComplaints.filter((c) => c.registeredBy === currentUser.id);
      const pending = mine.filter((c) => c.status === 'registered' || c.status === 'assigned');
      const rest = mine.filter((c) => c.status !== 'registered' && c.status !== 'assigned');
      return [
        {
          key: 'lobby-pending',
          title: '待处理交接',
          subtitle: '我今天登记、还未分派或还在调查中的投诉',
          icon: Inbox,
          tone: 'bg-amber-50 text-amber-700',
          items: pending,
        },
        {
          key: 'lobby-history',
          title: '已交接投诉',
          subtitle: '我登记过、后续已进入回访或结案的记录',
          icon: ClipboardList,
          tone: 'bg-slate-50 text-slate-600',
          items: rest,
        },
      ];
    }
    if (isManager) {
      const mine = allComplaints.filter((c) => c.handlerId === currentUser.id);
      const todo = mine.filter((c) => c.status === 'assigned' || c.status === 'rejected' || c.status === 'investigating');
      const pendingVisit = mine.filter((c) => c.status === 'pending_verification');
      const done = mine.filter((c) => c.status === 'resolved');
      const abnormal = mine.filter((c) => c.isAbnormal && c.status !== 'resolved');
      return [
        {
          key: 'mgr-todo',
          title: '待我处理',
          subtitle: '分派给我、但还未提交处理方案的投诉（含退回补材料）',
          icon: Flame,
          tone: 'bg-red-50 text-red-700',
          items: todo,
        },
        {
          key: 'mgr-abnormal',
          title: '异常关注',
          subtitle: '被标异常或被退回，请优先处理',
          icon: AlertTriangle,
          tone: 'bg-amber-50 text-amber-700',
          items: abnormal,
        },
        {
          key: 'mgr-visit',
          title: '待回访核实',
          subtitle: '已提交方案、等待客户回访确认的投诉',
          icon: ShieldAlert,
          tone: 'bg-bank-50 text-bank-700',
          items: pendingVisit,
        },
        {
          key: 'mgr-done',
          title: '已结案',
          subtitle: '客户已确认、流程已闭环的投诉',
          icon: CheckSquare,
          tone: 'bg-emerald-50 text-emerald-700',
          items: done,
        },
      ];
    }
    // supervisor
    const pendingAssign = allComplaints.filter((c) => c.status === 'registered');
    const inProgress = allComplaints.filter((c) => c.status === 'assigned' || c.status === 'investigating');
    const pendingVisit = allComplaints.filter((c) => c.status === 'pending_verification');
    const abnormal = allComplaints.filter((c) => c.isAbnormal && c.status !== 'resolved');
    const done = allComplaints.filter((c) => c.status === 'resolved');
    return [
      {
        key: 'sup-pending',
        title: '待分派',
        subtitle: '大堂刚登记、尚未指定处理人的投诉',
        icon: Inbox,
        tone: 'bg-amber-50 text-amber-700',
        items: pendingAssign,
      },
      {
        key: 'sup-abnormal',
        title: '异常与退回',
        subtitle: '命中异常规则或被退回的投诉，需重点关注',
        icon: Flame,
        tone: 'bg-red-50 text-red-700',
        items: abnormal,
      },
      {
        key: 'sup-progress',
        title: '处理中',
        subtitle: '已分派给客户经理、正在调查或方案待确认',
        icon: ClipboardList,
        tone: 'bg-bank-50 text-bank-700',
        items: inProgress,
      },
      {
        key: 'sup-visit',
        title: '待回访',
        subtitle: '处理方案已提交，等待客户回访核实',
        icon: ShieldAlert,
        tone: 'bg-violet-50 text-violet-700',
        items: pendingVisit,
      },
      {
        key: 'sup-done',
        title: '已结案',
        icon: CheckSquare,
        subtitle: '客户确认满意，流程闭环的投诉',
        tone: 'bg-emerald-50 text-emerald-700',
        items: done,
      },
    ];
  }, [allComplaints, isLobby, isManager, isSupervisor, currentUser.id]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">投诉记录</h1>
          <p className="mt-1 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-bank-500" />
              你当前是 <b>{ROLE_LABEL[currentUser.role]}</b>，下方已按你的职责拆分成独立工作区
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSupervisor && (
            <Button variant="outline" onClick={() => setShowAll((v) => !v)} leftIcon={<ClipboardList size={15} />}>
              {showAll ? '按职责拆分' : '查看全部一张表'}
            </Button>
          )}
          {isLobby && (
            <Button onClick={() => setRegisterOpen(true)} leftIcon={<Plus size={15} />}>登记新投诉</Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索编号、标题、客户、手机号"
            className="w-72 pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Filter size={15} className="text-slate-400" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | 'all')}
            className="w-36"
          >
            <option value="all">全部状态</option>
            {Object.entries(COMPLAINT_STATUS_LABEL).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </Select>
        </div>
        <span className="ml-auto text-xs text-slate-500">共 {allComplaints.length} 条投诉</span>
      </div>

      {showAll && isSupervisor ? (
        <UnifiedTable
          complaints={allComplaints}
          managers={managers}
          isLobby={isLobby}
          isManager={isManager}
          isSupervisor={isSupervisor}
          currentUserId={currentUser.id}
          onNavigate={(id) => navigate(`/complaints/${id}`)}
          onAssign={(id) => setAssignOpen(id)}
          onResolve={(id) => setResolveOpen(id)}
          onMarkAbnormal={(id) => triggerAbnormalSample(id, '主管手工标记：该投诉存在高风险，需要重点关注')}
          onReject={(id) => setRejectOpen(id)}
          onEscalate={(id) => setEscalateOpen(id)}
          onStartInvestigate={(id) => updateComplaintStatus(id, 'investigating', '已开始调查，调阅业务单据和监控录像')}
        />
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <SectionCard
              key={section.key}
              section={section}
              renderActions={(c) => (
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/complaints/${c.id}`)}
                    rightIcon={<ArrowRight size={13} />}
                  >
                    详情
                  </Button>
                  {isLobby && c.status === 'registered' && (
                    <Badge tone="warning">待主管分派</Badge>
                  )}
                  {isManager && c.handlerId === currentUser.id &&
                    (c.status === 'assigned' || c.status === 'rejected') && (
                      <Button
                        size="sm"
                        onClick={() => updateComplaintStatus(c.id, 'investigating', '已开始调查，调阅业务单据和监控录像')}
                      >
                        开始调查
                      </Button>
                    )}
                  {isManager && c.handlerId === currentUser.id && c.status === 'investigating' && (
                    <Button size="sm" variant="secondary" onClick={() => setResolveOpen(c.id)}>
                      提交处理方案
                    </Button>
                  )}
                  {isSupervisor && c.status === 'registered' && (
                    <Button size="sm" leftIcon={<UserPlus size={13} />} onClick={() => setAssignOpen(c.id)}>
                      分派
                    </Button>
                  )}
                  {isSupervisor && c.status !== 'resolved' && c.status !== 'escalated' && c.status !== 'registered' && (
                    <>
                      <Button
                        size="sm"
                        variant="warning"
                        leftIcon={<AlertTriangle size={13} />}
                        onClick={() => triggerAbnormalSample(c.id, '主管手工标记：该投诉存在高风险，需要重点关注')}
                      >
                        标异常
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setRejectOpen(c.id)}>
                        退回
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEscalateOpen(c.id)}>
                        升级
                      </Button>
                    </>
                  )}
                </div>
              )}
            />
          ))}
        </div>
      )}

      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />

      {assignOpen && (
        <AssignModal
          open={!!assignOpen}
          complaintId={assignOpen}
          managers={managers}
          onClose={() => setAssignOpen(null)}
          onConfirm={(handlerId) => {
            assignComplaint(assignOpen, handlerId);
            setAssignOpen(null);
          }}
        />
      )}

      {resolveOpen && (() => {
        const relatedVisits = visits.filter((v) => v.complaintId === resolveOpen);
        const openVisit = relatedVisits.find(
          (v) => v.status === 'pending' || v.status === 'in_progress' || v.status === 'returned',
        );
        return (
          <ResolveModal
            open={!!resolveOpen}
            hasOpenVisit={!!openVisit}
            activeVisitStatus={openVisit?.status}
            onClose={() => setResolveOpen(null)}
            onConfirm={(text) => {
              resolveComplaint(resolveOpen, text);
              setResolveOpen(null);
            }}
          />
        );
      })()}

      {rejectOpen && (
        <ReasonModal
          title="退回投诉补材料"
          open={!!rejectOpen}
          placeholder="请描述退回原因和需要补充的材料"
          presets={['调查材料不完整，请补充双录证据', '缺少客户签字确认书', '处理方案不明确，无法回访', '需补充涉及单据/流水']}
          buttonVariant="danger"
          buttonText="确认退回"
          onClose={() => setRejectOpen(null)}
          onConfirm={(r) => {
            rejectComplaint(rejectOpen, r);
            setRejectOpen(null);
          }}
        />
      )}

      {escalateOpen && (
        <ReasonModal
          title="升级投诉处理"
          open={!!escalateOpen}
          placeholder="请说明升级原因及上报层级"
          presets={['客户情绪激动，有投诉监管倾向', '涉及资金损失，风险较高', '超过24小时仍未闭环', '需分行或科技部门协同']}
          buttonVariant="warning"
          buttonText="确认升级"
          onClose={() => setEscalateOpen(null)}
          onConfirm={(r) => {
            escalateComplaint(escalateOpen, r);
            setEscalateOpen(null);
          }}
        />
      )}
    </div>
  );
};

const SectionCard: React.FC<{
  section: ComplaintSection;
  renderActions: (c: Complaint) => React.ReactNode;
}> = ({ section, renderActions }) => {
  const navigate = useNavigate();
  const Icon = section.icon;
  if (section.items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', section.tone)}>
            <Icon size={18} />
          </div>
          <div>
            <CardTitle>{section.title}</CardTitle>
            <p className="text-xs text-slate-500">{section.subtitle}</p>
          </div>
        </div>
        <Badge tone="slate">{section.items.length} 条</Badge>
      </CardHeader>
      <CardBody className="divide-y divide-slate-100 p-0">
        {section.items.map((c) => (
          <div key={c.id} className="flex flex-wrap items-start gap-4 px-5 py-3.5 hover:bg-slate-50/60">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate(`/complaints/${c.id}`)}
                  className="text-left text-sm font-medium text-slate-800 hover:text-bank-600"
                >
                  {c.title}
                </button>
                <ComplaintStatusBadge status={c.status} />
                {c.isAbnormal && <Badge tone="danger" dot>异常</Badge>}
                <span className="font-mono text-[11px] text-slate-400">{c.code}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>客户 <b className="text-slate-700">{c.customer.name}</b> {c.customer.phone}</span>
                <span>{COMPLAINT_CATEGORY_LABEL[c.category]}</span>
                {c.queueNo && <span>排队号 {c.queueNo}</span>}
                <span>登记人 {c.registeredByName}</span>
                {c.handlerName && <span>处理人 {c.handlerName}</span>}
                <span className="text-slate-400">{timeAgo(c.registeredAt)}</span>
              </div>
              {c.isAbnormal && (
                <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                  <AlertTriangle size={10} />
                  {c.abnormalReason ?? '异常'}
                </div>
              )}
            </div>
            {renderActions(c)}
          </div>
        ))}
      </CardBody>
    </Card>
  );
};

const UnifiedTable: React.FC<{
  complaints: Complaint[];
  managers: { id: string; name: string; role: RoleType; phone?: string }[];
  isLobby: boolean;
  isManager: boolean;
  isSupervisor: boolean;
  currentUserId: string;
  onNavigate: (id: string) => void;
  onAssign: (id: string) => void;
  onResolve: (id: string) => void;
  onMarkAbnormal: (id: string) => void;
  onReject: (id: string) => void;
  onEscalate: (id: string) => void;
  onStartInvestigate: (id: string) => void;
}> = ({
  complaints,
  isManager,
  isSupervisor,
  currentUserId,
  onNavigate,
  onAssign,
  onResolve,
  onMarkAbnormal,
  onReject,
  onEscalate,
  onStartInvestigate,
}) => (
  <Card>
    <CardBody className="p-0">
      {complaints.length === 0 ? (
        <div className="px-5 py-16 text-center text-sm text-slate-400">暂无投诉记录</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                <th className="px-5 py-3">编号/分类</th>
                <th className="px-5 py-3">客户信息</th>
                <th className="px-5 py-3">标题</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">处理人/登记人</th>
                <th className="px-5 py-3">登记时间</th>
                <th className="px-5 py-3 text-right">动作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 align-top">
                    <div className="font-mono text-xs text-slate-500">{c.code}</div>
                    <div className="mt-1"><Badge tone="slate">{COMPLAINT_CATEGORY_LABEL[c.category]}</Badge></div>
                    {c.queueNo && <div className="mt-1 text-xs text-slate-400">排队号：{c.queueNo} · 窗口{c.counterNo}</div>}
                    {c.isAbnormal && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                        <AlertTriangle size={12} />{c.abnormalReason ?? '异常'}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 align-top">
                    <div className="font-medium text-slate-800">{c.customer.name}</div>
                    <div className="text-xs text-slate-500">{c.customer.phone}</div>
                    {c.customer.level === 'vip' && <Badge className="mt-1" tone="warning">VIP</Badge>}
                  </td>
                  <td className="px-5 py-3.5 align-top">
                    <button
                      onClick={() => onNavigate(c.id)}
                      className="text-left text-sm font-medium text-slate-800 hover:text-bank-600"
                    >{c.title}</button>
                    <p className="mt-1 line-clamp-1 w-80 text-xs text-slate-500">{c.content}</p>
                  </td>
                  <td className="px-5 py-3.5 align-top">
                    <ComplaintStatusBadge status={c.status} />
                  </td>
                  <td className="px-5 py-3.5 align-top text-xs">
                    <div className="text-slate-700">处理人：{c.handlerName ?? '未分派'}</div>
                    <div className="mt-1 text-slate-400">登记：{c.registeredByName}</div>
                  </td>
                  <td className="px-5 py-3.5 align-top text-xs text-slate-500">{formatDateTime(c.registeredAt)}</td>
                  <td className="px-5 py-3.5 align-top">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => onNavigate(c.id)} rightIcon={<ArrowRight size={13} />}>详情</Button>
                      {isSupervisor && c.status === 'registered' && (
                        <Button size="sm" leftIcon={<UserPlus size={13} />} onClick={() => onAssign(c.id)}>分派</Button>
                      )}
                      {isSupervisor && c.status !== 'resolved' && c.status !== 'escalated' && c.status !== 'registered' && (
                        <>
                          <Button size="sm" variant="warning" leftIcon={<AlertTriangle size={13} />} onClick={() => onMarkAbnormal(c.id)}>标异常</Button>
                          <Button size="sm" variant="danger" onClick={() => onReject(c.id)}>退回</Button>
                          <Button size="sm" variant="outline" onClick={() => onEscalate(c.id)}>升级</Button>
                        </>
                      )}
                      {isManager && c.handlerId === currentUserId &&
                        (c.status === 'assigned' || c.status === 'rejected') && (
                          <Button size="sm" onClick={() => onStartInvestigate(c.id)}>开始调查</Button>
                        )}
                      {isManager && c.handlerId === currentUserId && c.status === 'investigating' && (
                        <Button size="sm" variant="secondary" onClick={() => onResolve(c.id)}>提交处理</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardBody>
  </Card>
);

const RegisterModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { registerComplaint } = useApp();
  const [form, setForm] = useState({
    category: 'service' as ComplaintCategory,
    title: '',
    content: '',
    customerName: '',
    customerPhone: '',
    queueNo: '',
    counterNo: '',
    useExisting: true,
    existingCustomerId: mockCustomers[0].id,
  });
  const [error, setError] = useState('');

  const reset = () => {
    setForm({
      category: 'service',
      title: '',
      content: '',
      customerName: '',
      customerPhone: '',
      queueNo: '',
      counterNo: '',
      useExisting: true,
      existingCustomerId: mockCustomers[0].id,
    });
    setError('');
  };

  const handleConfirm = () => {
    if (!form.title.trim()) return setError('请输入投诉标题');
    if (!form.content.trim()) return setError('请输入投诉内容');
    let customer: Customer;
    if (form.useExisting) {
      customer = mockCustomers.find((c) => c.id === form.existingCustomerId) ?? mockCustomers[0];
    } else {
      if (!form.customerName.trim() || !form.customerPhone.trim()) {
        return setError('请填写客户姓名和手机号');
      }
      customer = {
        id: 'c_' + Math.random().toString(36).slice(2, 8),
        name: form.customerName.trim(),
        phone: form.customerPhone.trim(),
      };
    }
    registerComplaint({
      category: form.category,
      title: form.title.trim(),
      content: form.content.trim(),
      customer,
      queueNo: form.queueNo.trim() || undefined,
      counterNo: form.counterNo.trim() || undefined,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      title="登记新投诉"
      onClose={() => { reset(); onClose(); }}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleConfirm}>提交登记</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>投诉分类</Label>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ComplaintCategory })}>
              {Object.entries(COMPLAINT_CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </div>
          <div>
            <Label>现场排队号</Label>
            <Input value={form.queueNo} onChange={(e) => setForm({ ...form, queueNo: e.target.value })} placeholder="如 A023" />
          </div>
        </div>
        <div><Label required>投诉标题</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="一句话概括，方便后续快速查看" />
        </div>
        <div><Label required>投诉详情</Label>
          <Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="详细描述客户诉求、现场情况、涉及窗口与柜员等" />
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="radio" checked={form.useExisting} onChange={() => setForm({ ...form, useExisting: true })} />
              选择系统已有客户
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="radio" checked={!form.useExisting} onChange={() => setForm({ ...form, useExisting: false })} />
              录入新客户
            </label>
          </div>
          {form.useExisting ? (
            <Select value={form.existingCustomerId} onChange={(e) => setForm({ ...form, existingCustomerId: e.target.value })}>
              {mockCustomers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}{c.level === 'vip' ? ' · VIP' : ''}</option>)}
            </Select>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>客户姓名</Label><Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
              <div><Label>手机号</Label><Input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} /></div>
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div><Label>办理窗口</Label><Input value={form.counterNo} onChange={(e) => setForm({ ...form, counterNo: e.target.value })} placeholder="如 3号窗口" /></div>
          </div>
        </div>
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      </div>
    </Modal>
  );
};

const AssignModal: React.FC<{
  open: boolean;
  complaintId: string;
  managers: { id: string; name: string; role: RoleType; phone?: string }[];
  onClose: () => void;
  onConfirm: (handlerId: string) => void;
}> = ({ open, managers, onClose, onConfirm }) => {
  const [handlerId, setHandlerId] = useState(managers[0]?.id ?? '');
  return (
    <Modal
      open={open}
      title="分派投诉处理人"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button disabled={!handlerId} onClick={() => onConfirm(handlerId)}>确认分派</Button>
        </>
      }
    >
      <Label>选择客户经理</Label>
      <Select value={handlerId} onChange={(e) => setHandlerId(e.target.value)}>
        {managers.map((m) => <option key={m.id} value={m.id}>{m.name} · {ROLE_LABEL[m.role]}</option>)}
      </Select>
      <p className="mt-3 text-xs text-slate-500">分派后系统自动记录交接时间，该投诉的调查、方案、回访责任均由该经理承担。</p>
    </Modal>
  );
};

const ResolveModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
  hasOpenVisit?: boolean;
  activeVisitStatus?: string;
}> = ({ open, onClose, onConfirm, hasOpenVisit, activeVisitStatus }) => {
  const [text, setText] = useState('');
  const getButtonText = () => {
    if (!hasOpenVisit) return '提交并生成回访';
    if (activeVisitStatus === 'returned') return '提交并重置退回回访';
    return '提交并复用现有回访';
  };
  const getPlaceholder = () => {
    if (!hasOpenVisit) return '说明调查结论、整改措施、客户补偿方案等';
    if (activeVisitStatus === 'returned') return '说明调查结论、整改措施、客户补偿方案等，提交后将重置原退回的回访任务为待跟进';
    return '说明调查结论、整改措施、客户补偿方案等，提交后将复用现有回访任务继续跟进';
  };
  const getHint = () => {
    if (!hasOpenVisit) return '提交后投诉进入「待回访核实」，系统将自动创建回访任务并分派给你。';
    if (activeVisitStatus === 'returned') return '提交后将重置原退回的回访任务为待回访状态，不会重复创建新任务，异常标记同步清除。';
    return '提交后将复用现有进行中的回访任务继续跟进，不会重复创建新任务。';
  };
  return (
    <Modal
      open={open}
      title="提交处理方案"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button disabled={!text.trim()} onClick={() => onConfirm(text.trim())}>{getButtonText()}</Button>
        </>
      }
    >
      <Label required>处理结果说明</Label>
      <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={getPlaceholder()} />
      {hasOpenVisit ? (
        <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">{getHint()}</div>
      ) : (
        <p className="mt-3 text-xs text-slate-500">{getHint()}</p>
      )}
    </Modal>
  );
};

const ReasonModal: React.FC<{
  title: string;
  open: boolean;
  placeholder?: string;
  presets?: string[];
  buttonVariant?: 'primary' | 'danger' | 'warning';
  buttonText?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}> = ({ title, open, placeholder, presets, buttonVariant = 'primary', buttonText = '确认', onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button variant={buttonVariant} disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>{buttonText}</Button>
        </>
      }
    >
      <Label required>原因说明</Label>
      <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={placeholder} />
      {presets && (
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setReason(p)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs hover:text-white',
                buttonVariant === 'danger'
                  ? 'border-slate-200 text-slate-600 hover:border-red-400 hover:bg-red-500'
                  : buttonVariant === 'warning'
                    ? 'border-slate-200 text-slate-600 hover:border-amber-400 hover:bg-amber-500'
                    : 'border-slate-200 text-slate-600 hover:border-bank-400 hover:bg-bank-500',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default ComplaintList;
