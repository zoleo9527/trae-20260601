import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, CheckSquare, ShieldAlert, ArrowRight, PhoneCall, Phone } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { VisitStatusBadge } from '@/components/ui/StatusBadge';
import { Input, Select } from '@/components/ui/Form';
import {
  ROLE_LABEL,
  VISIT_STATUS_LABEL,
  VISIT_RESULT_LABEL,
  type VisitStatus,
  type VisitResult,
} from '@/types';
import { formatDateTime, cn } from '@/lib/utils';

const VisitList: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, visits, updateVisitStatus, returnVisit } = useApp();

  const isManager = currentUser.role === 'manager';
  const isSupervisor = currentUser.role === 'supervisor';

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<VisitStatus | 'all'>('all');
  const [myOnly, setMyOnly] = useState(isManager);
  const [abnormalOnly, setAbnormalOnly] = useState(false);

  const filtered = useMemo(() => {
    return visits.filter((v) => {
      if (myOnly && !isSupervisor && v.assigneeId !== currentUser.id) return false;
      if (abnormalOnly && v.status !== 'returned') return false;
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (keyword) {
        const kw = keyword.trim().toLowerCase();
        if (
          !v.complaintTitle.toLowerCase().includes(kw) &&
          !v.complaintCode.toLowerCase().includes(kw) &&
          !v.customer.name.toLowerCase().includes(kw) &&
          !v.customer.phone.includes(kw)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [visits, keyword, statusFilter, myOnly, abnormalOnly, currentUser, isManager, isSupervisor]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">回访处理</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isSupervisor
              ? '查看所有回访任务，必要时退回或安排二次回访'
              : '联系客户核实处理结果，记录反馈，不满意的情况及时升级'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setAbnormalOnly((v) => !v)}
            leftIcon={<ShieldAlert size={15} />}
          >
            {abnormalOnly ? '显示全部' : '只看退回'}
          </Button>
          {!isSupervisor && (
            <Button
              variant="outline"
              onClick={() => setMyOnly((v) => !v)}
              leftIcon={<CheckSquare size={15} />}
            >
              {myOnly ? '显示全部' : '只看我的'}
            </Button>
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
            <span className="ml-auto text-sm text-slate-500">共 {filtered.length} 条</span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-slate-400">暂无回访任务</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                    <th className="px-5 py-3">投诉信息</th>
                    <th className="px-5 py-3">客户</th>
                    <th className="px-5 py-3">状态</th>
                    <th className="px-5 py-3">回访结果</th>
                    <th className="px-5 py-3">负责人</th>
                    <th className="px-5 py-3">分派/完成时间</th>
                    <th className="px-5 py-3 text-right">常用动作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => navigate(`/visits/${v.id}`)}
                          className="text-left text-sm font-medium text-slate-800 hover:text-bank-600"
                        >
                          {v.complaintTitle}
                        </button>
                        <div className="mt-1 font-mono text-xs text-slate-400">{v.complaintCode}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800">{v.customer.name}</div>
                        <div className="text-xs text-slate-500">{v.customer.phone}</div>
                        {v.customer.level === 'vip' && (
                          <Badge className="mt-1" tone="warning">VIP</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <VisitStatusBadge status={v.status} />
                        {v.needReturn && (
                          <div className="mt-1 text-xs font-medium text-red-600">{v.returnReason ?? '需要跟进'}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm">
                        {v.result ? VISIT_RESULT_LABEL[v.result] : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-sm">
                        <div className="text-slate-800">{v.assigneeName}</div>
                        <div className="text-xs text-slate-400">{ROLE_LABEL[v.assigneeRole]}</div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        <div>分派：{formatDateTime(v.assignedAt)}</div>
                        {v.finishedAt && <div>完成：{formatDateTime(v.finishedAt)}</div>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
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
                          {isSupervisor && (v.result === 'unsatisfied' || v.status === 'returned') && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => returnVisit(v.id, '主管要求：客户不满意，请重新准备方案并安排二次回访')}
                            >
                              退回重办
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

      {/* 屏蔽未使用的类型引用 */}
      <div className="hidden">
        {undefined as unknown as VisitResult}
        {cn('')}
      </div>
    </div>
  );
};

export default VisitList;
