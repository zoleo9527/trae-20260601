import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ComplaintStatusBadge, VisitStatusBadge } from '@/components/ui/StatusBadge';
import { COMPLAINT_CATEGORY_LABEL, ROLE_LABEL } from '@/types';
import {
  FileText,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserPlus,
} from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: 'primary' | 'warning' | 'danger' | 'success' | 'info';
}

const toneMap: Record<StatCardProps['tone'], string> = {
  primary: 'bg-bank-50 text-bank-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  success: 'bg-emerald-50 text-emerald-700',
  info: 'bg-sky-50 text-sky-700',
};

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, tone }) => (
  <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', toneMap[tone])}>
      <Icon size={22} />
    </div>
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, complaints, visits } = useApp();

  const isLobby = currentUser.role === 'lobby';
  const isManager = currentUser.role === 'manager';
  const isSupervisor = currentUser.role === 'supervisor';

  const myComplaints = complaints.filter(
    (c) =>
      (isLobby && c.registeredBy === currentUser.id) ||
      (isManager && c.handlerId === currentUser.id) ||
      isSupervisor,
  );
  const myVisits = visits.filter(
    (v) => v.assigneeId === currentUser.id || isSupervisor,
  );

  const pendingAssign = complaints.filter((c) => c.status === 'registered');
  const investigating = complaints.filter((c) => c.status === 'investigating');
  const pendingVisit = visits.filter(
    (v) => v.status === 'pending' || v.status === 'in_progress',
  );
  const abnormalCount = complaints.filter((c) => c.isAbnormal).length;

  const recentComplaints = [...myComplaints]
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    .slice(0, 6);
  const recentVisits = [...myVisits]
    .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">工作台</h1>
          <p className="mt-1 text-sm text-slate-500">
            你好，{currentUser.name}（{ROLE_LABEL[currentUser.role]}），以下是你今天的任务概览
          </p>
        </div>
        {isLobby && (
          <Button onClick={() => navigate('/complaints')} leftIcon={<FileText size={16} />}>
            登记新投诉
          </Button>
        )}
        {isSupervisor && (
          <Button onClick={() => navigate('/complaints')} leftIcon={<UserPlus size={16} />}>
            分派投诉任务
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isSupervisor ? (
          <>
            <StatCard icon={FileText} label="待分派投诉" value={pendingAssign.length} tone="warning" />
            <StatCard icon={Clock} label="调查处理中" value={investigating.length} tone="primary" />
            <StatCard icon={PhoneCall} label="待回访任务" value={pendingVisit.length} tone="info" />
            <StatCard icon={AlertTriangle} label="异常/超时" value={abnormalCount} tone="danger" />
          </>
        ) : isManager ? (
          <>
            <StatCard icon={FileText} label="我负责的投诉" value={myComplaints.length} tone="primary" />
            <StatCard icon={Clock} label="处理中" value={investigating.filter((c) => c.handlerId === currentUser.id).length} tone="info" />
            <StatCard icon={PhoneCall} label="待回访" value={pendingVisit.filter((v) => v.assigneeId === currentUser.id).length} tone="warning" />
            <StatCard icon={CheckCircle2} label="已完成回访" value={visits.filter((v) => v.assigneeId === currentUser.id && v.status === 'verified').length} tone="success" />
          </>
        ) : (
          <>
            <StatCard icon={FileText} label="今日我登记" value={myComplaints.filter((c) => c.registeredBy === currentUser.id).length} tone="primary" />
            <StatCard icon={Clock} label="待分派处理" value={pendingAssign.filter((c) => c.registeredBy === currentUser.id).length} tone="warning" />
            <StatCard icon={PhoneCall} label="回访中" value={pendingVisit.filter((v) => {
              const cp = complaints.find((c) => c.id === v.complaintId);
              return cp?.registeredBy === currentUser.id;
            }).length} tone="info" />
            <StatCard icon={CheckCircle2} label="已结案" value={myComplaints.filter((c) => c.status === 'resolved' || c.status === 'pending_verification').length} tone="success" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>投诉记录</CardTitle>
            <button
              onClick={() => navigate('/complaints')}
              className="flex items-center gap-1 text-sm text-bank-600 hover:text-bank-700"
            >
              查看全部 <ArrowRight size={14} />
            </button>
          </CardHeader>
          <CardBody className="p-0">
            {recentComplaints.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-400">暂无投诉记录</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentComplaints.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => navigate(`/complaints/${c.id}`)}
                      className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">{c.title}</span>
                          <ComplaintStatusBadge status={c.status} />
                          {c.isAbnormal && (
                            <Badge tone="danger" dot>异常</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                          <span>{c.code}</span>
                          <span>客户 {c.customer.name}</span>
                          <span>{COMPLAINT_CATEGORY_LABEL[c.category]}</span>
                          <span>{timeAgo(c.registeredAt)}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>回访处理</CardTitle>
            <button
              onClick={() => navigate('/visits')}
              className="flex items-center gap-1 text-sm text-bank-600 hover:text-bank-700"
            >
              查看全部 <ArrowRight size={14} />
            </button>
          </CardHeader>
          <CardBody className="p-0">
            {recentVisits.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-400">暂无回访任务</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentVisits.map((v) => (
                  <li key={v.id}>
                    <button
                      onClick={() => navigate(`/visits/${v.id}`)}
                      className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-slate-900">{v.complaintTitle}</span>
                          <VisitStatusBadge status={v.status} />
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                          <span>{v.complaintCode}</span>
                          <span>客户 {v.customer.name}</span>
                          <span>处理人 {v.assigneeName}</span>
                          <span>{timeAgo(v.assignedAt)}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
