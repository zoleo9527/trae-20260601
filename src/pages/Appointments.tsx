import { useState } from 'react';
import { Search, Check, X, CalendarClock } from 'lucide-react';
import { useAppointmentStore } from '../store/useAppointmentStore';
import { useUserStore } from '../store/useUserStore';
import { useScaleStore } from '../store/useScaleStore';
import { useRiskStore } from '../store/useRiskStore';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';
import { AppointmentDetailDrawer } from '../components/AppointmentDetailDrawer';
import type { Appointment, AppointmentStatus, AppointmentType } from '../types';

export function Appointments() {
  const { currentUser } = useUserStore();
  const { appointments, filterStatus, filterType, setFilterStatus, setFilterType, getFilteredAppointments, approveReschedule, rejectReschedule } = useAppointmentStore();
  const { scaleRecords } = useScaleStore();
  const { riskCases } = useRiskStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [rescheduleExpanded, setRescheduleExpanded] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const filteredAppointments = getFilteredAppointments()
    .filter((apt) => apt.clientName.includes(searchTerm))
    .filter((apt) => {
      if (currentUser.role === 'counselor' && currentUser.counselorId) {
        return apt.counselorId === currentUser.counselorId;
      }
      return true;
    });

  const rescheduleRequests = currentUser.role === 'reception'
    ? appointments.filter((a) => a.rescheduleRequest)
    : [];

  const relatedScaleRecord = selectedAppointment
    ? scaleRecords.find((s) => s.appointmentId === selectedAppointment.id)
    : undefined;

  const relatedRiskCase = selectedAppointment
    ? riskCases.find((r) => r.appointmentId === selectedAppointment.id && r.status === 'pending_review')
    : undefined;

  const statusOptions: { value: AppointmentStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部状态' },
    { value: 'scheduled', label: '已预约' },
    { value: 'rescheduled', label: '改期待确认' },
    { value: 'completed', label: '已完成' },
    { value: 'pending', label: '待分诊' },
  ];

  const typeOptions: { value: AppointmentType | 'all'; label: string }[] = [
    { value: 'all', label: '全部类型' },
    { value: 'initial', label: '初访' },
    { value: 'followup', label: '复访' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">预约管理</h1>
        <p className="muted-text mt-0.5">共 {filteredAppointments.length} 条</p>
      </div>

      {rescheduleRequests.length > 0 && currentUser.role === 'reception' && (
        <div className="card p-0 border-amber-100">
          <div className="px-5 py-3 border-b border-amber-50 bg-amber-50/30 rounded-t-lg">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-amber-600" />
              <h2 className="subsection-title text-amber-800">改期申请</h2>
              <span className="badge badge-pending">{rescheduleRequests.length}</span>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {rescheduleRequests.map((apt) => (
              <div key={apt.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setRescheduleExpanded(rescheduleExpanded === apt.id ? null : apt.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-text-primary">{apt.clientName}</span>
                      <TypeBadge type={apt.type} />
                    </div>
                    <p className="text-2xs text-text-tertiary mt-1">
                      原定 {apt.date} {apt.time} → 申请 {apt.rescheduleRequest?.requestedDate} {apt.rescheduleRequest?.requestedTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approveReschedule(apt.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    >
                      <Check size={14} /> 确认
                    </button>
                    <button
                      onClick={() => rejectReschedule(apt.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-text-secondary bg-surface-muted hover:bg-gray-200 transition-colors"
                    >
                      <X size={14} /> 拒绝
                    </button>
                  </div>
                </div>
                {rescheduleExpanded === apt.id && (
                  <div className="mt-3 p-3 bg-surface-muted rounded-md">
                    <p className="text-sm text-text-secondary">
                      <span className="text-text-tertiary">原因：</span>
                      {apt.rescheduleRequest?.reason}
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      <span className="text-text-tertiary">咨询师：</span>
                      {apt.counselorName}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="搜索编号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input w-56"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'all')}
          className="filter-select"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as AppointmentType | 'all')}
          className="filter-select"
        >
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-muted/50">
              <th className="text-left py-3 px-5 text-2xs font-medium text-text-tertiary">来访者</th>
              <th className="text-left py-3 px-5 text-2xs font-medium text-text-tertiary">日期</th>
              <th className="text-left py-3 px-5 text-2xs font-medium text-text-tertiary">时间</th>
              <th className="text-left py-3 px-5 text-2xs font-medium text-text-tertiary">咨询师</th>
              <th className="text-left py-3 px-5 text-2xs font-medium text-text-tertiary">类型</th>
              <th className="text-left py-3 px-5 text-2xs font-medium text-text-tertiary">量表</th>
              <th className="text-left py-3 px-5 text-2xs font-medium text-text-tertiary">状态</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.map((apt) => (
              <tr
                key={apt.id}
                className="table-row cursor-pointer"
                onClick={() => setSelectedAppointment(apt)}
              >
                <td className="py-3 px-5">
                  <span className="text-sm text-text-primary">{apt.clientName}</span>
                </td>
                <td className="py-3 px-5 text-sm text-text-secondary">{apt.date}</td>
                <td className="py-3 px-5 text-sm text-text-secondary">{apt.time}</td>
                <td className="py-3 px-5 text-sm text-text-secondary">{apt.counselorName || '—'}</td>
                <td className="py-3 px-5">
                  <TypeBadge type={apt.type} />
                </td>
                <td className="py-3 px-5">
                  <StatusBadge type="scale" status={apt.scaleStatus} />
                </td>
                <td className="py-3 px-5">
                  <StatusBadge type="appointment" status={apt.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAppointment && (
        <AppointmentDetailDrawer
          appointment={selectedAppointment}
          scaleRecord={relatedScaleRecord}
          riskCase={relatedRiskCase}
          userRole={currentUser.role}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}
