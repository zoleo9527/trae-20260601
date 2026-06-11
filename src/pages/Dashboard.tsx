import { useNavigate } from 'react-router-dom';
import { PlusCircle, Clock, FileBarChart, History, TrendingUp, ListTodo, ShoppingBag, ArrowRight, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { PromotionCard } from '@/components/promotion/PromotionCard';
import { StatusTimeline } from '@/components/timeline/StatusTimeline';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { RoleBadge } from '@/components/common/RoleBadge';
import { formatRelativeTime, formatCurrency, formatDate } from '@/utils/format';
import { ROLE_LABELS, STATUS_LABELS } from '@/types';

export function Dashboard() {
  const navigate = useNavigate();
  const { currentRole, promotions, recentItems, getPendingPromotions, addRecentItem } = useAppStore();
  const pendingPromotions = getPendingPromotions();
  const salesPendingPromotions = promotions.filter(p => 
    p.status === 'salesPending' || (p.status === 'active' && !p.salesData)
  );
  const completedPromotions = promotions.filter(p => p.status === 'completed');

  const handleOpenPromotion = (id: string, title: string) => {
    addRecentItem(id, title);
    navigate(`/promotion/${id}`);
  };

  const handleOpenSales = (id: string, title: string) => {
    addRecentItem(id, title);
    navigate(`/sales/${id}`);
  };

  const stats = [
    {
      label: '待处理',
      value: pendingPromotions.length,
      icon: ListTodo,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      clickable: true,
    },
    {
      label: '进行中',
      value: promotions.filter(p => p.status === 'active').length,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: '待销售核对',
      value: salesPendingPromotions.length,
      icon: ShoppingBag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      clickable: true,
      onClick: () => navigate('/sales'),
    },
    {
      label: '已完成',
      value: completedPromotions.length,
      icon: FileBarChart,
      color: 'text-navy-600',
      bgColor: 'bg-navy-50',
      clickable: true,
      onClick: () => navigate('/sales'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy-500">
            欢迎回来，{ROLE_LABELS[currentRole]}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            处理从左到右接力传递：柜长 → 楼层主管 → 品牌督导。备注将全程延续到销售核对。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/io')}
            className="btn btn-secondary gap-2"
          >
            <FileBarChart size={18} />
            导入导出
          </button>
          <button
            onClick={() => navigate('/promotion/new')}
            className="btn btn-primary gap-2"
          >
            <PlusCircle size={18} />
            新建促销活动
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const CardTag = stat.clickable ? 'button' : 'div';
          return (
            <CardTag
              key={stat.label}
              onClick={stat.onClick}
              className={`card p-5 animate-slide-up text-left w-full ${stat.clickable ? 'hover:shadow-card-hover hover:border-navy-300' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5">
                    {stat.label}
                    {stat.clickable && <ArrowRight size={12} className="text-slate-400" />}
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon size={24} className={stat.color} />
                </div>
              </div>
            </CardTag>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-lg font-semibold text-navy-500 flex items-center gap-2">
                <ListTodo size={20} className="text-amber-500" />
                待处理的单子
                <span className="text-sm font-normal text-slate-400 ml-1">
                  · 按角色展示您该处理的
                </span>
              </h2>
              <span className="badge bg-amber-100 text-amber-700 border-0">
                {pendingPromotions.length} 条
              </span>
            </div>

            {pendingPromotions.length > 0 ? (
              <div className="space-y-4 animate-stagger">
                {pendingPromotions.map((promotion) => (
                  <PromotionCard
                    key={promotion.id}
                    promotion={promotion}
                    onOpen={() => handleOpenPromotion(promotion.id, promotion.title)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="暂无待处理的单子"
                description={`当前${ROLE_LABELS[currentRole]}视角下没有需要处理的促销活动。切换角色可查看其他环节的待办，或点击上方"新建促销活动"开始。`}
              />
            )}
          </div>

          {salesPendingPromotions.length > 0 && (
            <div className="card p-6 border-purple-200 bg-gradient-to-br from-purple-50/50 to-white">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif text-lg font-semibold text-navy-500 flex items-center gap-2">
                  <ShoppingBag size={20} className="text-purple-500" />
                  待销售核对
                  <span className="text-sm font-normal text-slate-400 ml-1">
                    · 促销活动完成后的延续环节
                  </span>
                </h2>
                <button
                  onClick={() => navigate('/sales')}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  全部核对 <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-stagger">
                {salesPendingPromotions.slice(0, 4).map((promotion) => (
                  <div
                    key={promotion.id}
                    onClick={() => handleOpenSales(promotion.id, promotion.title)}
                    className="p-4 bg-white border border-purple-100 rounded-lg hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-navy-500 truncate">{promotion.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {promotion.counter} · {promotion.brand}
                        </p>
                      </div>
                      <StatusBadge status={promotion.status} />
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={promotion.currentRole} />
                        <span className="text-xs text-slate-400">
                          {formatRelativeTime(promotion.updatedAt)}
                        </span>
                      </div>
                      {promotion.salesData ? (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <AlertCircle size={12} />
                          待确认
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                          <AlertCircle size={12} />
                          待录入数据
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {recentItems.length > 0 && (
            <div className="card p-5">
              <h3 className="font-serif text-base font-semibold text-navy-500 flex items-center gap-2 mb-4">
                <History size={18} className="text-slate-500" />
                最近打开
              </h3>
              <div className="space-y-2">
                {recentItems.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleOpenPromotion(item.promotionId, item.title)}
                    className="w-full text-left p-3 rounded-md hover:bg-slate-50 transition-colors group"
                  >
                    <p className="text-sm font-medium text-slate-700 group-hover:text-navy-500 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatRelativeTime(item.openedAt)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5">
            <h3 className="font-serif text-base font-semibold text-navy-500 flex items-center gap-2 mb-4">
              <Clock size={18} className="text-slate-500" />
              快速统计
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">活动预算总额</span>
                <span className="font-semibold text-navy-600">
                  {formatCurrency(promotions.reduce((sum, p) => sum + p.budget, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">实际销售额</span>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(promotions.reduce((sum, p) => sum + (p.salesData?.actualSales || 0), 0))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">累计客单数</span>
                <span className="font-semibold text-slate-700">
                  {promotions.reduce((sum, p) => sum + (p.salesData?.customerCount || 0), 0)} 单
                </span>
              </div>
              {promotions.reduce((sum, p) => sum + (p.salesData?.actualSales || 0), 0) > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-sm text-slate-500">整体达成率</span>
                  <span className="font-semibold text-emerald-600">
                    {(() => {
                      const totalActual = promotions.reduce((sum, p) => sum + (p.salesData?.actualSales || 0), 0);
                      const totalTarget = promotions.reduce((sum, p) => sum + (p.salesData?.targetSales || 0), 0);
                      return totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : '0';
                    })()}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-lg font-semibold text-navy-500 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500" />
            最近状态变化
            <span className="text-sm font-normal text-slate-400 ml-1">
              · 所有环节的操作都会在这里留下痕迹
            </span>
          </h2>
        </div>
        <StatusTimeline promotions={promotions} maxItems={10} />
      </div>

      {completedPromotions.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-lg font-semibold text-navy-500 flex items-center gap-2">
              <FileBarChart size={20} className="text-navy-500" />
              已完成的活动
              <span className="text-sm font-normal text-slate-400 ml-1">
                · 含销售核对的完整归档
              </span>
            </h2>
            <button
              onClick={() => navigate('/sales')}
              className="text-sm text-navy-500 hover:text-amber-600 transition-colors flex items-center gap-1"
            >
              查看全部 <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger">
            {completedPromotions.slice(0, 3).map((promotion) => (
              <div
                key={promotion.id}
                onClick={() => handleOpenSales(promotion.id, promotion.title)}
                className="p-4 border border-slate-200 rounded-lg hover:border-navy-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-navy-500 truncate">{promotion.title}</h4>
                  <StatusBadge status={promotion.status} />
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  {promotion.counter} · {promotion.brand} · {formatDate(promotion.startDate)}
                </p>
                {promotion.salesData && (
                  <>
                    <div className="flex items-center gap-4 text-sm mb-2">
                      <span className="text-slate-500">
                        销售：<span className="font-semibold text-emerald-600">{formatCurrency(promotion.salesData.actualSales)}</span>
                      </span>
                      <span className="text-slate-500">
                        达成：<span className={`font-semibold ${
                          promotion.salesData.actualSales >= promotion.salesData.targetSales
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}>
                          {((promotion.salesData.actualSales / promotion.salesData.targetSales) * 100).toFixed(1)}%
                        </span>
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
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
