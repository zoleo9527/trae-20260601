import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Clock, Phone, Users } from 'lucide-react';
import { useState } from 'react';
import { StatusTag } from '../components/StatusTag';
import { useAppStore } from '../store/appStore';
import type { NotifyStatus } from '../types';

export function RecallManage() {
  const { recalls, updateRecallCustomer, completeRecall } = useAppStore();
  const [expandedRecall, setExpandedRecall] = useState<string | null>(recalls[0]?.id || null);
  const [finalDisposition, setFinalDisposition] = useState<Record<string, string>>({});

  const stats = {
    total: recalls.length,
    notifying: recalls.filter((r) => r.status === 'notifying').length,
    completed: recalls.filter((r) => r.status === 'completed').length,
    totalCustomers: recalls.reduce((sum, r) => sum + r.customers.length, 0),
  };

  const getRecallStats = (recall: typeof recalls[0]) => {
    const customers = recall.customers;
    const pending = customers.filter((c) => c.notifyStatus === 'pending').length;
    const confirmed = customers.filter((c) => c.notifyStatus === 'confirmed').length;
    const returned = customers.filter((c) => c.notifyStatus === 'returned').length;
    return {
      total: customers.length,
      pending,
      notified: customers.filter((c) => c.notifyStatus === 'notified').length,
      confirmed,
      returned,
      totalReturnedQty: customers.reduce((sum, c) => sum + (c.returnedQuantity || 0), 0),
      canComplete: pending === 0 && (confirmed + returned === customers.length),
    };
  };

  const handleStatusChange = (recallId: string, customerId: string, newStatus: NotifyStatus) => {
    updateRecallCustomer(recallId, customerId, {
      notifyStatus: newStatus,
      notifyTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });
  };

  const handleCompleteRecall = (recallId: string) => {
    completeRecall(recallId, finalDisposition[recallId] || '');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">召回管理</h2>
        <p className="text-slate-500 mt-1">管理召回任务，追踪客户通知和退货状态</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="召回任务总数" value={stats.total} color="red" icon={AlertTriangle} />
        <StatCard label="通知中" value={stats.notifying} color="amber" icon={Clock} />
        <StatCard label="已完成" value={stats.completed} color="green" icon={CheckCircle} />
        <StatCard label="涉及客户" value={stats.totalCustomers} color="blue" icon={Users} />
      </div>

      <div className="space-y-4">
        {recalls.map((recall) => (
          <div
            key={recall.id}
            className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
          >
            <div
              className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
              onClick={() =>
                setExpandedRecall(expandedRecall === recall.id ? null : recall.id)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-red-100 text-red-600 rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-800">{recall.caseNo}</h3>
                      <StatusTag type="recall" status={recall.status} />
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {recall.productName} · 批号 {recall.batchNo}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-800">
                      {recall.customers.length}
                    </div>
                    <div className="text-xs text-slate-500">涉及客户</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {
                        recall.customers.filter((c) => c.notifyStatus === 'returned')
                          .length
                      }
                    </div>
                    <div className="text-xs text-slate-500">已退回</div>
                  </div>
                  {expandedRecall === recall.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                <span className="font-medium text-slate-700">召回原因：</span>
                {recall.reason}
              </div>
            </div>

            {expandedRecall === recall.id && (
              <div className="border-t border-slate-200">
                <div className="p-5 bg-slate-50/50 border-b border-slate-200">
                  <div className="text-sm font-medium text-slate-700 mb-3">召回进度汇总</div>
                  <div className="grid grid-cols-5 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                      <div className="text-2xl font-bold text-slate-700">{getRecallStats(recall).total}</div>
                      <div className="text-xs text-slate-500 mt-0.5">涉及客户</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                      <div className="text-2xl font-bold text-blue-600">{getRecallStats(recall).notified}</div>
                      <div className="text-xs text-slate-500 mt-0.5">已通知</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                      <div className="text-2xl font-bold text-amber-600">{getRecallStats(recall).confirmed}</div>
                      <div className="text-xs text-slate-500 mt-0.5">已确认</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                      <div className="text-2xl font-bold text-green-600">{getRecallStats(recall).returned}</div>
                      <div className="text-xs text-slate-500 mt-0.5">已退回</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                      <div className="text-2xl font-bold text-[#1E3A5F]">
                        {getRecallStats(recall).totalReturnedQty}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">退回总量 (kg)</div>
                    </div>
                  </div>
                  {recall.status === 'completed' && recall.completedAt && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">召回已完成</span>
                        <span className="text-xs text-green-600 ml-auto">{recall.completedAt}</span>
                      </div>
                      {recall.finalDisposition && (
                        <div className="text-sm text-green-600">
                          <span className="font-medium">最终处置：</span>{recall.finalDisposition}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          客户名称
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          联系人
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          发货数量
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          发货日期
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          通知状态
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          已退回
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recall.customers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-800">
                              {customer.customerName}
                            </div>
                            {customer.remark && (
                              <div className="text-xs text-slate-500 mt-1">
                                {customer.remark}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm text-slate-700">{customer.contact}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-medium text-slate-700">
                              {customer.shippedQuantity} {customer.unit}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-slate-600">
                              {customer.shippedDate}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <StatusTag type="notify" status={customer.notifyStatus} />
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-medium text-slate-700">
                              {customer.returnedQuantity || 0} {customer.unit}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={customer.notifyStatus}
                                onChange={(e) =>
                                  handleStatusChange(
                                    recall.id,
                                    customer.id,
                                    e.target.value as NotifyStatus
                                  )
                                }
                                disabled={recall.status === 'completed'}
                                className="text-xs px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="pending">标记待通知</option>
                                <option value="notified">标记已通知</option>
                                <option value="confirmed">标记已确认</option>
                                <option value="returned">标记已退回</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {recall.status !== 'completed' && (
                  <div
                    className={`p-5 border-t ${
                      getRecallStats(recall).canComplete
                        ? 'bg-green-50/50 border-green-200'
                        : 'bg-slate-50/50 border-slate-200'
                    }`}
                  >
                    <div
                      className={`text-sm font-medium mb-3 ${
                        getRecallStats(recall).canComplete
                          ? 'text-green-800'
                          : 'text-slate-700'
                      }`}
                    >
                      完成召回
                    </div>

                    <div
                      className={`mb-4 p-3 rounded-lg border ${
                        getRecallStats(recall).canComplete
                          ? 'bg-green-100/50 border-green-200 text-green-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}
                    >
                      {getRecallStats(recall).canComplete ? (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>
                            所有客户已处理完毕（
                            {getRecallStats(recall).total}
                            家全部已确认或已退回），可完成召回
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1.5 text-sm">
                          <div className="font-medium">召回完成条件：</div>
                          <div className="flex items-center gap-2">
                            {getRecallStats(recall).pending === 0 ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400" />
                            )}
                            <span>
                              所有客户已通知（剩余
                              {' '}
                              {getRecallStats(recall).pending}
                              {' '}
                              家待通知）
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getRecallStats(recall).confirmed +
                              getRecallStats(recall).returned ===
                            getRecallStats(recall).total ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400" />
                            )}
                            <span>
                              所有客户已确认或已退回（剩余
                              {' '}
                              {getRecallStats(recall).total -
                                getRecallStats(recall).confirmed -
                                getRecallStats(recall).returned}
                              {' '}
                              家处理中）
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <label
                          className={`block text-xs mb-1.5 ${
                            getRecallStats(recall).canComplete
                              ? 'text-green-700'
                              : 'text-slate-500'
                          }`}
                        >
                          最终处置说明（可选）
                        </label>
                        <input
                          type="text"
                          value={finalDisposition[recall.id] || ''}
                          onChange={(e) =>
                            setFinalDisposition((prev) => ({
                              ...prev,
                              [recall.id]: e.target.value,
                            }))
                          }
                          placeholder="如：剩余库存销毁、客户差价补偿、班组再培训等"
                          disabled={!getRecallStats(recall).canComplete}
                          className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none transition-colors ${
                            getRecallStats(recall).canComplete
                              ? 'border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white'
                              : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        />
                      </div>
                      <button
                        onClick={() => handleCompleteRecall(recall.id)}
                        disabled={!getRecallStats(recall).canComplete}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors shadow-sm ${
                          getRecallStats(recall).canComplete
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        完成召回
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {recalls.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <div className="text-lg font-medium text-slate-600">暂无召回任务</div>
          <div className="text-sm text-slate-400 mt-2">所有产品质量正常</div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: 'red' | 'amber' | 'green' | 'blue';
  icon: React.ElementType;
}

function StatCard({ label, value, color, icon: Icon }: StatCardProps) {
  const colorClasses = {
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const iconBgClasses = {
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
  };

  return (
    <div className={`p-5 rounded-lg border ${colorClasses[color]} transition-all hover:shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium opacity-80">{label}</div>
          <div className="text-3xl font-bold mt-2">{value}</div>
        </div>
        <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
