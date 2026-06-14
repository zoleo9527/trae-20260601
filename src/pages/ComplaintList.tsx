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
} from '@/types';
import { formatDateTime, cn } from '@/lib/utils';

const ComplaintList: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    complaints,
    usersByRole,
    registerComplaint,
    assignComplaint,
    triggerAbnormalSample,
    resolveComplaint,
  } = useApp();

  const isLobby = currentUser.role === 'lobby';
  const isManager = currentUser.role === 'manager';
  const isSupervisor = currentUser.role === 'supervisor';

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');
  const [myOnly, setMyOnly] = useState(false);
  const [abnormalOnly, setAbnormalOnly] = useState(false);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [resolveOpen, setResolveOpen] = useState<string | null>(null);

  const managers = usersByRole('manager');

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (myOnly) {
        const belong =
          (isLobby && c.registeredBy === currentUser.id) ||
          (isManager && c.handlerId === currentUser.id);
        if (!isSupervisor && !belong) return false;
      }
      if (abnormalOnly && !c.isAbnormal) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (keyword) {
        const kw = keyword.trim().toLowerCase();
        const inText =
          c.title.toLowerCase().includes(kw) ||
          c.content.toLowerCase().includes(kw) ||
          c.code.toLowerCase().includes(kw) ||
          c.customer.name.toLowerCase().includes(kw) ||
          c.customer.phone.includes(kw);
        if (!inText) return false;
      }
      return true;
    });
  }, [complaints, keyword, statusFilter, myOnly, abnormalOnly, currentUser, isLobby, isManager, isSupervisor]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">投诉记录</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isLobby
              ? '现场登记客户投诉，填写排队叫号和客户资料便于后续交接'
              : isManager
                ? '处理分派到你的投诉，调查后提交处理方案'
                : '分派投诉任务，监督进度，对异常和超时案例升级处理'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setAbnormalOnly((v) => !v)} leftIcon={<ShieldAlert size={15} />}>
            {abnormalOnly ? '显示全部' : '只看异常'}
          </Button>
          {!isSupervisor && (
            <Button variant="outline" onClick={() => setMyOnly((v) => !v)} leftIcon={<CheckSquare size={15} />}>
              {myOnly ? '显示全部' : '只看我的'}
            </Button>
          )}
          {isLobby && (
            <Button onClick={() => setRegisterOpen(true)} leftIcon={<Plus size={15} />}>登记投诉</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
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
            <span className="ml-auto text-sm text-slate-500">共 {filtered.length} 条</span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filtered.length === 0 ? (
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
                    <th className="px-5 py-3 text-right">常用动作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3.5 align-top">
                        <div className="font-mono text-xs text-slate-500">{c.code}</div>
                        <div className="mt-1">
                          <Badge tone="slate">{COMPLAINT_CATEGORY_LABEL[c.category]}</Badge>
                        </div>
                        {c.queueNo && (
                          <div className="mt-1 text-xs text-slate-400">排队号：{c.queueNo} · 窗口{c.counterNo}</div>
                        )}
                        {c.isAbnormal && (
                          <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                            <AlertTriangle size={12} />
                            {c.abnormalReason ?? '异常'}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        <div className="font-medium text-slate-800">{c.customer.name}</div>
                        <div className="text-xs text-slate-500">{c.customer.phone}</div>
                        {c.customer.level === 'vip' && (
                          <Badge className="mt-1" tone="warning">VIP</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        <button
                          onClick={() => navigate(`/complaints/${c.id}`)}
                          className="text-left text-sm font-medium text-slate-800 hover:text-bank-600"
                        >
                          {c.title}
                        </button>
                        <p className="mt-1 line-clamp-1 w-80 text-xs text-slate-500">{c.content}</p>
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        <ComplaintStatusBadge status={c.status} />
                      </td>
                      <td className="px-5 py-3.5 align-top text-xs">
                        <div className="text-slate-700">
                          处理人：<span className={cn(!c.handlerName && 'text-slate-400')}>{c.handlerName ?? '未分派'}</span>
                          {c.handlerRole && (
                            <span className="ml-1 rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-500">
                              {ROLE_LABEL[c.handlerRole]}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-slate-400">登记：{c.registeredByName}</div>
                      </td>
                      <td className="px-5 py-3.5 align-top text-xs text-slate-500">
                        {formatDateTime(c.registeredAt)}
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/complaints/${c.id}`)}
                            rightIcon={<ArrowRight size={13} />}
                          >
                            详情
                          </Button>
                          {isSupervisor && c.status === 'registered' && (
                            <Button
                              size="sm"
                              leftIcon={<UserPlus size={13} />}
                              onClick={() => setAssignOpen(c.id)}
                            >
                              分派
                            </Button>
                          )}
                          {isSupervisor && c.status !== 'resolved' && c.status !== 'escalated' && (
                            <Button
                              size="sm"
                              variant="warning"
                              leftIcon={<AlertTriangle size={13} />}
                              onClick={() => triggerAbnormalSample(c.id, '主管手工标记：该投诉存在高风险，需要重点关注')}
                            >
                              标异常
                            </Button>
                          )}
                          {isManager && c.handlerId === currentUser.id && c.status === 'investigating' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setResolveOpen(c.id)}
                            >
                              提交处理
                            </Button>
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

      {resolveOpen && (
        <ResolveModal
          open={!!resolveOpen}
          onClose={() => setResolveOpen(null)}
          onConfirm={(text) => {
            resolveComplaint(resolveOpen, text);
            setResolveOpen(null);
          }}
        />
      )}
    </div>
  );
};

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
      onClose={() => {
        reset();
        onClose();
      }}
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
              {Object.entries(COMPLAINT_CATEGORY_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>现场排队号</Label>
            <Input
              value={form.queueNo}
              onChange={(e) => setForm({ ...form, queueNo: e.target.value })}
              placeholder="如 A023"
            />
          </div>
        </div>

        <div>
          <Label required>投诉标题</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="一句话概括，方便后续快速查看"
          />
        </div>

        <div>
          <Label required>投诉详情</Label>
          <Textarea
            rows={4}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="详细描述客户诉求、现场情况、涉及窗口与柜员等"
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                checked={form.useExisting}
                onChange={() => setForm({ ...form, useExisting: true })}
              />
              选择系统已有客户
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                checked={!form.useExisting}
                onChange={() => setForm({ ...form, useExisting: false })}
              />
              录入新客户
            </label>
          </div>
          {form.useExisting ? (
            <Select
              value={form.existingCustomerId}
              onChange={(e) => setForm({ ...form, existingCustomerId: e.target.value })}
            >
              {mockCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.phone}{c.level === 'vip' ? ' · VIP' : ''}
                </option>
              ))}
            </Select>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>客户姓名</Label>
                <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
              </div>
              <div>
                <Label>手机号</Label>
                <Input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
              </div>
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label>办理窗口</Label>
              <Input
                value={form.counterNo}
                onChange={(e) => setForm({ ...form, counterNo: e.target.value })}
                placeholder="如 3号窗口"
              />
            </div>
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
        {managers.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} · {ROLE_LABEL[m.role]}
          </option>
        ))}
      </Select>
      <p className="mt-3 text-xs text-slate-500">
        分派后系统将记录交接信息，处理进度和最终回访责任由该客户经理承担。
      </p>
    </Modal>
  );
};

const ResolveModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
}> = ({ open, onClose, onConfirm }) => {
  const [text, setText] = useState('');
  return (
    <Modal
      open={open}
      title="提交处理方案"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button disabled={!text.trim()} onClick={() => onConfirm(text.trim())}>
            提交并进入回访
          </Button>
        </>
      }
    >
      <Label required>处理结果说明</Label>
      <Textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="说明调查结论、整改措施、客户补偿方案等，提交后将自动生成回访任务"
      />
      <p className="mt-3 text-xs text-slate-500">
        提交后投诉将进入「待回访核实」状态，并自动创建回访任务分派给你或主管指定人员。
      </p>
    </Modal>
  );
};

export default ComplaintList;
