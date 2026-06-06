import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MonitorPlay,
  Users,
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  FileCheck,
  XCircle,
  User,
  Ticket,
  RefreshCw,
} from 'lucide-react';
import { useHallStore } from '@/store/hallStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { useTicketStore } from '@/store/ticketStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Timeline, type TimelineItem } from '@/components/common/Timeline';
import { Modal } from '@/components/common/Modal';
import { formatDateTime, formatTime } from '@/utils/date';
import { hallStatusLabels, type HallStatus } from '@/types/common';
import type { AffectedSchedule } from '@/types/hall';

const HallDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    getHall,
    getHallLogs,
    getInspections,
    getFaultTickets,
    submitInspection,
    createFaultTicket,
    changeHallStatus,
    resolveFaultTicket,
    closeFaultTicket,
    updateFaultTicketStatus,
  } = useHallStore();
  const { getSchedulesByHall, getSchedule } = useScheduleStore();
  const { createRefundList, getRefundLists } = useTicketStore();

  const hall = id ? getHall(id) : undefined;
  const logs = id ? getHallLogs(id) : [];
  const inspections = id ? getInspections(id) : [];
  const faultTickets = id ? getFaultTickets(id) : [];
  const schedules = id ? getSchedulesByHall(id) : [];
  const activeSchedules = schedules.filter((s) => s.status === 'active' || s.status === 'adjusting');
  const allRefundLists = getRefundLists();
  const refundLists = allRefundLists.filter((r) => hall && r.hallName === hall.name);

  const getRefundListsByFaultTicket = (faultTicketId: string) => {
    return allRefundLists.filter((r) => r.faultTicketId === faultTicketId);
  };

  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [faultModalOpen, setFaultModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);

  const [inspectionResult, setInspectionResult] = useState<'normal' | 'warning' | 'fault'>('normal');
  const [inspectionRemark, setInspectionRemark] = useState('');
  const [faultTitle, setFaultTitle] = useState('');
  const [faultDescription, setFaultDescription] = useState('');
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [autoGenerateRefund, setAutoGenerateRefund] = useState(true);
  const [newStatus, setNewStatus] = useState<HallStatus>('idle');
  const [statusReason, setStatusReason] = useState('');
  const [resolveRemark, setResolveRemark] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!hall) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">影厅不存在</h2>
        <p className="text-gray-500 mb-4">该影厅记录可能不存在</p>
        <Link to="/hall" className="btn-primary">
          返回影厅列表
        </Link>
      </div>
    );
  }

  const timelineItems: TimelineItem[] = logs.map((log) => ({
    id: log.id,
    action: log.action,
    operator: log.operator,
    operatorRole: log.operatorRole,
    remark: log.reason,
    createdAt: log.createdAt,
  }));

  const toggleScheduleSelection = (scheduleId: string) => {
    setSelectedScheduleIds((prev) =>
      prev.includes(scheduleId)
        ? prev.filter((id) => id !== scheduleId)
        : [...prev, scheduleId]
    );
  };

  const handleSubmitInspection = () => {
    if (!inspectionRemark.trim() && inspectionResult !== 'normal') {
      setError('请填写巡检备注');
      return;
    }
    submitInspection({
      hallId: hall.id,
      result: inspectionResult,
      remark: inspectionRemark,
    });
    setInspectionModalOpen(false);
    setInspectionResult('normal');
    setInspectionRemark('');
    setError(null);
    setSuccess('巡检记录已提交');
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleCreateFault = () => {
    if (!faultTitle.trim()) {
      setError('请输入故障标题');
      return;
    }
    if (!faultDescription.trim()) {
      setError('请输入故障描述');
      return;
    }

    const affectedSchedules: AffectedSchedule[] = selectedScheduleIds.map((scheduleId) => {
      const schedule = getSchedule(scheduleId);
      return {
        scheduleId,
        scheduleName: schedule?.movieName || '',
        startTime: schedule?.startTime || '',
        endTime: schedule?.endTime || '',
        refundTicketIds: [],
      };
    });

    const newTicket = createFaultTicket(
      {
        hallId: hall.id,
        affectedScheduleIds: selectedScheduleIds,
        title: faultTitle,
        description: faultDescription,
      },
      affectedSchedules
    );

    if (autoGenerateRefund && selectedScheduleIds.length > 0) {
      const ticket = useHallStore.getState().faultTickets[useHallStore.getState().faultTickets.length - 1];
      if (ticket) {
        selectedScheduleIds.forEach((scheduleId) => {
          createRefundList(scheduleId, `设备故障：${faultTitle}`, ticket.id);
        });
      }
    }

    setFaultModalOpen(false);
    setFaultTitle('');
    setFaultDescription('');
    setSelectedScheduleIds([]);
    setAutoGenerateRefund(true);
    setError(null);
    setSuccess('故障工单已创建' + (autoGenerateRefund && selectedScheduleIds.length > 0 ? '，退票清单已生成' : ''));
    setTimeout(() => setSuccess(null), 2500);
  };

  const handleChangeStatus = () => {
    if (!statusReason.trim()) {
      setError('请填写状态变更原因');
      return;
    }
    changeHallStatus(hall.id, newStatus, statusReason);
    setStatusModalOpen(false);
    setStatusReason('');
    setError(null);
    setSuccess('影厅状态已更新');
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleResolveTicket = () => {
    if (!resolveRemark.trim()) {
      setError('请填写处理说明');
      return;
    }
    if (selectedTicketId) {
      resolveFaultTicket(selectedTicketId, resolveRemark);
      setResolveModalOpen(false);
      setResolveRemark('');
      setSelectedTicketId(null);
      setError(null);
      setSuccess('故障已解决');
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  const openResolveModal = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setResolveModalOpen(true);
  };

  const activeFaults = faultTickets.filter((t) => t.status !== 'closed');
  const closedFaults = faultTickets.filter((t) => t.status === 'closed');

  return (
    <div className="space-y-6">
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Link to="/hall" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{hall.name}</h1>
            <StatusBadge type="hall" status={hall.status} />
          </div>
          <p className="text-gray-500 mt-1">影厅详情 · 创建于 {formatDateTime(hall.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">影厅信息</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MonitorPlay className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">影厅名称</p>
                    <p className="font-medium text-gray-900">{hall.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">座位数量</p>
                    <p className="font-medium text-gray-900">{hall.seatCount} 座</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">设备配置</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hall.equipment.map((eq) => (
                        <span key={eq} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {hall.lastInspection && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">上次巡检</p>
                      <p className="font-medium text-gray-900">{formatDateTime(hall.lastInspection)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {activeFaults.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">活跃故障工单</h2>
              <div className="space-y-4">
                {activeFaults.map((ticket) => {
                  const ticketRefundLists = getRefundListsByFaultTicket(ticket.id);
                  return (
                    <div key={ticket.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{ticket.title}</h3>
                            <StatusBadge type="fault" status={ticket.status} />
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{ticket.description}</p>
                        </div>
                      </div>
                      {ticket.affectedSchedules && ticket.affectedSchedules.length > 0 && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                          <p className="text-xs font-medium text-amber-800 mb-2">受影响排片</p>
                          <div className="space-y-1">
                            {ticket.affectedSchedules.map((s) => (
                              <div key={s.scheduleId} className="text-xs text-amber-700 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                {s.scheduleName} ({formatTime(s.startTime)}-{formatTime(s.endTime)})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {ticketRefundLists.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg">
                          <p className="text-xs font-medium text-red-800 mb-2">关联退票清单 ({ticketRefundLists.length} 个)</p>
                          <div className="space-y-2">
                            {ticketRefundLists.map((refund) => (
                              <div key={refund.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{refund.scheduleName}</p>
                                  <p className="text-xs text-gray-500">{refund.ticketIds.length} 张票 · {refund.reason}</p>
                                </div>
                                <span className={`badge ${
                                  refund.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                  refund.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {refund.status === 'pending' ? '待处理' :
                                   refund.status === 'processing' ? '处理中' : '已完成'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          上报人：{ticket.reportedBy}
                          <span className="mx-1">·</span>
                          {formatDateTime(ticket.createdAt)}
                        </div>
                        <div className="flex gap-2">
                          {ticket.status === 'pending' && (
                            <button
                              onClick={() => updateFaultTicketStatus(ticket.id, 'processing')}
                              className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                            >
                              开始处理
                            </button>
                          )}
                          {ticket.status === 'processing' && (
                            <button
                              onClick={() => openResolveModal(ticket.id)}
                              className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              标记解决
                            </button>
                          )}
                          {ticket.status === 'resolved' && (
                            <button
                              onClick={() => closeFaultTicket(ticket.id)}
                              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              关闭工单
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {closedFaults.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">历史故障工单</h2>
              <div className="space-y-4">
                {closedFaults.map((ticket) => {
                  const ticketRefundLists = getRefundListsByFaultTicket(ticket.id);
                  return (
                    <div key={ticket.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 opacity-80">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{ticket.title}</h3>
                            <StatusBadge type="fault" status={ticket.status} />
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{ticket.description}</p>
                        </div>
                      </div>

                      {ticket.affectedSchedules && ticket.affectedSchedules.length > 0 && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                          <p className="text-xs font-medium text-amber-800 mb-2">受影响排片</p>
                          <div className="space-y-1">
                            {ticket.affectedSchedules.map((s) => (
                              <div key={s.scheduleId} className="text-xs text-amber-700 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                {s.scheduleName} ({formatTime(s.startTime)}-{formatTime(s.endTime)})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {ticketRefundLists.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg">
                          <p className="text-xs font-medium text-red-800 mb-2">关联退票清单 ({ticketRefundLists.length} 个)</p>
                          <div className="space-y-2">
                            {ticketRefundLists.map((refund) => (
                              <div key={refund.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{refund.scheduleName}</p>
                                  <p className="text-xs text-gray-500">{refund.ticketIds.length} 张票 · {refund.reason}</p>
                                </div>
                                <span className={`badge ${
                                  refund.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                  refund.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {refund.status === 'pending' ? '待处理' :
                                   refund.status === 'processing' ? '处理中' : '已完成'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                        <p className="text-xs font-medium text-gray-700 mb-2">关键流转信息</p>
                        <div className="space-y-1.5 text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                            <span className="text-gray-500">上报：</span>
                            <span>{ticket.reportedBy} · {formatDateTime(ticket.createdAt)}</span>
                          </div>
                          {(ticket.processStartedBy || ticket.processStartedAt) && (
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0"></span>
                              <span className="text-gray-500">开始处理：</span>
                              <span>{ticket.processStartedBy || '未知'} · {formatDateTime(ticket.processStartedAt || '')}</span>
                            </div>
                          )}
                          {(ticket.resolvedBy || ticket.resolvedAt) && (
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                              <span className="text-gray-500">解决：</span>
                              <span>{ticket.resolvedBy || ticket.handledBy || '未知'} · {formatDateTime(ticket.resolvedAt || '')}</span>
                            </div>
                          )}
                          {(ticket.closedBy || ticket.closedAt) && (
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full flex-shrink-0"></span>
                              <span className="text-gray-500">关闭：</span>
                              <span>{ticket.closedBy || ticket.handledBy || '系统'} · {formatDateTime(ticket.closedAt || '')}</span>
                            </div>
                          )}
                        </div>
                        {ticket.resolveRemark && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500">解决备注：<span className="text-gray-700">{ticket.resolveRemark}</span></p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {refundLists.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">退票清单</h2>
              <div className="space-y-3">
                {refundLists.slice(0, 5).map((refund) => (
                  <div key={refund.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{refund.scheduleName}</p>
                          <p className="text-xs text-gray-500">{refund.ticketIds.length} 张票 · {refund.reason}</p>
                        </div>
                      </div>
                      <span className={`badge ${
                        refund.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        refund.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {refund.status === 'pending' ? '待处理' :
                         refund.status === 'processing' ? '处理中' : '已完成'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inspections.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">巡检记录</h2>
              <div className="space-y-3">
                {inspections.slice(0, 5).map((inspection) => (
                  <div key={inspection.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck className={`w-5 h-5 ${
                          inspection.result === 'normal' ? 'text-green-500' :
                          inspection.result === 'warning' ? 'text-amber-500' : 'text-red-500'
                        }`} />
                        <span className="font-medium text-gray-900">
                          {inspection.result === 'normal' ? '正常' :
                           inspection.result === 'warning' ? '异常' : '故障'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{formatDateTime(inspection.createdAt)}</span>
                    </div>
                    {inspection.remark && (
                      <p className="text-sm text-gray-600 mt-2 pl-7">{inspection.remark}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2 pl-7">巡检人：{inspection.operator}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">状态流转记录</h2>
            <Timeline items={timelineItems} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">常用动作</h2>
            <div className="space-y-3">
              <button
                onClick={() => setInspectionModalOpen(true)}
                className="w-full btn-secondary justify-start"
              >
                <FileCheck className="w-4 h-4 mr-2" />
                提交巡检记录
              </button>
              <button
                onClick={() => setFaultModalOpen(true)}
                className="w-full btn-danger justify-start"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                上报设备故障
              </button>
              <button
                onClick={() => {
                  setNewStatus(hall.status === 'idle' ? 'maintenance' : 'idle');
                  setStatusModalOpen(true);
                }}
                className="w-full btn-secondary justify-start"
              >
                <Wrench className="w-4 h-4 mr-2" />
                变更影厅状态
              </button>
            </div>
          </div>

          {activeSchedules.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">当日排片</h2>
              <div className="space-y-2">
                {activeSchedules.map((schedule) => (
                  <Link
                    key={schedule.id}
                    to={`/schedule/${schedule.id}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <p className="font-medium text-gray-900 text-sm">{schedule.movieName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                      </span>
                      <StatusBadge type="schedule" status={schedule.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">影厅信息</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MonitorPlay className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">当前状态</p>
                  <p className="font-medium text-gray-900">{hallStatusLabels[hall.status]}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">座位数</p>
                  <p className="font-medium text-gray-900">{hall.seatCount} 座</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">创建时间</p>
                  <p className="font-medium text-gray-900">{formatDateTime(hall.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={inspectionModalOpen}
        onClose={() => {
          setInspectionModalOpen(false);
          setError(null);
        }}
        title="提交巡检记录"
        footer={
          <>
            <button
              onClick={() => {
                setInspectionModalOpen(false);
                setError(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button onClick={handleSubmitInspection} className="btn-primary">
              提交
            </button>
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">巡检结果</label>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'warning', 'fault'] as const).map((result) => (
                <button
                  key={result}
                  onClick={() => setInspectionResult(result)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    inspectionResult === result
                      ? result === 'normal'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : result === 'warning'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {result === 'normal' ? '正常' : result === 'warning' ? '异常' : '故障'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">巡检备注</label>
            <textarea
              value={inspectionRemark}
              onChange={(e) => setInspectionRemark(e.target.value)}
              placeholder="请填写巡检详情..."
              rows={3}
              className="input resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={faultModalOpen}
        onClose={() => {
          setFaultModalOpen(false);
          setError(null);
          setSelectedScheduleIds([]);
        }}
        title="上报设备故障"
        footer={
          <>
            <button
              onClick={() => {
                setFaultModalOpen(false);
                setError(null);
                setSelectedScheduleIds([]);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button onClick={handleCreateFault} className="btn-danger">
              提交工单
            </button>
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">故障标题</label>
            <input
              type="text"
              value={faultTitle}
              onChange={(e) => setFaultTitle(e.target.value)}
              placeholder="简要描述故障问题"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">故障详情</label>
            <textarea
              value={faultDescription}
              onChange={(e) => setFaultDescription(e.target.value)}
              placeholder="详细描述故障情况..."
              rows={3}
              className="input resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">受影响排片（可选）</label>
            {activeSchedules.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activeSchedules.map((schedule) => (
                  <label
                    key={schedule.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedScheduleIds.includes(schedule.id)
                        ? 'border-cinema-red bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedScheduleIds.includes(schedule.id)}
                      onChange={() => toggleScheduleSelection(schedule.id)}
                      className="w-4 h-4 rounded border-gray-300 text-cinema-red focus:ring-cinema-red"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{schedule.movieName}</p>
                      <p className="text-xs text-gray-500">
                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">当日暂无排片</p>
            )}
          </div>
          {selectedScheduleIds.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
              <input
                type="checkbox"
                checked={autoGenerateRefund}
                onChange={(e) => setAutoGenerateRefund(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-cinema-red focus:ring-cinema-red"
              />
              <div>
                <p className="text-sm font-medium text-amber-900">自动生成退票清单</p>
                <p className="text-xs text-amber-700">为选中排片的未使用票券生成退票申请</p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setError(null);
        }}
        title="变更影厅状态"
        footer={
          <>
            <button
              onClick={() => {
                setStatusModalOpen(false);
                setError(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button onClick={handleChangeStatus} className="btn-primary">
              确认变更
            </button>
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800">
              <strong>当前状态：</strong>
              {hallStatusLabels[hall.status]}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">目标状态</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as HallStatus)}
              className="input"
            >
              {Object.entries(hallStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">变更原因</label>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="请说明状态变更原因..."
              rows={3}
              className="input resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={resolveModalOpen}
        onClose={() => {
          setResolveModalOpen(false);
          setError(null);
          setSelectedTicketId(null);
        }}
        title="标记故障已解决"
        footer={
          <>
            <button
              onClick={() => {
                setResolveModalOpen(false);
                setError(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button onClick={handleResolveTicket} className="btn-success">
              确认解决
            </button>
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">处理说明</label>
          <textarea
            value={resolveRemark}
            onChange={(e) => setResolveRemark(e.target.value)}
            placeholder="请填写故障处理说明..."
            rows={4}
            className="input resize-none"
          />
        </div>
      </Modal>
    </div>
  );
};

export default HallDetail;
