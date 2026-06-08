import { useEffect, useState } from 'react';
import {
  CalendarCheck,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  FileText,
  RotateCcw,
  Bell,
  CheckCircle,
  ClipboardList,
} from 'lucide-react';
import { api } from '../api';
import type { PickupAppointment, StatusChangeLog } from '../types';
import { STATUS_LABELS, ROLE_LABELS } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function Appointments() {
  const [appointments, setAppointments] = useState<PickupAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<StatusChangeLog[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterChanged, setFilterChanged] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.appointments.list(
        filterChanged ? { allocation_changed: 'true' } : undefined
      );
      setAppointments(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filterChanged]);

  const toggleLogs = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    try {
      const data = await api.appointments.logs(id);
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAction = async (appointmentId: number, action: string) => {
    try {
      await api.appointments.action({
        appointment_id: appointmentId,
        action,
        changed_by: '张受理',
        notes: actionNotes || undefined,
      });
      setActionNotes('');
      await loadData();
      if (expandedId === appointmentId) {
        const data = await api.appointments.logs(appointmentId);
        setLogs(data);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">提货预约</h1>
          <p className="text-sm text-slate-500 mt-1">
            库位分配变动自动同步，支持催办、退回、补材料
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterChanged(!filterChanged)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border ${
              filterChanged
                ? 'bg-orange-50 text-orange-600 border-orange-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-4 h-4" /> {filterChanged ? '只看库位变动' : '库位变动筛选'}
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => {
            const apptLogs = logs.filter(
              (l) => l.entity_type === 'pickup_appointment' && l.entity_id === appt.id
            );

            return (
              <div key={appt.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-800">预约#{appt.id}</span>
                        <StatusBadge status={appt.status} />
                        {appt.allocation_changed && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-medium animate-pulse">
                            <Bell className="w-3 h-3" /> 库位已变动
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span>预约人: {appt.appointee}</span>
                        <span>{appt.contact_phone}</span>
                        {appt.appointment_time && (
                          <span>
                            预约时间:{' '}
                            {new Date(appt.appointment_time).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-slate-400">库位:</span>
                        <span className="font-mono font-semibold text-slate-700">
                          {appt.allocation_snapshot}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        订单ID: {appt.order_id}
                      </div>
                    </div>
                  </div>

                  {appt.allocation_changed && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-orange-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-semibold">库位变更通知</span>
                        <span className="text-orange-600">
                          库位已调整为 {appt.allocation_snapshot}，请确认
                        </span>
                      </div>
                    </div>
                  )}

                  {appt.notes && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg text-sm text-blue-700">
                      {appt.notes.split('\n').map((line, i) => (
                        <div key={i}>
                          {line.startsWith('[') ? (
                            <span className="font-medium">{line}</span>
                          ) : (
                            line
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {appt.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(appt.id, 'confirm')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs hover:bg-teal-700"
                        >
                          <CheckCircle className="w-3 h-3" /> 确认预约
                        </button>
                        <button
                          onClick={() => handleAction(appt.id, 'escalate')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs hover:bg-rose-700"
                        >
                          <AlertTriangle className="w-3 h-3" /> 催办
                        </button>
                      </>
                    )}
                    {appt.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleAction(appt.id, 'complete')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700"
                        >
                          <CheckCircle className="w-3 h-3" /> 确认提货
                        </button>
                        <button
                          onClick={() => handleAction(appt.id, 'escalate')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs hover:bg-rose-100"
                        >
                          <AlertTriangle className="w-3 h-3" /> 催办
                        </button>
                        <button
                          onClick={() => handleAction(appt.id, 'reject')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs hover:bg-red-100"
                        >
                          <RotateCcw className="w-3 h-3" /> 退回
                        </button>
                      </>
                    )}
                    {(appt.status === 'pending' || appt.status === 'confirmed') && (
                      <button
                        onClick={() => handleAction(appt.id, 'supplement')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-xs hover:bg-amber-100"
                      >
                        <ClipboardList className="w-3 h-3" /> 补材料
                      </button>
                    )}
                    {appt.allocation_changed && (
                      <button
                        onClick={() => handleAction(appt.id, 'acknowledge_change')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs hover:bg-orange-700"
                      >
                        <Bell className="w-3 h-3" /> 确认库位变更
                      </button>
                    )}
                    {appt.status === 'escalated' && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold">
                        <AlertTriangle className="w-3 h-3" /> 催办中 - 请尽快处理
                      </span>
                    )}
                    <input
                      type="text"
                      placeholder="处理备注..."
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      className="flex-1 min-w-[200px] px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <button
                      onClick={() => toggleLogs(appt.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs hover:bg-slate-100"
                    >
                      <FileText className="w-3 h-3" /> 日志
                    </button>
                  </div>
                </div>

                {expandedId === appt.id && (
                  <div className="border-t border-slate-100 px-5 py-3 bg-slate-50">
                    <h4 className="text-xs font-semibold text-slate-500 mb-2">提货预约变更日志</h4>
                    <div className="space-y-2">
                      {apptLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 text-xs py-1.5 border-l-2 border-teal-200 pl-3"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-700">{log.changed_by}</span>
                              <span className="text-slate-400">
                                ({ROLE_LABELS[log.role] || log.role})
                              </span>
                              {log.from_status && (
                                <>
                                  <StatusBadge status={log.from_status} />
                                  <ArrowRight className="w-3 h-3 text-slate-300" />
                                </>
                              )}
                              <StatusBadge status={log.to_status} />
                            </div>
                            {log.notes && <p className="text-slate-500 mt-0.5">{log.notes}</p>}
                          </div>
                          <span className="text-slate-400 shrink-0">
                            {new Date(log.created_at).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
