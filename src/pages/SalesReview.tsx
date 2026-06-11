import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  User,
  TrendingUp,
  ShoppingCart,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Target
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessStepper } from '@/components/promotion/ProcessStepper';
import { StatusBadge } from '@/components/common/StatusBadge';
import { RoleBadge } from '@/components/common/RoleBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate, formatDateTime, formatCurrency, formatRelativeTime } from '@/utils/format';
import { Promotion } from '@/types';

export function SalesReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isList = !id;

  const { promotions, addRecentItem, currentRole } = useAppStore();
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);

  const reviewablePromotions = promotions.filter(p => 
    p.status === 'active' || p.status === 'salesPending' || p.status === 'completed'
  );

  useEffect(() => {
    if (id) {
      const promotion = promotions.find(p => p.id === id);
      setSelectedPromotion(promotion || null);
      if (promotion) {
        addRecentItem(promotion.id, promotion.title);
      }
    } else {
      setSelectedPromotion(null);
    }
  }, [id, promotions, addRecentItem]);

  if (isList) {
    const pendingSales = reviewablePromotions.filter(p => 
      p.status === 'salesPending' || (p.status === 'active' && !p.salesData)
    );
    const completedSales = reviewablePromotions.filter(p => p.status === 'completed');
    const inProgressSales = reviewablePromotions.filter(p => p.status === 'active' && p.salesData);

    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-100 rounded-md transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-serif text-2xl font-bold text-navy-500">销售核对</h1>
              <p className="text-sm text-slate-500 mt-1">
                促销活动完成后的延续环节 · 所有备注和处理记录已自动带入
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge bg-amber-100 text-amber-700 border-0">
              {pendingSales.length} 待处理
            </span>
            <span className="badge bg-navy-100 text-navy-700 border-0">
              {completedSales.length} 已完成
            </span>
          </div>
        </div>

        {pendingSales.length > 0 && (
          <div className="card p-6 border-amber-200 bg-gradient-to-br from-amber-50/30 to-white">
            <h2 className="font-serif text-lg font-semibold text-navy-500 flex items-center gap-2 mb-5">
              <AlertCircle size={18} className="text-amber-500" />
              待核对的促销活动
              <span className="text-sm font-normal text-slate-400 ml-1">
                · 需要录入销售数据或确认完成
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingSales.map((promotion, index) => (
                <div 
                  key={promotion.id}
                  className="p-5 bg-white border border-amber-100 rounded-lg hover:shadow-md hover:border-amber-300 cursor-pointer animate-slide-up transition-all"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/sales/${promotion.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-navy-500 truncate">{promotion.title}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {promotion.brand} · {promotion.counter}
                      </p>
                    </div>
                    <StatusBadge status={promotion.status} />
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                    </span>
                  </div>

                  {promotion.salesData ? (
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500">销售数据已录入，待最终确认</span>
                        <span className={`text-sm font-semibold ${
                          promotion.salesData.actualSales >= promotion.salesData.targetSales 
                            ? 'text-emerald-600' 
                            : 'text-amber-600'
                        }`}>
                          {((promotion.salesData.actualSales / promotion.salesData.targetSales) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 rounded-lg p-3 flex items-center justify-center gap-2">
                      <AlertCircle size={16} className="text-amber-500" />
                      <span className="text-xs text-amber-600 font-medium">待录入销售数据</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">
                      更新于 {formatRelativeTime(promotion.updatedAt)}
                    </span>
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      去处理
                      <ArrowLeft size={12} className="rotate-180" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {inProgressSales.length > 0 && (
          <div className="card p-6">
            <h2 className="font-serif text-lg font-semibold text-navy-500 flex items-center gap-2 mb-5">
              <TrendingUp size={18} className="text-emerald-500" />
              活动进行中（已录入销售数据）
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inProgressSales.map((promotion, index) => (
                <div 
                  key={promotion.id}
                  className="card p-5 hover:shadow-card-hover cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/sales/${promotion.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-navy-500 truncate">{promotion.title}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {promotion.brand} · {promotion.counter}
                      </p>
                    </div>
                    <StatusBadge status={promotion.status} />
                  </div>
                  
                  {promotion.salesData && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500">销售达成</span>
                        <span className={`text-sm font-semibold ${
                          promotion.salesData.actualSales >= promotion.salesData.targetSales 
                            ? 'text-emerald-600' 
                            : 'text-amber-600'
                        }`}>
                          {((promotion.salesData.actualSales / promotion.salesData.targetSales) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            promotion.salesData.actualSales >= promotion.salesData.targetSales 
                              ? 'bg-emerald-500' 
                              : 'bg-amber-500'
                          }`}
                          style={{ 
                            width: `${Math.min((promotion.salesData.actualSales / promotion.salesData.targetSales) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {completedSales.length > 0 && (
          <div className="card p-6">
            <h2 className="font-serif text-lg font-semibold text-navy-500 flex items-center gap-2 mb-5">
              <CheckCircle size={18} className="text-navy-500" />
              已完成归档
              <span className="text-sm font-normal text-slate-400 ml-1">
                · 含完整促销 + 销售核对链路
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedSales.map((promotion, index) => (
                <div 
                  key={promotion.id}
                  className="card p-5 hover:shadow-card-hover cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/sales/${promotion.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-navy-500 truncate">{promotion.title}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {promotion.brand} · {promotion.counter}
                      </p>
                    </div>
                    <StatusBadge status={promotion.status} />
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                    </span>
                  </div>

                  {promotion.salesData && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500">销售达成</span>
                        <span className={`text-sm font-semibold ${
                          promotion.salesData.actualSales >= promotion.salesData.targetSales 
                            ? 'text-emerald-600' 
                            : 'text-amber-600'
                        }`}>
                          {((promotion.salesData.actualSales / promotion.salesData.targetSales) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            promotion.salesData.actualSales >= promotion.salesData.targetSales 
                              ? 'bg-emerald-500' 
                              : 'bg-amber-500'
                          }`}
                          style={{ 
                            width: `${Math.min((promotion.salesData.actualSales / promotion.salesData.targetSales) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-400">
                          实际 {formatCurrency(promotion.salesData.actualSales)}
                        </span>
                        <span className="text-xs text-slate-400">
                          目标 {formatCurrency(promotion.salesData.targetSales)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">
                      更新于 {formatRelativeTime(promotion.updatedAt)}
                    </span>
                    <span className="text-xs text-navy-500 font-medium flex items-center gap-1">
                      查看归档
                      <ArrowLeft size={12} className="rotate-180" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reviewablePromotions.length === 0 && (
          <EmptyState
            title="暂无销售核对记录"
            description="当促销活动进入执行或完成阶段后，会在这里显示销售核对记录。所有备注和处理记录将自动带入。"
          />
        )}
      </div>
    );
  }

  if (!selectedPromotion) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          title="促销单不存在"
          description="您访问的促销单可能已被删除或不存在。"
        />
      </div>
    );
  }

  const promotion = selectedPromotion;
  const salesData = promotion.salesData;
  const achievementRate = salesData 
    ? (salesData.actualSales / salesData.targetSales) * 100 
    : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/sales')}
          className="p-2 hover:bg-slate-100 rounded-md transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-bold text-navy-500">
            销售核对 - {promotion.title}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={promotion.status} />
            <RoleBadge role={promotion.currentRole} />
            <span className="text-sm text-slate-400">
              更新于 {formatRelativeTime(promotion.updatedAt)}
            </span>
          </div>
        </div>
        <Link 
          to={`/promotion/${promotion.id}`}
          className="btn btn-secondary gap-2"
        >
          <FileText size={18} />
          返回促销活动
        </Link>
      </div>

      <ProcessStepper promotion={promotion} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="font-serif text-lg font-semibold text-navy-500 mb-5 flex items-center gap-2">
              <FileText size={20} className="text-amber-500" />
              活动基本信息
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">专柜</p>
                <p className="text-sm font-medium text-slate-700">{promotion.counter}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">品牌</p>
                <p className="text-sm font-medium text-slate-700">{promotion.brand}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">活动类型</p>
                <p className="text-sm font-medium text-slate-700">{promotion.type}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">活动周期</p>
                <p className="text-sm font-medium text-slate-700">
                  {formatDate(promotion.startDate)} ~ {formatDate(promotion.endDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">预算金额</p>
                <p className="text-sm font-medium text-slate-700">{formatCurrency(promotion.budget)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">创建人</p>
                <p className="text-sm font-medium text-slate-700">
                  {promotion.steps[0]?.operator || '-'}
                </p>
              </div>
            </div>
            
            {promotion.description && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-2">活动描述</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{promotion.description}</p>
              </div>
            )}
          </div>

          {salesData && (
            <div className="card p-6">
              <h2 className="font-serif text-lg font-semibold text-navy-500 mb-5 flex items-center gap-2">
                <ShoppingCart size={20} className="text-purple-500" />
                销售数据
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <Target size={20} className="text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 mb-1">目标销售</p>
                  <p className="text-lg font-bold text-slate-700">
                    {formatCurrency(salesData.targetSales)}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <TrendingUp size={20} className="text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 mb-1">实际销售</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {formatCurrency(salesData.actualSales)}
                  </p>
                </div>
                <div className={`rounded-lg p-4 text-center ${
                  achievementRate >= 100 ? 'bg-emerald-50' : 'bg-amber-50'
                }`}>
                  <CheckCircle size={20} className={`mx-auto mb-2 ${
                    achievementRate >= 100 ? 'text-emerald-500' : 'text-amber-500'
                  }`} />
                  <p className="text-xs text-slate-400 mb-1">达成率</p>
                  <p className={`text-lg font-bold ${
                    achievementRate >= 100 ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {achievementRate.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <User size={20} className="text-blue-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 mb-1">客单数</p>
                  <p className="text-lg font-bold text-blue-600">
                    {salesData.customerCount} 单
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-600">销售达成进度</span>
                  <span className={`text-sm font-bold ${
                    achievementRate >= 100 ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {achievementRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4 mb-3">
                  <div 
                    className={`h-4 rounded-full transition-all duration-700 ${
                      achievementRate >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(achievementRate, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>0</span>
                  <span>目标 {formatCurrency(salesData.targetSales)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-5">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">客单价</p>
                  <p className="text-lg font-bold text-slate-700">
                    {formatCurrency(Math.round(salesData.actualSales / salesData.customerCount))}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">超出/差额</p>
                  <p className={`text-lg font-bold ${
                    salesData.actualSales >= salesData.targetSales 
                      ? 'text-emerald-600' 
                      : 'text-red-600'
                  }`}>
                    {salesData.actualSales >= salesData.targetSales ? '+' : ''}
                    {formatCurrency(salesData.actualSales - salesData.targetSales)}
                  </p>
                </div>
              </div>

              {salesData.comment && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-2">销售备注</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {salesData.comment}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    — {salesData.operator} · {formatDateTime(salesData.createdAt)}
                  </p>
                </div>
              )}
            </div>
          )}

          {promotion.remarks.length > 0 && (
            <div className="card p-6 border-blue-100 bg-gradient-to-br from-blue-50/30 to-white">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-navy-500 flex items-center gap-2">
                    <MessageSquare size={20} className="text-blue-500" />
                    历史备注记录
                    <span className="text-sm font-normal text-slate-400 ml-2">
                      ({promotion.remarks.length} 条)
                    </span>
                  </h2>
                  <p className="text-xs text-blue-600 mt-1 ml-7">
                    💡 这些是从促销活动各环节延续过来的备注，供销售核对参考
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                {promotion.remarks.map((remark, index) => (
                  <div 
                    key={remark.id} 
                    className="flex gap-4 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      remark.role === 'counterManager' ? 'bg-amber-100' :
                      remark.role === 'floorSupervisor' ? 'bg-blue-100' : 'bg-emerald-100'
                    }`}>
                      <User size={18} className={`${
                        remark.role === 'counterManager' ? 'text-amber-600' :
                        remark.role === 'floorSupervisor' ? 'text-blue-600' : 'text-emerald-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <RoleBadge role={remark.role} />
                        <span className="text-sm font-medium text-slate-700">
                          {remark.operator}
                        </span>
                        <span className="text-xs text-slate-400">
                          · {formatDateTime(remark.createdAt)}
                        </span>
                        {remark.stepId && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                            来自处理环节
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap break-words bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
                        {remark.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="font-serif text-lg font-semibold text-navy-500 mb-5 flex items-center gap-2">
              <Clock size={20} className="text-purple-500" />
              完整处理链路
            </h2>
            
            <div className="relative pl-4">
              <div className="timeline-line" />
              <div className="space-y-6">
                {promotion.steps.map((step, index) => (
                  <div key={step.id} className="relative">
                    <div className={`timeline-dot top-1.5 ${
                      step.action === 'create' ? 'bg-slate-400' :
                      step.action === 'submit' ? 'bg-amber-500' :
                      step.action === 'approve' ? 'bg-emerald-500' :
                      step.action === 'reject' ? 'bg-red-500' : 'bg-purple-500'
                    }`} />
                    <div className="ml-10">
                      <div className="flex items-center gap-2 mb-1">
                        <RoleBadge role={step.role} />
                        <span className="text-sm font-medium text-slate-700">
                          {step.operator}
                        </span>
                        <span className="text-xs text-slate-400">
                          · {formatDateTime(step.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          step.action === 'create' ? 'bg-slate-100 text-slate-600' :
                          step.action === 'submit' ? 'bg-amber-100 text-amber-600' :
                          step.action === 'approve' ? 'bg-emerald-100 text-emerald-600' :
                          step.action === 'reject' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'
                        }`}>
                          {step.action === 'create' ? '创建' :
                           step.action === 'submit' ? '提交' :
                           step.action === 'approve' ? '通过' :
                           step.action === 'reject' ? '驳回' : '完成'}
                        </span>
                        {step.comment && (
                          <span className="ml-2 text-slate-500">{step.comment}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {!salesData && (
            <div className="card p-5 bg-amber-50 border-amber-200">
              <h3 className="font-serif text-base font-semibold text-amber-700 mb-2 flex items-center gap-2">
                <AlertCircle size={18} />
                待录入销售数据
              </h3>
              <p className="text-sm text-amber-600 mb-4">
                当前销售数据尚未录入。请切换到品牌督导角色，在促销活动页面录入销售数据。
              </p>
              <Link 
                to={`/promotion/${promotion.id}`}
                className="btn btn-amber w-full text-sm gap-2"
              >
                去录入销售数据
              </Link>
            </div>
          )}

          {salesData && promotion.status === 'salesPending' && currentRole === 'brandSupervisor' && (
            <div className="card p-5 bg-blue-50 border-blue-200">
              <h3 className="font-serif text-base font-semibold text-blue-700 mb-2">
                待完成销售核对
              </h3>
              <p className="text-sm text-blue-600 mb-4">
                请确认销售数据无误后，完成最终的销售核对。
              </p>
              <Link 
                to={`/promotion/${promotion.id}`}
                className="btn btn-primary w-full text-sm gap-2"
              >
                去完成核对
              </Link>
            </div>
          )}

          {promotion.status === 'completed' && (
            <div className="card p-5 bg-emerald-50 border-emerald-200">
              <h3 className="font-serif text-base font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                <CheckCircle size={18} />
                流程已完成
              </h3>
              <p className="text-sm text-emerald-600">
                此促销活动已完成全部流程，包括销售核对。
              </p>
            </div>
          )}

          <div className="card p-5">
            <h3 className="font-serif text-base font-semibold text-navy-500 mb-4">
              快速统计
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">审批环节</span>
                <span className="text-sm font-medium text-slate-700">
                  {promotion.steps.length} 步
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">备注记录</span>
                <span className="text-sm font-medium text-slate-700">
                  {promotion.remarks.length} 条
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">涉及角色</span>
                <span className="text-sm font-medium text-slate-700">
                  {new Set(promotion.steps.map(s => s.role)).size} 个
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-500">总耗时</span>
                <span className="text-sm font-medium text-slate-700">
                  {formatRelativeTime(promotion.createdAt, promotion.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-serif text-base font-semibold text-navy-500 mb-4">
              操作提示
            </h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <p>所有备注记录都会延续到销售核对环节，便于追溯。</p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p>完整处理链路展示从创建到完成的每一步操作。</p>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                <p>可在促销活动页和销售核对页之间无缝切换。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
