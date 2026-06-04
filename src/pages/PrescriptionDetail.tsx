import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  FileText,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileCheck,
  Flame,
  Stethoscope,
  RotateCcw,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../utils/api';
import { StatusBadge } from '../components/StatusBadge';
import { StatusTimeline } from '../components/StatusTimeline';
import { OperationLogPanel } from '../components/OperationLogPanel';
import { ReviewDrawer } from '../components/ReviewDrawer';
import { DecoctDrawer } from '../components/DecoctDrawer';
import { DeliveryDrawer } from '../components/DeliveryDrawer';
import { SignReviewDrawer } from '../components/SignReviewDrawer';
import type { PrescriptionDetail as PrescriptionDetailType } from '../../shared/types';
import { ROLE_LABELS, ROLE_TODO_STATUSES } from '../../shared/types';
import { formatDateTime } from '../utils/format';
import { cn } from '../lib/utils';

export default function PrescriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentRole, operatorName } = useAppStore();
  const [prescription, setPrescription] = useState<PrescriptionDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [decoctDrawerOpen, setDecoctDrawerOpen] = useState(false);
  const [deliveryDrawerOpen, setDeliveryDrawerOpen] = useState(false);
  const [signDrawerOpen, setSignDrawerOpen] = useState(false);

  useEffect(() => {
    if (!currentRole) {
      navigate('/');
      return;
    }
    loadDetail();
  }, [id, currentRole, navigate]);

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const detail = await api.getPrescriptionDetail(id);
      setPrescription(detail);
    } catch (error) {
      console.error('Failed to load detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionSuccess = () => {
    loadDetail();
  };

  const canPerformAction = (actionStatus: string) => {
    if (!currentRole || !prescription) return false;
    const todoStatuses = ROLE_TODO_STATUSES[currentRole];
    return todoStatuses.includes(prescription.currentStatus as any) && prescription.currentStatus === actionStatus;
  };

  if (!currentRole) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回待办</span>
              </button>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <h1 className="text-lg font-semibold text-slate-900">处方详情</h1>
                <p className="text-sm text-slate-500">
                  {ROLE_LABELS[currentRole]} · {operatorName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700">{operatorName}</span>
              </div>
              <button
                onClick={loadDetail}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="刷新"
              >
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-2 text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>加载中...</span>
            </div>
          </div>
        ) : !prescription ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <FileText className="w-12 h-12 mb-3" />
            <p className="text-sm">处方不存在</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-xl font-semibold text-slate-900">
                        {prescription.prescriptionNo}
                      </span>
                      <StatusBadge status={prescription.currentStatus} />
                    </div>
                    <p className="text-sm text-slate-500">
                      创建于 {formatDateTime(prescription.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {canPerformAction('PENDING_REVIEW') && (
                      <button
                        onClick={() => setReviewDrawerOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium text-sm"
                      >
                        <FileCheck className="w-4 h-4" />
                        审核通过
                      </button>
                    )}
                    {canPerformAction('PENDING_DECOCTION') && (
                      <button
                        onClick={() => setDecoctDrawerOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
                      >
                        <Flame className="w-4 h-4" />
                        煎药完成
                      </button>
                    )}
                    {canPerformAction('PENDING_DELIVERY') && (
                      <button
                        onClick={() => setDeliveryDrawerOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm"
                      >
                        <Truck className="w-4 h-4" />
                        配送出库
                      </button>
                    )}
                    {canPerformAction('OUT_FOR_DELIVERY') && (
                      <button
                        onClick={() => setSignDrawerOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        签收回查
                      </button>
                    )}
                    {canPerformAction('RETURNED') && (
                      <button
                        onClick={() => setDeliveryDrawerOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
                      >
                        <RotateCcw className="w-4 h-4" />
                        重新配送
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      患者信息
                    </h3>
                    <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">姓名</span>
                        <span className="font-medium text-slate-900">{prescription.patientName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">性别</span>
                        <span className="font-medium text-slate-900">{prescription.patientGender}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">年龄</span>
                        <span className="font-medium text-slate-900">{prescription.patientAge} 岁</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">诊断</span>
                        <span className="font-medium text-slate-900">{prescription.diagnosis}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" />
                      处方信息
                    </h3>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-500 mb-2">处方内容</div>
                      <p className="text-sm text-slate-900 mb-4 leading-relaxed">
                        {prescription.prescriptionContent}
                      </p>
                      <div className="text-sm text-slate-500 mb-2">用法用量</div>
                      <p className="text-sm text-slate-900">{prescription.dosage}</p>
                    </div>
                  </div>
                </div>

                {prescription.deliveryInfo && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      配送与签收全链路记录
                    </h3>
                    <div className="space-y-0 border border-slate-200 rounded-lg overflow-hidden">
                      <div className="p-4 bg-teal-50 border-b border-teal-100">
                        <div className="flex items-center gap-2 mb-3">
                          <Truck className="w-4 h-4 text-teal-600" />
                          <span className="text-sm font-semibold text-teal-800">配送出库</span>
                          <span className="text-xs text-teal-600 ml-auto">
                            {formatDateTime(prescription.deliveryInfo.createdAt)}
                          </span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-slate-500">快递公司：</span>
                            <span className="font-medium text-slate-900">
                              {prescription.deliveryInfo.courierCompany}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">快递单号：</span>
                            <span className="font-medium text-slate-900 font-mono">
                              {prescription.deliveryInfo.trackingNo}
                            </span>
                          </div>
                        </div>
                        {prescription.deliveryInfo.deliveryRemark && (
                          <div className="mt-3 flex items-start gap-2 p-3 bg-white rounded-lg border border-teal-200">
                            <MessageSquare className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                            <div>
                              <div className="text-xs text-slate-500 mb-1">配送出库备注</div>
                              <div className="text-sm text-slate-800">{prescription.deliveryInfo.deliveryRemark}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {prescription.deliveryInfo.signedAt && (
                        <div className={cn(
                          'p-4 border-b border-slate-100',
                          prescription.deliveryInfo.signResult === 'NORMAL'
                            ? 'bg-green-50'
                            : 'bg-red-50'
                        )}>
                          <div className="flex items-center gap-2 mb-3">
                            {prescription.deliveryInfo.signResult === 'NORMAL' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className={cn(
                              'text-sm font-semibold',
                              prescription.deliveryInfo.signResult === 'NORMAL'
                                ? 'text-green-800'
                                : 'text-red-800'
                            )}>
                              签收回查 — {prescription.deliveryInfo.signResult === 'NORMAL' ? '正常签收' : '退回'}
                            </span>
                            <span className="text-xs text-slate-500 ml-auto">
                              {formatDateTime(prescription.deliveryInfo.signedAt)}
                            </span>
                          </div>

                          {prescription.deliveryInfo.signResult === 'RETURNED' && (
                            <div className="mb-3 p-3 bg-white rounded-lg border border-red-200">
                              <div className="grid md:grid-cols-2 gap-3 text-sm mb-2">
                                {prescription.deliveryInfo.returnType && (
                                  <div>
                                    <span className="text-slate-500">退回类型：</span>
                                    <span className="font-medium text-red-800">
                                      {prescription.deliveryInfo.returnType}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {prescription.deliveryInfo.returnReason && (
                                <div className="text-sm">
                                  <span className="text-slate-500">退回原因：</span>
                                  <span className="font-medium text-red-800">
                                    {prescription.deliveryInfo.returnReason}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {prescription.deliveryInfo.supplementaryRemark && (
                            <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-slate-200">
                              <MessageSquare className={cn(
                                'w-4 h-4 mt-0.5 shrink-0',
                                prescription.deliveryInfo.signResult === 'NORMAL'
                                  ? 'text-green-500'
                                  : 'text-red-500'
                              )} />
                              <div>
                                <div className="text-xs text-slate-500 mb-1">补充备注</div>
                                <div className="text-sm text-slate-800">{prescription.deliveryInfo.supplementaryRemark}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {!prescription.deliveryInfo.signedAt && (
                        <div className="p-4 bg-amber-50 border-b border-amber-100">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span className="text-sm text-amber-700">等待签收回查</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  状态流转时间线
                </h3>
                <StatusTimeline logs={prescription.statusLogs} />
              </div>
            </div>

            <div className="space-y-6">
              <OperationLogPanel logs={prescription.operationLogs} />
            </div>
          </div>
        )}
      </main>

      {prescription && (
        <>
          <ReviewDrawer
            isOpen={reviewDrawerOpen}
            onClose={() => setReviewDrawerOpen(false)}
            prescription={prescription}
            onSuccess={handleActionSuccess}
          />
          <DecoctDrawer
            isOpen={decoctDrawerOpen}
            onClose={() => setDecoctDrawerOpen(false)}
            prescription={prescription}
            onSuccess={handleActionSuccess}
          />
          <DeliveryDrawer
            isOpen={deliveryDrawerOpen}
            onClose={() => setDeliveryDrawerOpen(false)}
            prescription={prescription}
            onSuccess={handleActionSuccess}
          />
          <SignReviewDrawer
            isOpen={signDrawerOpen}
            onClose={() => setSignDrawerOpen(false)}
            prescription={prescription}
            onSuccess={handleActionSuccess}
          />
        </>
      )}
    </div>
  );
}
