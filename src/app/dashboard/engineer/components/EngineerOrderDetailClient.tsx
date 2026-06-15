'use client';

import { useState } from 'react';
import { dispatchEngineer, completeDiagnosis, startRepair, completeRepair } from '../actions';
import { RepairStatus } from '@/lib/enums';
import {
  REPAIR_STATUS_LABELS,
  REPAIR_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  formatDateTime,
  formatDate,
  ROLE_LABELS,
  APPOINTMENT_STATUS_LABELS,
  PART_REQUEST_STATUS_LABELS,
} from '@/lib/status';
import Link from 'next/link';

interface Props {
  order: any;
  parts: any[];
}

export default function EngineerOrderDetailClient({ order, parts }: Props) {
  const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'appointments' | 'parts'>('info');
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleDispatch = async () => {
    setLoading('dispatch');
    await dispatchEngineer(order.id);
    setLoading(null);
    window.location.reload();
  };

  const handleDiagnosis = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading('diagnosis');
    const formData = new FormData(e.currentTarget);
    formData.append('orderId', order.id);
    await completeDiagnosis(formData);
    setLoading(null);
    setShowDiagnosisModal(false);
    window.location.reload();
  };

  const handleStartRepair = async () => {
    setLoading('start');
    await startRepair(order.id);
    setLoading(null);
    window.location.reload();
  };

  const handleComplete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading('complete');
    const formData = new FormData(e.currentTarget);
    formData.append('orderId', order.id);
    await completeRepair(formData);
    setLoading(null);
    setShowCompleteModal(false);
    window.location.reload();
  };

  const canDispatch = [
    RepairStatus.ASSIGNED,
    RepairStatus.APPOINTMENT_SCHEDULED,
    RepairStatus.PARTS_DELIVERED,
  ].includes(order.status);

  const canDiagnosis = order.status === RepairStatus.ENGINEER_DISPATCHED;
  const canStartRepair = [RepairStatus.DIAGNOSIS_DONE, RepairStatus.PARTS_DELIVERED].includes(order.status);
  const canComplete = order.status === RepairStatus.REPAIR_IN_PROGRESS;

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
            {canDispatch && (
              <button onClick={handleDispatch} disabled={loading === 'dispatch'} className="btn-primary">
                {loading === 'dispatch' ? '处理中...' : '我已出发'}
              </button>
            )}
            {canDiagnosis && (
              <button onClick={() => setShowDiagnosisModal(true)} className="btn-primary">
                完成现场检测
              </button>
            )}
            {canStartRepair && (
              <button onClick={handleStartRepair} disabled={loading === 'start'} className="btn-success">
                {loading === 'start' ? '处理中...' : '开始维修'}
              </button>
            )}
            {canComplete && (
              <button onClick={() => setShowCompleteModal(true)} className="btn-success">
                维修完工
              </button>
            )}
            {[
              RepairStatus.ENGINEER_DISPATCHED,
              RepairStatus.DIAGNOSIS_DONE,
              RepairStatus.REPAIR_IN_PROGRESS,
              RepairStatus.PARTS_REQUESTED,
              RepairStatus.PARTS_DELIVERED,
            ].includes(order.status) && (
              <Link href={`/dashboard/engineer/parts?orderId=${order.id}`} className="btn-warning">
                申请配件
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {([
            ['info', '工单信息'],
            ['timeline', '处理记录'],
            ['appointments', '预约记录'],
            ['parts', '配件申请'],
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
            <h3 className="font-semibold text-gray-900 mb-4">客户与地址</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">客户姓名</span>
                <span className="font-medium text-gray-900">{order.customer.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">联系电话</span>
                <span className="font-medium text-gray-900 font-mono">{order.customer.phone}</span>
              </div>
              <div className="py-2">
                <span className="text-gray-500 block mb-1">服务地址</span>
                <p className="font-medium text-gray-900">{order.customer.address}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">家电故障信息</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">类型/品牌</span>
                <span className="font-medium text-gray-900">
                  {order.applianceBrand} {order.applianceType}
                </span>
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
            <div className="card text-center py-12 text-gray-500">暂无预约记录</div>
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
                    {apt.note && (
                      <p className="mt-3 text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">备注：{apt.note}</p>
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
          {[
            RepairStatus.ENGINEER_DISPATCHED,
            RepairStatus.DIAGNOSIS_DONE,
            RepairStatus.REPAIR_IN_PROGRESS,
            RepairStatus.PARTS_REQUESTED,
            RepairStatus.PARTS_DELIVERED,
          ].includes(order.status) && (
            <Link
              href={`/dashboard/engineer/parts?orderId=${order.id}`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              发起配件申请
            </Link>
          )}
          {order.partRequests.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">暂无配件申请</div>
          ) : (
            order.partRequests.map((pr: any) => (
              <div key={pr.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="badge bg-orange-100 text-orange-700">
                      {PART_REQUEST_STATUS_LABELS[pr.status]}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">申请时间：{formatDateTime(pr.createdAt)}</span>
                  </div>
                </div>
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-500">配件名称</th>
                      <th className="text-left py-2 text-gray-500">编号</th>
                      <th className="text-right py-2 text-gray-500">申请数量</th>
                      <th className="text-right py-2 text-gray-500">已出库</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pr.items.map((item: any) => (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="py-3 font-medium text-gray-900">{item.part.name}</td>
                        <td className="py-3 text-gray-600 font-mono">{item.part.partNo}</td>
                        <td className="py-3 text-right">{item.quantity} {item.part.unit}</td>
                        <td className="py-3 text-right text-green-600">{item.deliveredQty} {item.part.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pr.note && <p className="text-sm text-gray-600">申请备注：{pr.note}</p>}
                {pr.approvalNote && (
                  <p className="text-sm text-gray-600 mt-1">审批意见：{pr.approvalNote}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {showDiagnosisModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">完成现场检测</h3>
            <form onSubmit={handleDiagnosis} className="space-y-4">
              <div>
                <label className="label">检测结果与说明 *</label>
                <textarea
                  name="diagnosisNote"
                  className="input min-h-[120px]"
                  required
                  placeholder="请详细描述故障原因、检测结果、所需配件等信息"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowDiagnosisModal(false)} className="btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn-primary" disabled={loading === 'diagnosis'}>
                  {loading === 'diagnosis' ? '提交中...' : '提交检测结果'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">维修完工确认</h3>
            <form onSubmit={handleComplete} className="space-y-4">
              <div>
                <label className="label">维修情况说明 *</label>
                <textarea
                  name="repairNote"
                  className="input min-h-[120px]"
                  required
                  placeholder="请描述维修内容、更换配件、试运行情况、客户现场确认等"
                ></textarea>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-700">
                提示：提交后将进入客服回访环节，客户确认后工单关闭。
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCompleteModal(false)} className="btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn-success" disabled={loading === 'complete'}>
                  {loading === 'complete' ? '提交中...' : '确认完工'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
