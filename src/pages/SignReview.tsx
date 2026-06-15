import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  User,
  Camera,
  CheckCircle2,
  Wrench,
  Truck,
  ClipboardCheck,
  FileText,
  Clock,
  Calendar,
  Phone,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Timeline } from '@/components/ui/Timeline';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useUserStore } from '@/store/useUserStore';
import { SignatureSummaryCard } from '@/components/business/SignatureSummaryCard';
import { statusMap } from '@/utils/status';
import { formatDateTime, formatDate, formatMoney } from '@/utils/date';
import { cn } from '@/lib/utils';

export default function SignReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInspectionById, getEquipmentById, getContractById } = useInspectionStore();
  const { currentRole } = useUserStore();

  const inspection = getInspectionById(id || '');
  const equipment = inspection ? getEquipmentById(inspection.equipmentId) : undefined;
  const contract = inspection ? getContractById(inspection.contractId) : undefined;

  const guard = useMemo(() => {
    if (!inspection) return { blocked: false, reason: '', canGoSign: false, canGoReview: false };
    if (inspection.status !== 'completed' || !inspection.signature) {
      let reason = '';
      if (inspection.status === 'pending_sign') {
        reason = '该验机单尚待司机签收，签收完成后可查看回看';
      } else if (inspection.status === 'completed' && !inspection.signature) {
        reason = '该验机单缺少签收记录，无法查看回看';
      } else {
        reason = `该验机单当前状态为「${statusMap[inspection.status]?.label || inspection.status}」，签收回看仅对已完成的单据开放`;
      }
      const canGoSign = inspection.status === 'pending_sign' && currentRole === 'driver';
      const canGoReview = inspection.status === 'completed' && !!inspection.signature;
      return { blocked: true, reason, canGoSign, canGoReview };
    }
    return { blocked: false, reason: '', canGoSign: false, canGoReview: true };
  }, [inspection, currentRole]);

  const { blocked, reason: blockReason, canGoSign } = guard;

  if (!inspection) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">验机单不存在</p>
        <button
          onClick={() => navigate('/inspections')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          返回列表
        </button>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber-100 flex items-center justify-center">
          <ShieldAlert size={28} className="text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">无法查看签收回看</h3>
        <p className="text-sm text-slate-500 mb-6">{blockReason}</p>
        <div className="flex items-center justify-center gap-3">
          {canGoSign && (
            <Button
              variant="outline"
              onClick={() => navigate(`/inspections/${inspection.id}/sign`)}
              rightIcon={<ArrowRight size={14} />}
            >
              前往签收
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => navigate(`/inspections/${inspection.id}`)}
          >
            返回验机详情
          </Button>
        </div>
      </div>
    );
  }

  const signature = inspection.signature;
  const failCount = inspection.items.filter((i) => i.result === 'fail').length;
  const passCount = inspection.items.filter((i) => i.result === 'pass').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900">签收回看</h2>
              <span className="px-2.5 py-1 text-xs font-medium rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700">
                已完成
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {inspection.inspectionNo} · {equipment?.name} {equipment?.model}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/inspections/${inspection.id}`)}
          rightIcon={<ExternalLink size={14} />}
        >
          查看验机详情
        </Button>
      </div>

      <SignatureSummaryCard
        signature={signature}
        items={inspection.items}
        onViewDetail={() => navigate(`/inspections/${inspection.id}`)}
        className="mt-2"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck size={18} className="text-emerald-500" />
                签收信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {signature ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">司机姓名</p>
                      <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" />
                        {signature.driverName}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">签收时间</p>
                      <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" />
                        {formatDateTime(signature.signedAt)}
                      </p>
                    </div>
                  </div>

                  {signature.remark && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">签收备注</p>
                      <p className="text-sm text-slate-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                        {signature.remark}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-slate-500 mb-2">司机签名</p>
                    <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
                      <div className="w-full h-40 flex items-center justify-center">
                        {signature.signatureData && !signature.signatureData.startsWith('signature_placeholder') ? (
                          <img
                            src={signature.signatureData}
                            alt="司机签名"
                            className="h-full object-contain"
                          />
                        ) : (
                          <div className="text-center">
                            <div className="w-full h-32 bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-300 mb-2">
                              <span className="text-slate-800 text-2xl font-cursive italic">
                                {signature.driverName}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">电子签名</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {signature.photos && signature.photos.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">现场照片（{signature.photos.length}张）</p>
                      <div className="grid grid-cols-4 gap-3">
                        {signature.photos.map((photo, index) => (
                          <div
                            key={index}
                            className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex flex-col items-center justify-center border border-slate-200"
                          >
                            <Camera size={24} className="text-slate-400 mb-1" />
                            <span className="text-xs text-slate-400">照片 {index + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <ClipboardCheck size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无签收记录</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Wrench size={18} className="text-slate-500" />
                  验机结果摘要
                </span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    通过 {passCount} 项
                  </span>
                  {failCount > 0 && (
                    <span className="text-rose-600 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      异常 {failCount} 项
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['外观检查', '性能检查', '安全检查', '附件检查'].map((category) => {
                  const categoryItems = inspection.items.filter((i) => i.category === category);
                  const hasFail = categoryItems.some((i) => i.result === 'fail');
                  const failItems = categoryItems.filter((i) => i.result === 'fail');
                  return (
                    <div
                      key={category}
                      className={cn(
                        'p-3 rounded-lg border text-center',
                        hasFail
                          ? 'bg-rose-50 border-rose-200'
                          : 'bg-emerald-50 border-emerald-200'
                      )}
                    >
                      <p className="text-sm font-medium text-slate-700 mb-1">{category}</p>
                      <p
                        className={cn(
                          'text-xs',
                          hasFail ? 'text-rose-600' : 'text-emerald-600'
                        )}
                      >
                        {hasFail ? `${failItems.length} 项异常` : '全部正常'}
                      </p>
                      {hasFail && (
                        <div className="mt-2 pt-2 border-t border-rose-200">
                          {failItems.map((item) => (
                            <p key={item.id} className="text-xs text-rose-700 truncate">
                              {item.name}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck size={18} className="text-slate-500" />
                设备信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {equipment ? (
                <>
                  <div className="w-full h-28 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center mb-3">
                    <Wrench size={28} className="text-slate-400" />
                  </div>
                  <h4 className="font-medium text-slate-800">{equipment.name}</h4>
                  <p className="text-sm text-slate-500">{equipment.model}</p>
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">车牌号</p>
                      <p className="text-sm text-slate-700">{equipment.plateNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">工作时长</p>
                      <p className="text-sm text-slate-700">{equipment.workHours} 小时</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">设备信息未找到</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={18} className="text-slate-500" />
                合同信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contract ? (
                <>
                  <p className="font-medium text-slate-800 text-sm">{contract.contractNo}</p>
                  <p className="text-sm text-slate-600">{contract.lessee}</p>
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">租期</p>
                      <p className="text-sm text-slate-700">
                        {formatDate(contract.startDate)} 至 {formatDate(contract.endDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">合同金额</p>
                      <p className="text-sm text-slate-700">{formatMoney(contract.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">工地地址</p>
                      <p className="text-sm text-slate-700 flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        {inspection.siteAddress}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">联系人</p>
                      <p className="text-sm text-slate-700 flex items-center gap-1">
                        <Phone size={12} className="text-slate-400" />
                        {contract.lesseeContact}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">合同信息未找到</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={18} className="text-slate-500" />
                处理流程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline items={inspection.timeline} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={() => navigate('/inspections')}>
          返回列表
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>
          返回上一页
        </Button>
      </div>
    </div>
  );
}
