import MainLayout from '@/components/layout/MainLayout';
import { useProductStore } from '@/store/useProductStore';
import { STATUS_COLORS, STATUS_LABELS, type ProductStatus } from '@/types';
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/utils/format';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Eye, FileWarning,
  Package,
  RotateCcw,
  Search, ShoppingBag,
  TrendingUp,
  Wallet,
  XCircle,
  Zap
} from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface PipelineStep {
  label: string;
  statuses: ProductStatus[];
  icon: typeof Package;
  color: string;
  bgColor: string;
  borderColor: string;
  path: string;
}

const pipeline: PipelineStep[] = [
  {
    label: '收货',
    statuses: ['RECEIVED', 'MISSING_DOCS'],
    icon: Package,
    color: 'text-luxury-600',
    bgColor: 'bg-luxury-50',
    borderColor: 'border-luxury-300',
    path: '/receiving',
  },
  {
    label: '鉴定',
    statuses: ['PENDING_APPRAISAL', 'APPRAISING', 'APPRAISAL_DISPUTE'],
    icon: Search,
    color: 'text-champagne-600',
    bgColor: 'bg-champagne-50',
    borderColor: 'border-champagne-300',
    path: '/appraisal',
  },
  {
    label: '拍照',
    statuses: ['APPRAISAL_PASSED', 'PENDING_PHOTO', 'PHOTOGRAPHING'],
    icon: Camera,
    color: 'text-champagne-600',
    bgColor: 'bg-champagne-50',
    borderColor: 'border-champagne-300',
    path: '/photo',
  },
  {
    label: '上架',
    statuses: ['PENDING_LISTING', 'PRICE_CHANGING'],
    icon: ShoppingBag,
    color: 'text-jade-600',
    bgColor: 'bg-jade-50',
    borderColor: 'border-jade-300',
    path: '/operations',
  },
  {
    label: '成交',
    statuses: ['LISTED', 'SOLD'],
    icon: TrendingUp,
    color: 'text-jade-700',
    bgColor: 'bg-jade-50',
    borderColor: 'border-jade-400',
    path: '/operations',
  },
  {
    label: '结算',
    statuses: ['PENDING_SETTLEMENT', 'SETTLED'],
    icon: DollarSign,
    color: 'text-champagne-700',
    bgColor: 'bg-champagne-50',
    borderColor: 'border-champagne-400',
    path: '/finance',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const products = useProductStore((state) => state.products);
  const getStats = useProductStore((state) => state.getStats);
  const stats = getStats();

  const exceptionStatuses: ProductStatus[] = [
    'MISSING_DOCS', 'APPRAISAL_DISPUTE', 'CUSTOMER_WITHDRAW', 'PRICE_CHANGING', 'APPRAISAL_FAILED'
  ];

  const exceptions = useMemo(() =>
    products.filter((p) => exceptionStatuses.includes(p.status))
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (priorityOrder[a.priority || 'medium'] || 1) - (priorityOrder[b.priority || 'medium'] || 1);
      }),
    [products]
  );

  const recentActions = useMemo(() => {
    const allLogs = products.flatMap((p) =>
      p.statusLogs.map((log) => ({
        ...log,
        productName: p.name,
        productId: p.id,
        productStatus: p.status,
      }))
    );
    return allLogs.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 10);
  }, [products]);

  const pipelineCounts = useMemo(() =>
    pipeline.map((step) => ({
      ...step,
      count: products.filter((p) => step.statuses.includes(p.status)).length,
      items: products.filter((p) => step.statuses.includes(p.status)),
    })),
    [products]
  );

  const totalInFlow = useMemo(() =>
    products.filter((p) => !['SETTLED', 'RETURNED', 'APPRAISAL_FAILED'].includes(p.status)).length,
    [products]
  );

  const totalSettledAmount = useMemo(() =>
    products
      .filter((p) => p.settlement?.status === 'paid')
      .reduce((sum, p) => sum + (p.settlement?.settlementAmount || 0), 0),
    [products]
  );

  const totalPendingAmount = useMemo(() =>
    products
      .filter((p) => p.settlement?.status === 'pending')
      .reduce((sum, p) => sum + (p.settlement?.settlementAmount || 0), 0),
    [products]
  );

  const getExceptionIcon = (status: ProductStatus) => {
    switch (status) {
      case 'MISSING_DOCS': return FileWarning;
      case 'APPRAISAL_DISPUTE': return Zap;
      case 'CUSTOMER_WITHDRAW': return RotateCcw;
      case 'PRICE_CHANGING': return TrendingUp;
      case 'APPRAISAL_FAILED': return XCircle;
      default: return AlertTriangle;
    }
  };

  const getExceptionAction = (status: ProductStatus) => {
    switch (status) {
      case 'MISSING_DOCS': return '补交资料';
      case 'APPRAISAL_DISPUTE': return '复核处理';
      case 'CUSTOMER_WITHDRAW': return '处理退回';
      case 'PRICE_CHANGING': return '审批改价';
      case 'APPRAISAL_FAILED': return '查看详情';
      default: return '查看';
    }
  };

  const getExceptionPath = (status: ProductStatus) => {
    switch (status) {
      case 'MISSING_DOCS': return '/receiving';
      case 'APPRAISAL_DISPUTE': return '/appraisal';
      case 'CUSTOMER_WITHDRAW': return '/operations';
      case 'PRICE_CHANGING': return '/operations';
      case 'APPRAISAL_FAILED': return '/appraisal';
      default: return '/';
    }
  };

  return (
    <MainLayout
      title="总览"
      subtitle="二手奢品寄卖 · 内部流转工作台"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-6">
          <div
            className="card p-5 bg-champagne-50 border border-champagne-200 border-l-4 cursor-pointer hover:shadow-card-hover transition-all"
            onClick={() => navigate('/receiving')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-600 mb-1">流转中</p>
                <p className="text-3xl font-bold text-champagne-700">{totalInFlow}</p>
              </div>
              <div className="bg-champagne-100 p-3 rounded-luxury">
                <Package className="w-6 h-6 text-champagne-600" />
              </div>
            </div>
            <p className="text-xs text-charcoal-500 mt-2">收货到成交的活跃商品</p>
          </div>

          <div
            className="card p-5 bg-coral-50 border border-coral-200 border-l-4 cursor-pointer hover:shadow-card-hover transition-all"
            onClick={() => {
              const el = document.getElementById('exceptions');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-600 mb-1">异常待处理</p>
                <p className="text-3xl font-bold text-coral-600">{exceptions.length}</p>
              </div>
              <div className="bg-coral-100 p-3 rounded-luxury">
                <AlertTriangle className="w-6 h-6 text-coral-600" />
              </div>
            </div>
            <p className="text-xs text-charcoal-500 mt-2">资料缺失 · 鉴定争议 · 客户撤回</p>
          </div>

          <div
            className="card p-5 bg-jade-50 border border-jade-200 border-l-4 cursor-pointer hover:shadow-card-hover transition-all"
            onClick={() => navigate('/finance')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-600 mb-1">待结算金额</p>
                <p className="text-2xl font-bold text-jade-600">{formatCurrency(totalPendingAmount)}</p>
              </div>
              <div className="bg-jade-100 p-3 rounded-luxury">
                <Wallet className="w-6 h-6 text-jade-600" />
              </div>
            </div>
            <p className="text-xs text-charcoal-500 mt-2">成交后待打款给客户</p>
          </div>

          <div
            className="card p-5 bg-ivory-50 border border-ivory-200 border-l-4 cursor-pointer hover:shadow-card-hover transition-all"
            onClick={() => navigate('/finance')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-600 mb-1">累计已结算</p>
                <p className="text-2xl font-bold text-luxury-800">{formatCurrency(totalSettledAmount)}</p>
              </div>
              <div className="bg-luxury-100 p-3 rounded-luxury">
                <CheckCircle2 className="w-6 h-6 text-luxury-600" />
              </div>
            </div>
            <p className="text-xs text-charcoal-500 mt-2">已完成全部结算的商品</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-lg font-semibold text-luxury-800">流转管线</h3>
            <span className="text-sm text-charcoal-500">共 {products.length} 件商品</span>
          </div>

          <div className="flex items-stretch gap-0">
            {pipelineCounts.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex-1 flex items-stretch">
                  <button
                    onClick={() => navigate(step.path)}
                    className={`flex-1 p-4 ${step.bgColor} border ${step.borderColor} rounded-luxury hover:shadow-card-hover transition-all text-left`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`w-5 h-5 ${step.color}`} />
                      <span className={`font-medium ${step.color}`}>{step.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-bold ${step.color}`}>{step.count}</span>
                      <span className="text-sm text-charcoal-500">件</span>
                    </div>
                    {step.items.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {step.items.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/product/${item.id}`);
                            }}
                          >
                            <span className={`status-badge text-[10px] px-1.5 py-0 ${STATUS_COLORS[item.status]}`}>
                              {STATUS_LABELS[item.status]}
                            </span>
                            <span className="text-charcoal-700 truncate">{item.name}</span>
                          </div>
                        ))}
                        {step.items.length > 2 && (
                          <p className="text-xs text-charcoal-400">+{step.items.length - 2} 件更多</p>
                        )}
                      </div>
                    )}
                  </button>
                  {index < pipelineCounts.length - 1 && (
                    <div className="flex items-center px-1">
                      <ArrowRight className="w-4 h-4 text-charcoal-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-ivory-200">
            <div className="flex items-center gap-2 text-sm text-charcoal-500">
              <XCircle className="w-4 h-4 text-charcoal-500" />
              <span>已终止：{products.filter((p) => ['APPRAISAL_FAILED', 'RETURNED'].includes(p.status)).length} 件</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-charcoal-500">
              <CheckCircle2 className="w-4 h-4 text-jade-500" />
              <span>已完结：{products.filter((p) => p.status === 'SETTLED').length} 件</span>
            </div>
          </div>
        </div>

        <div id="exceptions" className="card p-6 border-l-4 border-l-coral-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-coral-500" />
              <h3 className="font-display text-lg font-semibold text-luxury-800">
                异常与待办（{exceptions.length}）
              </h3>
            </div>
            <span className="text-sm text-coral-600">需要人工介入处理</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {exceptions.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-charcoal-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-jade-500" />
                <p>暂无异常，一切顺畅</p>
              </div>
            ) : (
              exceptions.map((product) => {
                const Icon = getExceptionIcon(product.status);
                return (
                  <div
                    key={product.id}
                    className="p-4 bg-coral-50/50 border border-coral-200 rounded-luxury hover:shadow-card-hover transition-all cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-coral-500 flex-shrink-0" />
                        <span className={`status-badge text-xs ${STATUS_COLORS[product.status]}`}>
                          {STATUS_LABELS[product.status]}
                        </span>
                        {product.priority === 'high' && (
                          <span className="status-badge bg-coral-100 text-coral-600 text-xs">紧急</span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-charcoal-400" />
                    </div>
                    <h4 className="font-medium text-luxury-800 text-sm">{product.name}</h4>
                    <p className="text-xs text-charcoal-500 mt-1">{product.brand} · {product.customer.name}</p>

                    {product.status === 'MISSING_DOCS' && product.documents.missingNotes && (
                      <p className="text-xs text-coral-600 mt-2 bg-coral-100 p-1.5 rounded">
                        {product.documents.missingNotes}
                      </p>
                    )}
                    {product.status === 'APPRAISAL_DISPUTE' && product.disputeReason && (
                      <p className="text-xs text-coral-600 mt-2 bg-coral-100 p-1.5 rounded">
                        {product.disputeReason}
                      </p>
                    )}
                    {product.status === 'CUSTOMER_WITHDRAW' && product.withdrawReason && (
                      <p className="text-xs text-coral-600 mt-2 bg-coral-100 p-1.5 rounded">
                        {product.withdrawReason}
                      </p>
                    )}
                    {product.status === 'PRICE_CHANGING' && product.priceHistory.length > 0 && (
                      <p className="text-xs text-champagne-600 mt-2 bg-champagne-100 p-1.5 rounded">
                        申请改价：{formatCurrency(product.priceHistory[product.priceHistory.length - 1].newPrice)}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-coral-200">
                      <span className="text-xs text-charcoal-400">
                        {formatRelativeTime(product.statusLogs[product.statusLogs.length - 1]?.timestamp || product.receivedAt)}
                      </span>
                      <button
                        className="text-xs text-coral-600 hover:text-coral-700 font-medium flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(getExceptionPath(product.status));
                        }}
                      >
                        {getExceptionAction(product.status)}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-champagne-600" />
                <h3 className="font-display text-lg font-semibold text-luxury-800">最近操作</h3>
              </div>
              <span className="text-sm text-charcoal-500">全工作台动态</span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
              {recentActions.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-luxury hover:bg-ivory-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/product/${log.productId}`)}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    exceptionStatuses.includes(log.status) ? 'bg-coral-500' :
                    ['SETTLED', 'APPRAISAL_PASSED', 'LISTED'].includes(log.status) ? 'bg-jade-500' :
                    'bg-champagne-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-luxury-800 truncate">{log.productName}</span>
                      <span className={`status-badge text-[10px] px-1.5 py-0 ${STATUS_COLORS[log.status]}`}>
                        {STATUS_LABELS[log.status]}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-600 mt-0.5">{log.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-charcoal-400">
                      <span>{log.operator}</span>
                      <span>{formatDateTime(log.timestamp)}</span>
                      {log.visibleToCustomer ? (
                        <span className="text-jade-600 flex items-center gap-0.5">
                          <Eye className="w-3 h-3" /> 客户可见
                        </span>
                      ) : (
                        <span className="text-charcoal-400">内部</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-champagne-600" />
              <h3 className="font-display text-lg font-semibold text-luxury-800">客户进度概览</h3>
            </div>

            <div className="space-y-3">
              {products
                .filter((p) => !['SETTLED', 'RETURNED', 'APPRAISAL_FAILED'].includes(p.status))
                .slice(0, 6)
                .map((product) => {
                  const visibleLogs = product.statusLogs.filter((l) => l.visibleToCustomer);
                  const latestVisibleLog = visibleLogs[visibleLogs.length - 1];
                  return (
                    <div
                      key={product.id}
                      className="p-3 bg-ivory-50 rounded-luxury hover:bg-ivory-100 transition-colors cursor-pointer"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-luxury-800 truncate">{product.name}</span>
                        <span className={`status-badge text-[10px] px-1.5 py-0 ${STATUS_COLORS[product.status]}`}>
                          {STATUS_LABELS[product.status]}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-600">
                        {product.customer.name} · {product.brand}
                      </p>
                      {latestVisibleLog && (
                        <p className="text-xs text-champagne-600 mt-1 truncate">
                          {latestVisibleLog.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        {['RECEIVED', 'PENDING_APPRAISAL', 'PENDING_PHOTO', 'PENDING_LISTING', 'LISTED', 'SOLD', 'PENDING_SETTLEMENT'].map((step) => {
                          const reached = product.statusLogs.some((l) => {
                            const stepToStatuses: Record<string, ProductStatus[]> = {
                              RECEIVED: ['RECEIVED', 'MISSING_DOCS', 'PENDING_APPRAISAL', 'APPRAISING', 'APPRAISAL_DISPUTE', 'APPRAISAL_PASSED', 'PENDING_PHOTO', 'PHOTOGRAPHING', 'PENDING_LISTING', 'LISTED', 'PRICE_CHANGING', 'SOLD', 'PENDING_SETTLEMENT', 'SETTLED'],
                              PENDING_APPRAISAL: ['PENDING_APPRAISAL', 'APPRAISING', 'APPRAISAL_DISPUTE', 'APPRAISAL_PASSED', 'PENDING_PHOTO', 'PHOTOGRAPHING', 'PENDING_LISTING', 'LISTED', 'PRICE_CHANGING', 'SOLD', 'PENDING_SETTLEMENT', 'SETTLED'],
                              PENDING_PHOTO: ['PENDING_PHOTO', 'PHOTOGRAPHING', 'PENDING_LISTING', 'LISTED', 'PRICE_CHANGING', 'SOLD', 'PENDING_SETTLEMENT', 'SETTLED'],
                              PENDING_LISTING: ['PENDING_LISTING', 'LISTED', 'PRICE_CHANGING', 'SOLD', 'PENDING_SETTLEMENT', 'SETTLED'],
                              LISTED: ['LISTED', 'PRICE_CHANGING', 'SOLD', 'PENDING_SETTLEMENT', 'SETTLED'],
                              SOLD: ['SOLD', 'PENDING_SETTLEMENT', 'SETTLED'],
                              PENDING_SETTLEMENT: ['PENDING_SETTLEMENT', 'SETTLED'],
                            };
                            return (stepToStatuses[step] || []).includes(l.status as ProductStatus);
                          });
                          return (
                            <div
                              key={step}
                              className={`h-1.5 flex-1 rounded-full ${
                                reached ? 'bg-champagne-500' : 'bg-ivory-200'
                              }`}
                              title={STATUS_LABELS[step as ProductStatus]}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            <button
              className="w-full mt-4 p-3 text-sm text-center text-champagne-600 hover:bg-champagne-50 rounded-luxury transition-colors border border-champagne-200"
              onClick={() => navigate('/receiving')}
            >
              查看全部商品 →
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
