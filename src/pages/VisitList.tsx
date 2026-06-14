import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  PhoneCall,
  ArrowRight,
  AlertTriangle,
  CheckSquare,
  Inbox,
  Flame,
  Phone,
  ClipboardList,
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { VisitStatusBadge, ComplaintStatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Input, Label, Select, Textarea } from '@/components/ui/Form';
import {
  ROLE_LABEL,
  VISIT_STATUS_LABEL,
  VISIT_RESULT_LABEL,
  type VisitStatus,
  type VisitRecord,
  type Complaint,
} from '@/types';
import { formatDateTime, cn, timeAgo } from '@/lib/utils';

type VisitSection = {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  tone: string;
  items: VisitRecord[];
};

const VisitList: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, visits, updateVisitStatus, returnVisit, getComplaint } = useApp();

  const isManager = currentUser.role === 'manager';
  const isSupervisor = currentUser.role === 'supervisor';

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<VisitStatus | 'all'>('all');
  const [returnOpen, setReturnOpen] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const matchKeyword = (v: VisitRecord) => {
    if (!keyword) return true;
    const kw = keyword.trim().toLowerCase();
    return (
      v.complaintTitle.toLowerCase().includes(kw) ||
      v.complaintCode.toLowerCase().includes(kw) ||
      v.customer.name.toLowerCase().includes(kw) ||
      v.customer.phone.includes(kw)
    );
  };
  const matchStatus = (v: VisitRecord) => statusFilter === 'all' || v.status === statusFilter;

  const allVisits = useMemo(
    () => visits.filter((v) => matchKeyword(v) && matchStatus(v)),
    [visits, keyword, statusFilter],
  );

  const sections = useMemo<VisitSection[]>(() => {
    if (isManager) {
      const mine = allVisits.filter((v) => v.assigneeId === currentUser.id);
      const pending = mine.filter((v) => v.status === 'pending' || v.status === 'in_progress');
      const returned = mine.filter((v) => v.status === 'returned');
      const done = mine.filter((v) => v.status === 'verified' || v.status === 'unverified');
      return [
        {
          key: 'mgr-todo',
          title: '待我回访',
          subtitle: '分派给我、尚未完成或正在进行中的回访任务',
          icon: PhoneCall,
          tone: 'bg-bank-50 text-bank-700',
          items: pending,
        },
        {
          key: 'mgr-returned',
          title: '被退回',
          subtitle: '主管退回或客户不满意，需要安排二次回访的任务',
          icon: Flame,
          tone: 'bg-red-50 text-red-700',
          items: returned,
        },
        {
          key: 'mgr-done',
          title: '已完成回访',
          subtitle: '我已提交结果的回访记录',
          icon: CheckSquare,
          tone: 'bg-emerald-50 text-emerald-700',
          items: done,
        },
      ];
    }
    // supervisor / lobby (lobby 默认看自己登记投诉的回访)
    const pending = allVisits.filter((v) => v.status === 'pending');
    const inProgress = allVisits.filter((v) => v.status === 'in_progress');
    const returned = allVisits.filter((v) => v.status === 'returned');
    const done = allVisits.filter((v) => v.status === 'verified' || v.status === 'unverified');
    return [
      {
        key: 'sup-pending',
        title: '待回访',
        subtitle: '已创建、但客户经理还未开始联系客户',
        icon: Inbox,
        tone: 'bg-amber-50 text-amber-700',
        items: pending,
      },
      {
        key: 'sup-progress',
        title: '回访中',
        subtitle: '客户经理正在联系客户',
        icon: Phone,
        tone: 'bg-bank-50 text-bank-700',
        items: inProgress,
      },
      {
        key: 'sup-returned',
        title: '退回/客户不满意',
        subtitle: '需要重新处理或二次回访的任务',
        icon: Flame,
        tone: 'bg-red-50 text-red-700',
        items: returned,
      },
      {
        key: 'sup-done',
        title: '已完成',
        subtitle: '已提交回访结果的记录',
        icon: ClipboardList,
        tone: 'bg-emerald-50 text-emerald-700',
        items: done,
      },
    ];
  }, [allVisits, isManager, currentUser.id]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">回访处理</h1>
          <p className="mt-1 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-bank-500" />
              你当前是 <b>{ROLE_LABEL[currentUser.role]}</b>，下方按你的职责拆分成独立工作区
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSupervisor && (
            <Button variant="outline" onClick={() => setShowAll((v) => !v)} leftIcon={<ClipboardList size={15} />}>
              {showAll ? '按职责拆分' : '查看全部一张表'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索投诉编号、标题、客户"
            className="w-72 pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Filter size={15} className="text-slate-400" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as VisitStatus | 'all')}
            className="w-36"
          >
            <option value="all">全部状态</option>
            {Object.entries(VISIT_STATUS_LABEL).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </Select>
        </div>
        <span className="ml-auto text-xs text-slate-500">共 {allVisits.length} 条回访</span>
      </div>

      {showAll && isSupervisor ? (
        <UnifiedTable
          visits={allVisits}
          getComplaint={getComplaint}
          currentUserId={currentUser.id}
          isManager={isManager}
          isSupervisor={isSupervisor}
          onNavigate={(id) => navigate(`/visits/${id}`)}
          onStart={(id) => updateVisitStatus(id, 'in_progress', '开始联系客户')}
          onReturn={(id) => setReturnOpen(id)}
        />
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <SectionCard
              key={section.key}
              section={section}
              getComplaint={getComplaint}
              renderActions={(v) => (
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/visits/${v.id}`)}
                    rightIcon={<ArrowRight size={13} />}
                  >
                    详情
                  </Button>
                  {(v.status === 'pending') &&
                    (v.assigneeId === currentUser.id || isSupervisor) && (
                      <Button
                        size="sm"
                        leftIcon={<PhoneCall size={13} />}
                        onClick={() => updateVisitStatus(v.id, 'in_progress', '开始联系客户')}
                      >
                        开始回访
                      </Button>
                    )}
                  {v.status === 'in_progress' && v.assigneeId === currentUser.id && (
                    <Button
                      size="sm"
                      leftIcon={<Phone size={13} />}
                      onClick={() => navigate(`/visits/${v.id}`)}
                    >
                      填写结果
                    </Button>
                  )}
                  {isSupervisor && (v.result === 'unsatisfied' || v.status === 'returned' || v.status === 'in_progress' || v.status === 'pending') && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setReturnOpen(v.id)}
                    >
                      退回重办
                    </Button>
                  )}
                </div>
              )}
            />
          ))}
        </div>
      )}

      {returnOpen && (
        <ReturnModal
          open={!!returnOpen}
          onClose={() => setReturnOpen(null)}
          onConfirm={(r) => {
            returnVisit(returnOpen, r);
            setReturnOpen(null);
          }}
        />
      )}
    </div>
  );
};

const SectionCard: React.FC<{
  section: VisitSection;
  getComplaint: (id: string) => Complaint | undefined;
  renderActions: (v: VisitRecord) => React.ReactNode;
}> = ({ section, getComplaint, renderActions }) => {
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
        {section.items.map((v) => {
          const cp = getComplaint(v.complaintId);
          return (
            <div key={v.id} className="flex flex-wrap items-start gap-4 px-5 py-3.5 hover:bg-slate-50/60">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => navigate(`/visits/${v.id}`)}
                    className="text-left text-sm font-medium text-slate-800 hover:text-bank-600"
                  >
                    {v.complaintTitle}
                  </button>
                  <VisitStatusBadge status={v.status} />
                  {v.needReturn && <Badge tone="danger" dot>需跟进</Badge>}
                  {cp && <ComplaintStatusBadge status={cp.status} />}
                  <span className="font-mono text-[11px] text-slate-400">{v.complaintCode}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>客户 <b className="text-slate-700">{v.customer.name}</b> {v.customer.phone}</span>
                  <span>负责人 {v.assigneeName}</span>
                  {v.result && <span>结果 {VISIT_RESULT_LABEL[v.result]}</span>}
                  <span className="text-slate-400">{timeAgo(v.assignedAt)}</span>
                </div>
                {v.needReturn && (
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                    <AlertTriangle size={10} />
                    {v.returnReason ?? '需要再次处理'}
                  </div>
                )}
              </div>
              {renderActions(v)}
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
};

const UnifiedTable: React.FC<{
  visits: VisitRecord[];
  getComplaint: (id: string) => Complaint | undefined;
  currentUserId: string;
  isManager: boolean;
  isSupervisor: boolean;
  onNavigate: (id: string) => void;
  onStart: (id: string) => void;
  onReturn: (id: string) => void;
}> = ({ visits, getComplaint, currentUserId, isManager, isSupervisor, onNavigate, onStart, onReturn }) => (
  <Card>
    <CardBody className="p-0">
      {visits.length === 0 ? (
        <div className="px-5 py-16 text-center text-sm text-slate-400">暂无回访任务</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                <th className="px-5 py-3">投诉信息</th>
                <th className="px-5 py-3">客户</th>
                <th className="px-5 py-3">回访状态</th>
                <th className="px-5 py-3">投诉状态</th>
                <th className="px-5 py-3">回访结果</th>
                <th className="px-5 py-3">负责人</th>
                <th className="px-5 py-3">分派/完成</th>
                <th className="px-5 py-3 text-right">动作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.map((v) => {
                const cp = getComplaint(v.complaintId);
                return (
                  <tr key={v.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 align-top">
                      <button
                        onClick={() => onNavigate(v.id)}
                        className="text-left text-sm font-medium text-slate-800 hover:text-bank-600"
                      >
                        {v.complaintTitle}
                      </button>
                      <div className="mt-0.5 font-mono text-xs text-slate-400">{v.complaintCode}</div>
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <div className="font-medium text-slate-800">{v.customer.name}</div>
                      <div className="text-xs text-slate-500">{v.customer.phone}</div>
                      {v.customer.level === 'vip' && <Badge className="mt-1" tone="warning">VIP</Badge>}
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <VisitStatusBadge status={v.status} />
                      {v.needReturn && (
                        <div className="mt-1 text-xs font-medium text-red-600">{v.returnReason ?? '需跟进'}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      {cp ? <ComplaintStatusBadge status={cp.status} /> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 align-top text-sm">
                      {v.result ? VISIT_RESULT_LABEL[v.result] : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 align-top text-sm">
                      <div className="text-slate-700">{v.assigneeName}</div>
                      <div className="text-xs text-slate-400">{ROLE_LABEL[v.assigneeRole]}</div>
                    </td>
                    <td className="px-5 py-3.5 align-top text-xs text-slate-500">
                      <div>分派：{formatDateTime(v.assignedAt)}</div>
                      {v.finishedAt && <div>完成：{formatDateTime(v.finishedAt)}</div>}
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => onNavigate(v.id)} rightIcon={<ArrowRight size={13} />}>详情</Button>
                        {(v.status === 'pending') && (v.assigneeId === currentUserId || isSupervisor) && (
                          <Button size="sm" leftIcon={<PhoneCall size={13} />} onClick={() => onStart(v.id)}>开始回访</Button>
                        )}
                        {isSupervisor && (v.result === 'unsatisfied' || v.status === 'returned' || v.status === 'in_progress' || v.status === 'pending') && (
                          <Button size="sm" variant="danger" onClick={() => onReturn(v.id)}>退回重办</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </CardBody>
  </Card>
);

const ReturnModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}> = ({ open, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const presets = [
    '客户明确表示不满意，请重新沟通方案',
    '回访记录不完整，请补充客户原话',
    '处理方案未落实，请先完成整改再回访',
    '客户联系不上，建议换时段再次回访',
  ];
  return (
    <Modal
      open={open}
      title="退回回访任务"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button variant="danger" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>确认退回</Button>
        </>
      }
    >
      <Label required>退回原因</Label>
      <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="说明退回原因和对处理人的要求" />
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setReason(p)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:border-red-300 hover:bg-red-500 hover:text-white"
          >
            {p}
          </button>
        ))}
      </div>
    </Modal>
  );
};

export default VisitList;
