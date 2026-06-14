import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  PhoneCall,
  Phone,
  MapPin,
  MessageSquare,
  Undo2,
  FileText,
  User,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { VisitStatusBadge, ComplaintStatusBadge } from '@/components/ui/StatusBadge';
import { Timeline } from '@/components/ui/Timeline';
import { Modal } from '@/components/ui/Modal';
import { Label, Select, Textarea } from '@/components/ui/Form';
import {
  ROLE_LABEL,
  VISIT_RESULT_LABEL,
  type VisitResult,
} from '@/types';
import { formatDateTime, cn } from '@/lib/utils';

const VisitDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, getVisit, getComplaint, submitVisitResult, returnVisit, updateVisitStatus } = useApp();
  const visit = id ? getVisit(id) : undefined;
  const complaint = visit ? getComplaint(visit.complaintId) : undefined;

  const isSupervisor = currentUser.role === 'supervisor';
  const isOwner = visit?.assigneeId === currentUser.id;

  const [submitOpen, setSubmitOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  if (!visit) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        找不到该回访记录
        <div className="mt-4">
          <Button onClick={() => navigate('/visits')}>返回列表</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/visits')}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold text-slate-900">{visit.complaintTitle}</h1>
            <VisitStatusBadge status={visit.status} />
            {visit.status === 'returned' && (
              <Badge tone="danger" dot>
                <AlertTriangle size={12} className="mr-0.5" />
                需跟进
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="font-mono">{visit.complaintCode}</span>
            <span>负责人：{visit.assigneeName} · {ROLE_LABEL[visit.assigneeRole]}</span>
            <span>分派于 {formatDateTime(visit.assignedAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {visit.status === 'pending' && (isOwner || isSupervisor) && (
            <Button leftIcon={<PhoneCall size={15} />} onClick={() => updateVisitStatus(visit.id, 'in_progress', '开始联系客户')}>
              开始回访
            </Button>
          )}
          {visit.status === 'in_progress' && isOwner && (
            <Button leftIcon={<CheckCircle2 size={15} />} onClick={() => setSubmitOpen(true)}>
              提交回访结果
            </Button>
          )}
          {isSupervisor && visit.status !== 'verified' && (
            <Button variant="danger" leftIcon={<Undo2 size={15} />} onClick={() => setReturnOpen(true)}>
              退回重办
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>关联投诉</CardTitle>
              {complaint && <ComplaintStatusBadge status={complaint.status} />}
            </CardHeader>
            <CardBody className="space-y-3">
              {complaint ? (
                <>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-mono text-slate-400">{complaint.code}</span>
                    <Badge tone="slate">{complaint.category}</Badge>
                    {complaint.queueNo && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">
                        排队号 {complaint.queueNo}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700">{complaint.content}</p>
                  {complaint.resolution && (
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                      <div className="mb-1 text-xs font-medium text-emerald-700">处理方案</div>
                      <p className="text-sm leading-relaxed text-emerald-800">{complaint.resolution}</p>
                    </div>
                  )}
                  <Link
                    to={`/complaints/${complaint.id}`}
                    className="inline-flex items-center gap-1 text-sm text-bank-600 hover:text-bank-700"
                  >
                    <FileText size={14} /> 查看投诉详情与完整时间线
                  </Link>
                </>
              ) : (
                <div className="text-sm text-slate-400">关联投诉可能已被删除</div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>回访信息</CardTitle>
              {visit.visitMethod && (
                <Badge tone="primary">
                  {visit.visitMethod === 'phone' ? '电话回访' : visit.visitMethod === 'onsite' ? '上门回访' : '线上回访'}
                </Badge>
              )}
            </CardHeader>
            <CardBody className="space-y-4">
              {visit.result ? (
                <>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <InfoBox label="回访结果">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          visit.result === 'satisfied' && 'text-emerald-600',
                          visit.result === 'partially_satisfied' && 'text-amber-600',
                          visit.result === 'unsatisfied' && 'text-red-600',
                          visit.result === 'no_answer' && 'text-slate-500',
                        )}
                      >
                        {VISIT_RESULT_LABEL[visit.result]}
                      </span>
                    </InfoBox>
                    <InfoBox label="回访时间">
                      {visit.finishedAt ? formatDateTime(visit.finishedAt) : '—'}
                    </InfoBox>
                    <InfoBox label="回访方式">
                      {visit.visitMethod === 'phone'
                        ? '电话'
                        : visit.visitMethod === 'onsite'
                          ? '上门'
                          : visit.visitMethod === 'online'
                            ? '线上'
                            : '—'}
                    </InfoBox>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-slate-500">客户反馈</div>
                    <div className="rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                      {visit.customerFeedback ?? '—'}
                    </div>
                  </div>
                  {visit.internalNote && (
                    <div>
                      <div className="mb-1 text-xs text-slate-500">内部备注</div>
                      <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm leading-relaxed text-amber-800">
                        {visit.internalNote}
                      </div>
                    </div>
                  )}
                  {visit.needReturn && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <div className="mb-1 flex items-center gap-1 text-xs font-medium text-red-700">
                        <AlertTriangle size={13} /> 退回意见
                      </div>
                      <p className="text-sm leading-relaxed text-red-700">{visit.returnReason ?? '需要重新处理'}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bank-100 text-bank-600">
                    <PhoneCall size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      {visit.status === 'in_progress' ? '回访进行中' : '尚未开始回访'}
                    </div>
                    <div className="text-xs text-slate-500">
                      联系客户后点击「提交回访结果」，按客户实际反馈记录。
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>回访时间线</CardTitle>
              <span className="text-xs text-slate-500">共 {visit.timeline.length} 条</span>
            </CardHeader>
            <CardBody>
              <Timeline events={visit.timeline} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>客户信息</CardTitle>
              {visit.customer.level === 'vip' && <Badge tone="warning">VIP</Badge>}
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bank-100 text-bank-700">
                  <User size={18} />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">{visit.customer.name}</div>
                  <div className="text-xs text-slate-500">
                    {visit.customer.level === 'vip' ? 'VIP客户' : '普通客户'}
                  </div>
                </div>
              </div>
              <div className="space-y-2 border-t border-slate-100 pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500"><Phone size={13} /> 手机号</span>
                  <a href={`tel:${visit.customer.phone}`} className="font-medium text-bank-600 hover:underline">
                    {visit.customer.phone}
                  </a>
                </div>
                {visit.customer.accountNo && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500"><FileText size={13} /> 账号</span>
                    <span className="font-mono text-slate-800">{visit.customer.accountNo}</span>
                  </div>
                )}
                {visit.customer.idCardNo && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500"><MapPin size={13} /> 证件号</span>
                    <span className="font-mono text-xs text-slate-800">{visit.customer.idCardNo}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" leftIcon={<Phone size={14} />}>
                  拨号
                </Button>
                <Button variant="outline" size="sm" leftIcon={<MessageSquare size={14} />}>
                  发短信
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>回访要点提示</CardTitle>
            </CardHeader>
            <CardBody>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 text-emerald-500" /> 先致歉再确认客户身份</li>
                <li className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 text-emerald-500" /> 复述处理方案，确认客户已收到</li>
                <li className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 text-emerald-500" /> 明确询问满意度和改进建议</li>
                <li className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 text-amber-500" /> 客户如不满意，立即升级主管</li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>

      {submitOpen && (
        <SubmitVisitModal
          onClose={() => setSubmitOpen(false)}
          onConfirm={(data) => {
            submitVisitResult(visit.id, data);
            setSubmitOpen(false);
          }}
        />
      )}

      {returnOpen && (
        <ReturnModal
          onClose={() => setReturnOpen(false)}
          onConfirm={(reason) => {
            returnVisit(visit.id, reason);
            setReturnOpen(false);
          }}
        />
      )}
    </div>
  );
};

const InfoBox: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="rounded-lg bg-slate-50 px-3 py-2.5">
    <div className="text-xs text-slate-500">{label}</div>
    <div className="mt-0.5 text-sm text-slate-800">{children}</div>
  </div>
);

const SubmitVisitModal: React.FC<{
  onClose: () => void;
  onConfirm: (data: {
    result: VisitResult;
    customerFeedback: string;
    internalNote?: string;
    visitMethod?: 'phone' | 'onsite' | 'online';
  }) => void;
}> = ({ onClose, onConfirm }) => {
  const [result, setResult] = useState<VisitResult>('satisfied');
  const [customerFeedback, setCustomerFeedback] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [visitMethod, setVisitMethod] = useState<'phone' | 'onsite' | 'online'>('phone');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!customerFeedback.trim()) return setError('请填写客户反馈');
    onConfirm({
      result,
      customerFeedback: customerFeedback.trim(),
      internalNote: internalNote.trim() || undefined,
      visitMethod,
    });
  };

  return (
    <Modal
      open
      title="提交回访结果"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleConfirm}>提交结果</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>回访方式</Label>
            <Select value={visitMethod} onChange={(e) => setVisitMethod(e.target.value as typeof visitMethod)}>
              <option value="phone">电话回访</option>
              <option value="onsite">上门回访</option>
              <option value="online">线上回访</option>
            </Select>
          </div>
          <div>
            <Label required>客户反馈结果</Label>
            <Select value={result} onChange={(e) => setResult(e.target.value as VisitResult)}>
              {Object.entries(VISIT_RESULT_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label required>客户反馈原话</Label>
          <Textarea
            rows={4}
            value={customerFeedback}
            onChange={(e) => setCustomerFeedback(e.target.value)}
            placeholder="如实记录客户的反馈内容和意见"
          />
        </div>
        <div>
          <Label>内部备注（仅内部可见）</Label>
          <Textarea
            rows={3}
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            placeholder="后续跟进建议、未解决的问题等"
          />
        </div>
        {result === 'unsatisfied' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            客户不满意将自动标记为需跟进，并通知主管安排进一步处理。
          </div>
        )}
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      </div>
    </Modal>
  );
};

const ReturnModal: React.FC<{
  onClose: () => void;
  onConfirm: (reason: string) => void;
}> = ({ onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const preset = [
    '客户明确表示不满意，请重新沟通方案',
    '回访记录不完整，请补充客户原话',
    '处理方案未落实，请先完成整改再回访',
    '客户联系不上，建议换时段再次回访',
  ];
  return (
    <Modal
      open
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

export default VisitDetail;
