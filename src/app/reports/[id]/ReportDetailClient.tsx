'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReportStatus, Role, LogAction } from '@/lib/types';
import {
  statusLabels,
  statusColors,
  formatCurrency,
  formatDate,
  formatDateTime,
  isAbnormal,
  materialTypeLabels,
} from '@/lib/utils';

interface Material {
  id: number;
  name: string;
  type: string;
  received: boolean;
  receivedAt: string | null;
  remark: string | null;
}

interface ActivityLog {
  id: number;
  action: LogAction;
  operatorName: string;
  remark: string | null;
  oldStatus: ReportStatus | null;
  newStatus: ReportStatus | null;
  createdAt: string;
}

interface ReportDetail {
  id: number;
  reportNo: string;
  reportMonth: string;
  salesAmount: string | number;
  rentDeduction: string | number;
  netSettlement: string | number;
  status: ReportStatus;
  remark: string | null;
  missingMaterials: string | null;
  rejectReason: string | null;
  isOverdue: boolean;
  deadline: string | null;
  settlementAmount: string | number | null;
  settlementDate: string | null;
  paymentMethod: string | null;
  submittedAt: string | null;
  materialsCheckedAt: string | null;
  reviewedAt: string | null;
  settledAt: string | null;
  brand: {
    id: number;
    name: string;
    storeName: string;
  };
  submitter: { id: number; name: string; role: Role } | null;
  materialsChecker: { id: number; name: string; role: Role } | null;
  reviewer: { id: number; name: string; role: Role } | null;
  settler: { id: number; name: string; role: Role } | null;
  materials: Material[];
  activityLogs: ActivityLog[];
}

interface CurrentUser {
  id: number;
  name: string;
  role: Role;
  brandId?: number | null;
}

const logActionLabels: Record<LogAction, string> = {
  SUBMIT: '提交销售上报',
  RECEIVE_MATERIALS: '材料收齐',
  MARK_MISSING: '标记材料缺失',
  SUPPLEMENT: '补充材料并重新提交',
  REVIEW_PASS: '复核通过',
  REVIEW_REJECT: '复核不通过',
  SETTLE: '完成费用结算',
  MARK_OVERDUE: '标记超时',
  COMMENT: '添加备注',
};

export default function ReportDetailClient({
  id,
  currentUser,
}: {
  id: number;
  currentUser: CurrentUser;
}) {
  const router = useRouter();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSettleDialog, setShowSettleDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showMissingDialog, setShowMissingDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [missingText, setMissingText] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('银行转账');
  const [settleRemark, setSettleRemark] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${id}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        if (data.netSettlement) {
          setSettleAmount(String(data.netSettlement));
        }
        if (data.missingMaterials) {
          setMissingText(data.missingMaterials);
        }
        if (data.rejectReason) {
          setRejectReason(data.rejectReason);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleAction = async (action: string, extra?: any) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reports/${id}/transition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) {
        await fetchDetail();
        setShowSettleDialog(false);
        setShowRejectDialog(false);
        setShowMissingDialog(false);
      } else {
        const err = await res.json();
        alert(err.error || '操作失败');
      }
    } catch (e) {
      alert('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const isOwnBrand =
    currentUser.role !== Role.BRAND_MANAGER ||
    (currentUser.brandId && report?.brand?.id === currentUser.brandId);

  const canReceiveMaterials =
    currentUser.role === Role.OPERATION_SUPERVISOR &&
    report?.status === ReportStatus.SUBMITTED;

  const canMarkMissing =
    currentUser.role === Role.OPERATION_SUPERVISOR &&
    report?.status === ReportStatus.SUBMITTED;

  const canReviewPass =
    currentUser.role === Role.LEASING_MANAGER &&
    report?.status === ReportStatus.MATERIALS_COMPLETE;

  const canReviewReject =
    currentUser.role === Role.LEASING_MANAGER &&
    report?.status === ReportStatus.MATERIALS_COMPLETE;

  const canSettle =
    currentUser.role === Role.LEASING_MANAGER &&
    report?.status === ReportStatus.REVIEW_PASSED;

  const canSupplement =
    isOwnBrand &&
    currentUser.role === Role.BRAND_MANAGER &&
    (report?.status === ReportStatus.MATERIALS_MISSING ||
      report?.status === ReportStatus.REVIEW_REJECTED ||
      report?.status === ReportStatus.OVERDUE);

  const isSettled = report?.status === ReportStatus.SETTLED;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-slate-400">
        加载中...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-500">单据不存在</p>
        <Link href="/reports" className="text-brand-600 hover:underline mt-4 inline-block">
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/reports"
          className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center"
        >
          ← 返回列表
        </Link>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-slate-900">{report.reportNo}</h1>
              <span
                className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusColors[report.status]}`}
              >
                {isAbnormal(report.status) && (
                  <span className="w-2 h-2 rounded-full bg-current mr-2 mt-0.5"></span>
                )}
                {statusLabels[report.status]}
              </span>
            </div>
            <p className="text-slate-500 mt-1">
              {report.brand.name} · {report.brand.storeName} · {report.reportMonth}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canReceiveMaterials && (
              <button
                onClick={() => handleAction('receive_materials')}
                disabled={submitting}
                className="btn-primary"
              >
                确认材料收齐
              </button>
            )}
            {canMarkMissing && (
              <button
                onClick={() => setShowMissingDialog(true)}
                disabled={submitting}
                className="btn-secondary text-amber-600 border-amber-300 hover:bg-amber-50"
              >
                材料缺失
              </button>
            )}
            {canReviewPass && (
              <button
                onClick={() => handleAction('review_pass')}
                disabled={submitting}
                className="btn-primary"
              >
                复核通过
              </button>
            )}
            {canReviewReject && (
              <button
                onClick={() => setShowRejectDialog(true)}
                disabled={submitting}
                className="btn-danger"
              >
                复核不通过
              </button>
            )}
            {canSettle && (
              <button
                onClick={() => setShowSettleDialog(true)}
                disabled={submitting}
                className="btn-primary"
              >
                费用结算
              </button>
            )}
            {canSupplement && (
              <button
                onClick={() => handleAction('supplement_submit')}
                disabled={submitting}
                className="btn-primary"
              >
                补充后重新提交
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">销售数据</h2>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-500">销售总额</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(report.salesAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">租金扣点</p>
                <p className="text-2xl font-bold text-slate-600 mt-1">
                  {formatCurrency(report.rentDeduction)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">净结算金额</p>
                <p className="text-2xl font-bold text-brand-600 mt-1">
                  {formatCurrency(report.netSettlement)}
                </p>
              </div>
            </div>
            {report.remark && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">备注</p>
                <p className="text-slate-700 mt-1">{report.remark}</p>
              </div>
            )}
          </div>

          {isSettled && (
            <div className="card p-6 border-emerald-200 bg-emerald-50/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                  费用结算信息
                </h2>
                <span className="text-sm text-emerald-600 font-medium">已完成</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">结算金额</p>
                  <p className="font-semibold text-slate-900 mt-1">
                    {formatCurrency(report.settlementAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">结算日期</p>
                  <p className="font-semibold text-slate-900 mt-1">
                    {formatDate(report.settlementDate)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">支付方式</p>
                  <p className="font-semibold text-slate-900 mt-1">
                    {report.paymentMethod || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">结算人</p>
                  <p className="font-semibold text-slate-900 mt-1">
                    {report.settler?.name || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">上报材料</h2>
              <span className="text-sm text-slate-500">
                {report.materials.filter((m) => m.received).length} / {report.materials.length} 项已收齐
              </span>
            </div>
            <div className="space-y-3">
              {report.materials.map((material) => (
                <div
                  key={material.id}
                  className={`p-3 rounded-lg border ${
                    material.received
                      ? 'bg-green-50 border-green-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          material.received
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-300 text-white'
                        }`}
                      >
                        {material.received ? '✓' : ''}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{material.name}</p>
                        <p className="text-xs text-slate-500">
                          {materialTypeLabels[material.type] || material.type}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">
                      {material.received
                        ? formatDate(material.receivedAt)
                        : '未提交'}
                    </span>
                  </div>
                  {material.remark && (
                    <p className="text-sm text-slate-500 mt-2 pl-8">
                      备注：{material.remark}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {report.missingMaterials && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-800">缺失说明</p>
                <p className="text-sm text-amber-700 mt-1">{report.missingMaterials}</p>
              </div>
            )}
          </div>

          {(report.status === ReportStatus.REVIEW_REJECTED || report.rejectReason) && (
            <div className="card p-6 border-red-200 bg-red-50/30">
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                复核不通过原因
              </h2>
              <p className="text-red-700">{report.rejectReason}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">流转时间线</h2>
            <div className="space-y-4">
              {report.activityLogs.map((log, idx) => (
                <div key={log.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        idx === 0 ? 'bg-brand-500' : 'bg-slate-300'
                      }`}
                    ></div>
                    {idx < report.activityLogs.length - 1 && (
                      <div className="w-px h-full bg-slate-200 mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900 text-sm">
                        {logActionLabels[log.action] || log.action}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {log.operatorName} · {formatDateTime(log.createdAt)}
                    </p>
                    {log.remark && (
                      <p className="text-sm text-slate-600 mt-1">{log.remark}</p>
                    )}
                    {log.newStatus && (
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${statusColors[log.newStatus]}`}
                      >
                        → {statusLabels[log.newStatus]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">相关人员</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">品牌店长</span>
                <span className="font-medium text-slate-700">
                  {report.submitter?.name || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">营运督导</span>
                <span className="font-medium text-slate-700">
                  {report.materialsChecker?.name || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">招商经理</span>
                <span className="font-medium text-slate-700">
                  {report.reviewer?.name || report.settler?.name || '-'}
                </span>
              </div>
              {report.deadline && (
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500">截止日期</span>
                  <span
                    className={`font-medium ${
                      report.isOverdue ? 'text-red-600' : 'text-slate-700'
                    }`}
                  >
                    {formatDate(report.deadline)}
                    {report.isOverdue && '（已超时）'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showMissingDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              标记材料缺失
            </h3>
            <div>
              <label className="label">缺失材料说明</label>
              <textarea
                value={missingText}
                onChange={(e) => setMissingText(e.target.value)}
                className="input min-h-[100px]"
                placeholder="请说明缺失哪些材料及补充要求..."
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowMissingDialog(false)}
                className="btn-secondary"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={() =>
                  handleAction('mark_missing', { missingMaterials: missingText })
                }
                className="btn-danger"
                disabled={submitting || !missingText.trim()}
              >
                确认标记
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              复核不通过
            </h3>
            <div>
              <label className="label">驳回原因</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="input min-h-[100px]"
                placeholder="请详细说明不通过的原因..."
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="btn-secondary"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={() =>
                  handleAction('review_reject', { rejectReason })
                }
                className="btn-danger"
                disabled={submitting || !rejectReason.trim()}
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettleDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              费用结算
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">结算金额</label>
                <input
                  type="number"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="input"
                  placeholder="请输入结算金额"
                />
                <p className="text-xs text-slate-500 mt-1">
                  净结算金额参考：{formatCurrency(report.netSettlement)}
                </p>
              </div>
              <div>
                <label className="label">支付方式</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input"
                >
                  <option value="银行转账">银行转账</option>
                  <option value="支票">支票</option>
                  <option value="现金">现金</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="label">备注</label>
                <textarea
                  value={settleRemark}
                  onChange={(e) => setSettleRemark(e.target.value)}
                  className="input min-h-[60px]"
                  placeholder="结算备注（可选）"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSettleDialog(false)}
                className="btn-secondary"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={() =>
                  handleAction('settle', {
                    settlementAmount: parseFloat(settleAmount),
                    paymentMethod,
                    remark: settleRemark,
                  })
                }
                className="btn-primary"
                disabled={submitting || !settleAmount}
              >
                确认结算
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
