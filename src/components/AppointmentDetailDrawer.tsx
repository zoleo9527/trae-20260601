import { X, Calendar, Clock, User, FileText, AlertTriangle, Bell, Scale } from 'lucide-react';
import type { Appointment, ScaleRecord, RiskCase, UserRole } from '../types';
import { StatusBadge, TypeBadge } from './StatusBadge';

interface AppointmentDetailDrawerProps {
  appointment: Appointment;
  scaleRecord?: ScaleRecord;
  riskCase?: RiskCase;
  userRole: UserRole;
  onClose: () => void;
}

export function AppointmentDetailDrawer({
  appointment,
  scaleRecord,
  riskCase,
  userRole,
  onClose,
}: AppointmentDetailDrawerProps) {
  const canSeeRiskDetail = userRole === 'reception' || userRole === 'supervisor';

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-100 z-50 flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="subsection-title">预约详情</h2>
            <p className="text-2xs text-text-tertiary mt-0.5">{appointment.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-text-tertiary hover:bg-surface-muted hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                  <User size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{appointment.clientName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <TypeBadge type={appointment.type} />
                    <StatusBadge type="appointment" status={appointment.status} />
                  </div>
                </div>
              </div>
            </div>

            <div className="divider" />

            <div className="space-y-4">
              <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                基本信息
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-text-tertiary" />
                  <div>
                    <p className="text-2xs text-text-tertiary">日期</p>
                    <p className="text-sm text-text-primary">{appointment.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-text-tertiary" />
                  <div>
                    <p className="text-2xs text-text-tertiary">时间</p>
                    <p className="text-sm text-text-primary">{appointment.time}</p>
                  </div>
                </div>
                {appointment.counselorName && (
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-text-tertiary" />
                    <div>
                      <p className="text-2xs text-text-tertiary">咨询师</p>
                      <p className="text-sm text-text-primary">{appointment.counselorName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="divider" />

            <div className="space-y-4">
              <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                量表状态
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Scale size={16} className="text-text-tertiary" />
                    <span className="text-sm text-text-primary">当前状态</span>
                  </div>
                  <StatusBadge type="scale" status={appointment.scaleStatus} />
                </div>
                {scaleRecord && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell size={16} className="text-text-tertiary" />
                        <span className="text-sm text-text-primary">来访者通知</span>
                      </div>
                      <span className={`badge ${scaleRecord.clientNotified ? 'badge-normal' : 'badge-completed'}`}>
                        {scaleRecord.clientNotified ? '已通知' : '未通知'}
                      </span>
                    </div>
                    {scaleRecord.needsRetest && scaleRecord.retestDeadline && (
                      <div className="p-3 bg-amber-50 rounded-md">
                        <p className="text-sm text-amber-800">
                          <span className="font-medium">需复测</span>
                          <span className="text-amber-600 ml-2">截止：{scaleRecord.retestDeadline}</span>
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {appointment.rescheduleRequest && (
              <>
                <div className="divider" />
                <div className="space-y-4">
                  <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    改期申请
                  </h3>
                  <div className="p-4 bg-amber-50 rounded-md space-y-3">
                    <div>
                      <p className="text-2xs text-amber-600">原预约</p>
                      <p className="text-sm text-amber-800 font-medium">
                        {appointment.date} {appointment.time}
                      </p>
                    </div>
                    <div>
                      <p className="text-2xs text-amber-600">申请改至</p>
                      <p className="text-sm text-amber-800 font-medium">
                        {appointment.rescheduleRequest.requestedDate} {appointment.rescheduleRequest.requestedTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-2xs text-amber-600">申请原因</p>
                      <p className="text-sm text-amber-800">
                        {appointment.rescheduleRequest.reason}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {riskCase && (
              <>
                <div className="divider" />
                <div className="space-y-4">
                  <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    风险提醒
                  </h3>
                  <div
                    className={`p-4 rounded-md space-y-3 ${
                      riskCase.riskLevel === 'critical' ? 'bg-red-50' : 'bg-amber-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        size={16}
                        className={riskCase.riskLevel === 'critical' ? 'text-red-600' : 'text-amber-600'}
                      />
                      <span
                        className={`text-sm font-medium ${
                          riskCase.riskLevel === 'critical' ? 'text-red-800' : 'text-amber-800'
                        }`}
                      >
                        {riskCase.riskLevel === 'critical' ? '极高风险' : '高风险'}
                      </span>
                      <span
                        className={`badge ${
                          riskCase.riskLevel === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        待督导确认
                      </span>
                    </div>
                    {canSeeRiskDetail && (
                      <div>
                        <p
                          className={`text-2xs ${
                            riskCase.riskLevel === 'critical' ? 'text-red-600' : 'text-amber-600'
                          }`}
                        >
                          风险指标
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {riskCase.riskIndicators.map((indicator, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-0.5 rounded ${
                                riskCase.riskLevel === 'critical'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {indicator}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {!canSeeRiskDetail && (
                      <p
                        className={`text-xs ${
                          riskCase.riskLevel === 'critical' ? 'text-red-600' : 'text-amber-600'
                        }`}
                      >
                        具体风险指标需督导查看
                      </p>
                    )}
                    <p
                      className={`text-2xs ${
                        riskCase.riskLevel === 'critical' ? 'text-red-500' : 'text-amber-500'
                      }`}
                    >
                      上报人：{riskCase.counselorName} · {riskCase.reportedAt}
                    </p>
                  </div>
                </div>
              </>
            )}

            {appointment.notes && (
              <>
                <div className="divider" />
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    备注
                  </h3>
                  <div className="flex items-start gap-3">
                    <FileText size={16} className="text-text-tertiary mt-0.5" />
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {appointment.notes}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
