'use client';

import { useState } from 'react';
import { acceptOrder, assignOrder, scheduleAppointment, confirmCustomer, closeOrder } from '../actions';
import { RepairStatus, Role } from '@/lib/enums';
import {
  REPAIR_STATUS_LABELS,
  REPAIR_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  PART_REQUEST_STATUS_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  formatDateTime,
  formatDate,
  ROLE_LABELS,
} from '@/lib/status';

interface Props {
  order: any;
  engineers: { id: string; name: string; role: Role }[];
}

export default function OrderDetailClient({ order, engineers }: Props) {
  const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'appointments' | 'parts'>('info');
  const [isAccepting, setIsAccepting] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    const result = await acceptOrder(order.id);
    setIsAccepting(false);
    if (!result.error) {
      window.location.reload();
    }
  };

  const handleAssign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('orderId', order.id);
    await assignOrder(formData);
    setShowAssignModal(false);
    window.location.reload();
  };

  const handleSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('orderId', order.id);
    await scheduleAppointment(formData);
    setShowAppointmentModal(false);
    window.location.reload();
  };

  const handleConfirmCustomer = async () => {
    await confirmCustomer(order.id);
    window.location.reload();
  };

  const handleClose = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('orderId', order.id);
    await closeOrder(formData);
    setShowCloseModal(false);
    window.location.reload();
  };

  const canAccept = order.status === RepairStatus.PENDING;
  const canAssign = [RepairStatus.ACCEPTED, RepairStatus.PENDING].includes(order.status);
  const canSchedule = [RepairStatus.ACCEPTED, RepairStatus.ASSIGNED].includes(order.status);
  const canConfirm = order.status === RepairStatus.REPAIR_COMPLETED;
  const canClose = [RepairStatus.REPAIR_COMPLETED, RepairStatus.CUSTOMER_CONFIRMED].includes(order.status);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">工单 {order.orderNo}</h1>
              <span className={`badge ${REPAIR_STATUS_COLORS[order.status as RepairStatus]} text-sm px-3 py-1`}>
                {REPAIR_STATUS_LABELS[order.status as RepairStatus]}
              </span>
              <span className={`badge ${PRIORITY_COLORS[order.priority]} text-sm px-3 py-1`}>
                {PRIORITY_LABELS[order.priority]}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">创建时间：{formatDateTime(order.createdAt)}</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {canAccept && (
              <button onClick={handleAccept} disabled={isAccepting} className="btn-primary">
                {isAccepting ? '受理中...' : '受理工单'}
              </button>
            )}
            {canAssign && (
              <button onClick={() => setShowAssignModal(true)} className="btn-secondary">
                分配工程师
              </button>
            )}
            {canSchedule && (
              <button onClick={() => setShowAppointmentModal(true)} className="btn-primary">
                预约上门
              </button>
            )}
            {canConfirm && (
              <button onClick={handleConfirmCustomer} className="btn-success">
                客户确认回访
              </button>
            )}
            {canClose && (
              <button onClick={() => setShowCloseModal(true)} className="btn-success">
                关闭工单
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {([
            ['info', '基本信息'],
            ['timeline', '状态流转记录'],
            ['appointments', '上门预约记录'],
            ['parts', '配件申请记录'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              客户信息
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">姓名</span>
                <span className="font-medium text-gray-900">{order.customer.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">电话</span>
                <span className="font-medium text-gray-900 font-mono">{order.customer.phone}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">地址</span>
                <span className="font-medium text-gray-900 text-right max-w-xs">{order.customer.address}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              家电与故障
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">类型</span>
                <span className="font-medium text-gray-900">{order.applianceType}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">品牌</span>
                <span className="font-medium text-gray-900">{order.applianceBrand}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">型号</span>
                <span className="font-medium text-gray-900">{order.applianceModel || '-'}</span>
              </div>
              <div className="py-2">
                <span className="text-gray-500 block mb-1">故障描述</span>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{order.faultDescription}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              处理人员
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">受理人</span>
                <span className="font-medium text-gray-900">{order.acceptedBy?.name || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">负责工程师</span>
                <span className="font-medium text-gray-900">{order.assignedTo?.name || '未分配'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">结单人</span>
                <span className="font-medium text-gray-900">{order.closedBy?.name || '-'}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              结案信息
            </h3>
            <div className="space-y-3">
              <div className="py-2">
                <span className="text-gray-500 block mb-1">结案备注</span>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {order.closedNote || '工单尚未关闭'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="card">
          <div className="relative pl-8">
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200"></div>
            {order.statusLogs.map((log: any, idx: number) => (
              <div key={log.id} className="relative pb-8 last:pb-0">
                <div
                  className={`absolute -left-5 w-4 h-4 rounded-full border-4 border-white ${
                    idx === order.statusLogs.length - 1 ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                ></div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${REPAIR_STATUS_COLORS[log.toStatus as RepairStatus]}`}>
                        {REPAIR_STATUS_LABELS[log.toStatus as RepairStatus]}
                      </span>
                      {log.fromStatus && (
                        <>
                          <span className="text-gray-400">←</span>
                          <span className="text-sm text-gray-500">
                            {REPAIR_STATUS_LABELS[log.fromStatus as RepairStatus]}
                          </span>
                        </>
                      )}
                    </div>
                    {log.note && <p className="mt-2 text-gray-700">{log.note}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{log.operator.name}</div>
                    <div className="text-xs text-gray-500">{ROLE_LABELS[log.operator.role]}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatDateTime(log.createdAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {order.appointments.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              暂无上门预约记录
            </div>
          ) : (
            order.appointments.map((apt: any) => (
              <div key={apt.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-gray-900">
                        {formatDate(apt.scheduledDate)} {apt.timeSlot}
                      </span>
                      <span className="badge bg-blue-100 text-blue-700">
                        {APPOINTMENT_STATUS_LABELS[apt.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      上门工程师：{apt.engineer?.name || '未指定'} | 预约创建：{apt.createdBy.name}
                    </p>
                    {apt.note && (
                      <p className="mt-3 text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
                        备注：{apt.note}
                      </p>
                    )}
                    {apt.completionNote && (
                      <p className="mt-2 text-gray-700 bg-green-50 p-3 rounded-lg text-sm">
                        完成备注：{apt.completionNote}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>创建：{formatDateTime(apt.createdAt)}</div>
                    {apt.completedAt && <div className="text-green-600">完成：{formatDateTime(apt.completedAt)}</div>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'parts' && (
        <div className="space-y-4">
          {order.partRequests.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              暂无配件申请记录
            </div>
          ) : (
            order.partRequests.map((pr: any) => (
              <div key={pr.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="badge bg-orange-100 text-orange-700">
                      {PART_REQUEST_STATUS_LABELS[pr.status]}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">申请单号：{pr.id.slice(-8)}</span>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>申请人：{pr.requestedBy.name}</div>
                    <div>申请时间：{formatDateTime(pr.createdAt)}</div>
                  </div>
                </div>
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-500">配件名称</th>
                      <th className="text-left py-2 text-gray-500">编号</th>
                      <th className="text-left py-2 text-gray-500">分类</th>
                      <th className="text-right py-2 text-gray-500">申请数量</th>
                      <th className="text-right py-2 text-gray-500">已出库</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pr.items.map((item: any) => (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="py-3 font-medium text-gray-900">{item.part.name}</td>
                        <td className="py-3 text-gray-600 font-mono">{item.part.partNo}</td>
                        <td className="py-3 text-gray-600">{item.part.category}</td>
                        <td className="py-3 text-right text-gray-900">{item.quantity} {item.part.unit}</td>
                        <td className="py-3 text-right text-green-600">{item.deliveredQty} {item.part.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pr.note && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">申请备注：{pr.note}</p>}
                {pr.approvalNote && pr.approvedBy && (
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg mt-2">
                    {pr.approvedBy.name} 审批：{pr.approvalNote}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">分配工程师</h3>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="label">选择工程师 *</label>
                <select name="engineerId" className="select" required>
                  <option value="">请选择工程师</option>
                  {engineers.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">备注</label>
                <textarea name="note" className="input min-h-[80px]" placeholder="选填，说明分配原因等"></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  确认分配
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">预约上门</h3>
            <form onSubmit={handleSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">预约日期 *</label>
                  <input type="date" name="scheduledDate" className="input" required />
                </div>
                <div>
                  <label className="label">时间段 *</label>
                  <select name="timeSlot" className="select" required>
                    <option value="09:00-11:00">上午 09:00-11:00</option>
                    <option value="10:00-12:00">上午 10:00-12:00</option>
                    <option value="14:00-16:00">下午 14:00-16:00</option>
                    <option value="15:00-17:00">下午 15:00-17:00</option>
                    <option value="18:00-20:00">晚间 18:00-20:00</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">上门工程师 *</label>
                <select name="engineerId" className="select" required>
                  {!order.assignedToId && <option value="">请选择工程师</option>}
                  {engineers.map((eng) => (
                    <option key={eng.id} value={eng.id} selected={eng.id === order.assignedToId}>
                      {eng.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">备注</label>
                <textarea name="note" className="input min-h-[80px]" placeholder="客户特殊要求等"></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAppointmentModal(false)} className="btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  确认预约
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">关闭工单</h3>
            <form onSubmit={handleClose} className="space-y-4">
              <div>
                <label className="label">结案备注</label>
                <textarea
                  name="closedNote"
                  className="input min-h-[100px]"
                  placeholder="请填写结案说明、客户反馈、满意度等"
                  required
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCloseModal(false)} className="btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn-success">
                  确认关闭
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
