'use client';

import { useState } from 'react';
import { approvePartRequest } from '../actions';
import { PART_REQUEST_STATUS_LABELS, REPAIR_STATUS_LABELS, REPAIR_STATUS_COLORS, formatDateTime } from '@/lib/status';
import Link from 'next/link';
import { PartRequestStatus } from '@/lib/enums';

interface Props {
  pending: any[];
  approved: any[];
  allRequests: any[];
  lowStock: any[];
}

export default function PartsApprovalClient({ pending, approved, allRequests, lowStock }: Props) {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'history' | 'lowstock'>('pending');
  const [approvingRequest, setApprovingRequest] = useState<string | null>(null);
  const [deliveredItems, setDeliveredItems] = useState<{ itemId: string; qty: number }[]>([]);
  const [approvalNote, setApprovalNote] = useState('');

  const openApprove = (request: any) => {
    setApprovingRequest(request.id);
    setDeliveredItems(
      request.items.map((item: any) => ({
        itemId: item.id,
        qty: item.quantity,
      }))
    );
    setApprovalNote('');
  };

  const closeApprove = () => {
    setApprovingRequest(null);
    setDeliveredItems([]);
  };

  const handleApprove = async () => {
    const formData = new FormData();
    formData.append('requestId', approvingRequest!);
    formData.append('approvalNote', approvalNote);
    formData.append('deliveredItems', JSON.stringify(deliveredItems));
    await approvePartRequest(formData);
    closeApprove();
    window.location.reload();
  };

  const renderRequestCard = (request: any) => (
    <div key={request.id} className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className={`badge bg-orange-100 text-orange-700`}>
              {PART_REQUEST_STATUS_LABELS[request.status]}
            </span>
            <span className="text-sm text-gray-500 font-mono">申请号：{request.id.slice(-8)}</span>
          </div>
          <div className="mt-2">
            <div className="text-sm text-gray-500">关联工单：</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono font-medium text-gray-900">{request.repairOrder.orderNo}</span>
              <span className={`badge ${REPAIR_STATUS_COLORS[request.repairOrder.status]} text-xs`}>
                {REPAIR_STATUS_LABELS[request.repairOrder.status]}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {request.repairOrder.applianceBrand} {request.repairOrder.applianceType} · 客户：
              {request.repairOrder.customer.name}
            </div>
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="text-gray-500">申请人</div>
          <div className="font-medium text-gray-900">{request.requestedBy.name}</div>
          <div className="text-gray-400 text-xs mt-1">{formatDateTime(request.createdAt)}</div>
        </div>
      </div>

      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 text-gray-500 font-medium">配件名称</th>
            <th className="text-left py-2 text-gray-500 font-medium">编号</th>
            <th className="text-left py-2 text-gray-500 font-medium">库存</th>
            <th className="text-right py-2 text-gray-500 font-medium">申请数量</th>
            <th className="text-right py-2 text-gray-500 font-medium">已出库</th>
            <th className="text-right py-2 text-gray-500 font-medium">单价</th>
          </tr>
        </thead>
        <tbody>
          {request.items.map((item: any) => (
            <tr key={item.id} className="border-b border-gray-50">
              <td className="py-3 font-medium text-gray-900">{item.part.name}</td>
              <td className="py-3 text-gray-600 font-mono">{item.part.partNo}</td>
              <td className="py-3">
                <span className={item.part.stock < item.quantity ? 'text-red-600 font-medium' : 'text-gray-600'}>
                  {item.part.stock} {item.part.unit}
                </span>
              </td>
              <td className="py-3 text-right font-medium">{item.quantity}</td>
              <td className="py-3 text-right text-green-600">{item.deliveredQty}</td>
              <td className="py-3 text-right">¥{item.part.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {request.note && (
        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">申请备注：{request.note}</p>
      )}
      {request.approvalNote && request.approvedBy && (
        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg mt-2">
          {request.approvedBy.name} 审批：{request.approvalNote}
        </p>
      )}

      {request.status === PartRequestStatus.PENDING && (
        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={() => openApprove(request)}
            className="btn-success"
          >
            审批并出库
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {([
            ['pending', `待审批 (${pending.length})`],
            ['approved', `待发运 (${approved.length})`],
            ['history', '已处理记录'],
            ['lowstock', `库存预警 (${lowStock.length})`],
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

      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pending.length === 0 ? (
            <div className="card text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              暂无待审批申请
            </div>
          ) : (
            pending.map(renderRequestCard)
          )}
        </div>
      )}

      {activeTab === 'approved' && (
        <div className="space-y-4">
          {approved.length === 0 ? (
            <div className="card text-center py-16 text-gray-400">暂无已批准待发运的申请</div>
          ) : (
            approved.map(renderRequestCard)
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {allRequests.map(renderRequestCard)}
        </div>
      )}

      {activeTab === 'lowstock' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-red-50 border-b border-red-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-red-700 uppercase">配件编号</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-red-700 uppercase">名称</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-red-700 uppercase">分类</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-red-700 uppercase">当前库存</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-red-700 uppercase">单价</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-red-700 uppercase">状态</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    暂无库存预警
                  </td>
                </tr>
              ) : (
                lowStock.map((part) => (
                  <tr key={part.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm text-gray-900">{part.partNo}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{part.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{part.category}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${part.stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                        {part.stock} {part.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">¥{part.price}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${part.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {part.stock === 0 ? '缺货' : '库存不足'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <Link href="/dashboard/parts/inventory" className="text-blue-600 hover:underline text-sm">
              前往库存管理 →
            </Link>
          </div>
        </div>
      )}

      {approvingRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">配件审批出库</h3>

            <div className="space-y-3 mb-4">
              {pending.find((r) => r.id === approvingRequest)?.items.map((item: any) => {
                const dItem = deliveredItems.find((d) => d.itemId === item.id);
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{item.part.name}</div>
                      <div className="text-xs text-gray-500">
                        库存 {item.part.stock} {item.part.unit} · 申请 {item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDeliveredItems((prev) =>
                            prev.map((d) =>
                              d.itemId === item.id
                                ? { ...d, qty: Math.max(0, d.qty - 1) }
                                : d
                            )
                          )
                        }
                        className="w-7 h-7 rounded-full bg-white border border-gray-300 hover:bg-gray-100 text-sm"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-medium">{dItem?.qty || 0}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setDeliveredItems((prev) =>
                            prev.map((d) =>
                              d.itemId === item.id
                                ? { ...d, qty: Math.min(item.quantity, d.qty + 1) }
                                : d
                            )
                          )
                        }
                        className="w-7 h-7 rounded-full bg-white border border-gray-300 hover:bg-gray-100 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mb-4">
              <label className="label">审批备注</label>
              <textarea
                className="input min-h-[80px]"
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="填写审批意见、发运方式、预计到货时间等"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={closeApprove} className="btn-secondary">
                取消
              </button>
              <button onClick={handleApprove} className="btn-success">
                确认出库
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
