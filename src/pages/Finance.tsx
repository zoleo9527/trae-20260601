import { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/StatCard';
import { useProductStore } from '@/store/useProductStore';
import { Wallet, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, Eye, Copy, Check } from 'lucide-react';
import { formatCurrency, formatDate, maskPhone } from '@/utils/format';
import { STATUS_COLORS, STATUS_LABELS } from '@/types';

export default function Finance() {
  const [activeTab, setActiveTab] = useState<'pending' | 'settled'>('pending');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const products = useProductStore((state) => state.products);
  const confirmSettlement = useProductStore((state) => state.confirmSettlement);
  const getStats = useProductStore((state) => state.getStats);

  const stats = getStats();

  const pendingSettlement = useMemo(() =>
    products.filter((p) =>
      ['SOLD', 'PENDING_SETTLEMENT'].includes(p.status) && p.settlement?.status === 'pending'
    ),
    [products]
  );

  const settled = useMemo(() =>
    products.filter((p) => p.status === 'SETTLED' && p.settlement?.status === 'paid'),
    [products]
  );

  const totalPendingAmount = useMemo(() =>
    pendingSettlement.reduce((sum, p) => sum + (p.settlement?.settlementAmount || 0), 0),
    [pendingSettlement]
  );

  const totalSettledAmount = useMemo(() =>
    settled.reduce((sum, p) => sum + (p.settlement?.settlementAmount || 0), 0),
    [settled]
  );

  const handleConfirmSettlement = (productId: string) => {
    if (confirm('确认已打款给客户吗？此操作不可撤销。')) {
      confirmSettlement(productId, '刘财务');
      setExpandedProduct(null);
    }
  };

  const handleCopySettlementInfo = (product: typeof products[0]) => {
    if (!product.settlement) return;
    const info = `【结算单】
商品编号：${product.id}
商品名称：${product.name}
成交价格：${formatCurrency(product.settlement.salePrice)}
佣金比例：${(product.settlement.commissionRate * 100).toFixed(0)}%
佣金金额：${formatCurrency(product.settlement.commission)}
结算金额：${formatCurrency(product.settlement.settlementAmount)}
客户姓名：${product.customer.name}
联系电话：${maskPhone(product.customer.phone)}
成交时间：${formatDate(product.soldAt || '')}
结算状态：${product.settlement.status === 'paid' ? '已打款' : '待打款'}`;

    navigator.clipboard.writeText(info);
    setCopiedId(product.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  return (
    <MainLayout
      title="财务区"
      subtitle="寄卖商品结算管理、打款确认"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            title="待结算"
            value={pendingSettlement.length}
            icon={Clock}
            color="gold"
          />
          <div className="card p-5 bg-champagne-50 border border-champagne-200 border-l-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-600 mb-1">待结算金额</p>
                <p className="text-2xl font-bold text-champagne-700">{formatCurrency(totalPendingAmount)}</p>
              </div>
              <div className="bg-champagne-100 p-3 rounded-luxury">
                <Wallet className="w-6 h-6 text-champagne-600" />
              </div>
            </div>
          </div>
          <StatCard
            title="已结算"
            value={settled.length}
            icon={CheckCircle2}
            color="green"
          />
          <div className="card p-5 bg-jade-50 border border-jade-200 border-l-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-600 mb-1">已结算金额</p>
                <p className="text-2xl font-bold text-jade-600">{formatCurrency(totalSettledAmount)}</p>
              </div>
              <div className="bg-jade-100 p-3 rounded-luxury">
                <Wallet className="w-6 h-6 text-jade-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-luxury text-sm font-medium transition-all ${
              activeTab === 'pending'
                ? 'bg-champagne-500 text-luxury-800 shadow-luxury'
                : 'text-charcoal-600 hover:bg-ivory-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            待结算（{pendingSettlement.length}）
          </button>
          <button
            onClick={() => setActiveTab('settled')}
            className={`flex items-center gap-2 px-4 py-2 rounded-luxury text-sm font-medium transition-all ${
              activeTab === 'settled'
                ? 'bg-luxury-800 text-white shadow-luxury'
                : 'text-charcoal-600 hover:bg-ivory-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            已结算（{settled.length}）
          </button>
        </div>

        <div className="card p-6">
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {pendingSettlement.length === 0 ? (
                <div className="text-center py-12 text-charcoal-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-jade-500" />
                  <p>暂无待结算商品</p>
                </div>
              ) : (
                pendingSettlement.map((product, index) => (
                  <div
                    key={product.id}
                    className={`border border-ivory-200 rounded-luxury overflow-hidden animate-stagger-${Math.min(index + 1, 5)} ${
                      product.status === 'PENDING_SETTLEMENT' ? 'border-l-4 border-l-champagne-500' : 'border-l-4 border-l-jade-500'
                    }`}
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-ivory-50 transition-colors"
                      onClick={() => toggleExpand(product.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-16 h-16 rounded-luxury overflow-hidden bg-ivory-100 flex-shrink-0">
                            {product.images[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-luxury-800">{product.name}</h4>
                              <span className={`status-badge text-xs ${STATUS_COLORS[product.status]}`}>
                                {STATUS_LABELS[product.status]}
                              </span>
                            </div>
                            <p className="text-sm text-charcoal-600 mt-1">
                              {product.brand} · {product.model}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-charcoal-500">
                                客户：{product.customer.name} ({maskPhone(product.customer.phone)})
                              </span>
                              <span className="text-charcoal-500">
                                成交时间：{formatDate(product.soldAt || '')}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-charcoal-500">结算金额</p>
                            <p className="text-xl font-bold text-luxury-800">
                              {formatCurrency(product.settlement?.settlementAmount || 0)}
                            </p>
                            <p className="text-xs text-charcoal-500 mt-1">
                              成交价 {formatCurrency(product.settlement?.salePrice || 0)}
                            </p>
                          </div>
                          <div className="ml-4">
                            {expandedProduct === product.id ? (
                              <ChevronUp className="w-5 h-5 text-charcoal-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-charcoal-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {expandedProduct === product.id && product.settlement && (
                      <div className="px-4 pb-4 border-t border-ivory-200 bg-ivory-50">
                        <div className="grid grid-cols-2 gap-6 pt-4">
                          <div className="space-y-4">
                            <h5 className="font-display font-semibold text-luxury-800 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-champagne-500" />
                              结算明细
                            </h5>
                            <div className="bg-white rounded-luxury p-4 space-y-3">
                              <div className="flex justify-between">
                                <span className="text-charcoal-600">成交价格</span>
                                <span className="font-medium">{formatCurrency(product.settlement.salePrice)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-charcoal-600">佣金比例</span>
                                <span className="font-medium">{(product.settlement.commissionRate * 100).toFixed(0)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-charcoal-600">佣金金额</span>
                                <span className="font-medium text-coral-600">- {formatCurrency(product.settlement.commission)}</span>
                              </div>
                              <div className="border-t border-ivory-200 pt-3 flex justify-between">
                                <span className="font-semibold text-luxury-800">应付客户</span>
                                <span className="font-bold text-luxury-800 text-lg">
                                  {formatCurrency(product.settlement.settlementAmount)}
                                </span>
                              </div>
                            </div>

                            <div className="bg-white rounded-luxury p-4">
                              <h6 className="font-medium text-luxury-800 mb-3">客户信息</h6>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-charcoal-600">姓名</span>
                                  <span>{product.customer.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-charcoal-600">电话</span>
                                  <span>{maskPhone(product.customer.phone)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-charcoal-600">身份证</span>
                                  <span>{product.customer.idCard ? `********${product.customer.idCard.slice(-4)}` : '-'}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h5 className="font-display font-semibold text-luxury-800 flex items-center gap-2">
                              <Eye className="w-4 h-4 text-luxury-600" />
                              流转记录
                            </h5>
                            <div className="bg-white rounded-luxury p-4 space-y-3 max-h-64 overflow-y-auto">
                              {product.statusLogs.slice(-5).reverse().map((log) => (
                                <div key={log.id} className="flex gap-3">
                                  <div className="w-2 h-2 rounded-full bg-champagne-500 mt-1.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm text-luxury-800">{log.description}</p>
                                    <p className="text-xs text-charcoal-500 mt-0.5">
                                      {log.operator} · {formatDate(log.timestamp)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {product.status === 'PENDING_SETTLEMENT' && (
                              <div className="p-4 bg-champagne-50 border border-champagne-200 rounded-luxury">
                                <p className="text-sm text-champagne-700 font-medium mb-2">⚠️ 重要提示</p>
                                <ul className="text-sm text-charcoal-600 space-y-1">
                                  <li>• 请确认买家已确认收货且无售后纠纷</li>
                                  <li>• 请核对客户银行账户信息</li>
                                  <li>• 打款后将自动通知客户</li>
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-ivory-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopySettlementInfo(product);
                            }}
                            className="btn-outline text-sm flex items-center gap-2"
                          >
                            {copiedId === product.id ? (
                              <>
                                <Check className="w-4 h-4" />
                                已复制
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                复制结算单
                              </>
                            )}
                          </button>

                          {product.status === 'PENDING_SETTLEMENT' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmSettlement(product.id);
                              }}
                              className="btn-primary flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              确认打款
                            </button>
                          )}

                          {product.status === 'SOLD' && (
                            <span className="text-sm text-charcoal-500">
                              待运营确认成交后生成结算单
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'settled' && (
            <div className="space-y-4">
              {settled.length === 0 ? (
                <div className="text-center py-12 text-charcoal-500">
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无已结算记录</p>
                </div>
              ) : (
                settled.map((product, index) => (
                  <div
                    key={product.id}
                    className={`border border-ivory-200 rounded-luxury overflow-hidden animate-stagger-${Math.min(index + 1, 5)} border-l-4 border-l-luxury-800`}
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-ivory-50 transition-colors"
                      onClick={() => toggleExpand(product.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-16 h-16 rounded-luxury overflow-hidden bg-ivory-100 flex-shrink-0">
                            {product.images[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-luxury-800">{product.name}</h4>
                              <span className={`status-badge text-xs ${STATUS_COLORS[product.status]}`}>
                                {STATUS_LABELS[product.status]}
                              </span>
                            </div>
                            <p className="text-sm text-charcoal-600 mt-1">
                              {product.brand} · {product.model}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-charcoal-500">
                                客户：{product.customer.name} ({maskPhone(product.customer.phone)})
                              </span>
                              <span className="text-charcoal-500">
                                结算时间：{formatDate(product.settledAt || '')}
                              </span>
                              <span className="text-jade-600 font-medium">
                                ✓ 已打款
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-charcoal-500">结算金额</p>
                            <p className="text-xl font-bold text-luxury-800">
                              {formatCurrency(product.settlement?.settlementAmount || 0)}
                            </p>
                            <p className="text-xs text-charcoal-500 mt-1">
                              成交价 {formatCurrency(product.settlement?.salePrice || 0)}
                            </p>
                          </div>
                          <div className="ml-4">
                            {expandedProduct === product.id ? (
                              <ChevronUp className="w-5 h-5 text-charcoal-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-charcoal-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {expandedProduct === product.id && product.settlement && (
                      <div className="px-4 pb-4 border-t border-ivory-200 bg-ivory-50">
                        <div className="grid grid-cols-2 gap-6 pt-4">
                          <div className="space-y-4">
                            <h5 className="font-display font-semibold text-luxury-800">结算明细</h5>
                            <div className="bg-white rounded-luxury p-4 space-y-3">
                              <div className="flex justify-between">
                                <span className="text-charcoal-600">成交价格</span>
                                <span className="font-medium">{formatCurrency(product.settlement.salePrice)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-charcoal-600">佣金比例</span>
                                <span className="font-medium">{(product.settlement.commissionRate * 100).toFixed(0)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-charcoal-600">佣金金额</span>
                                <span className="font-medium text-coral-600">- {formatCurrency(product.settlement.commission)}</span>
                              </div>
                              <div className="border-t border-ivory-200 pt-3 flex justify-between">
                                <span className="font-semibold text-luxury-800">实付客户</span>
                                <span className="font-bold text-jade-600 text-lg">
                                  {formatCurrency(product.settlement.settlementAmount)}
                                </span>
                              </div>
                            </div>

                            <div className="bg-jade-50 border border-jade-200 rounded-luxury p-4">
                              <p className="text-sm text-jade-700 font-medium">✓ 打款信息</p>
                              <div className="space-y-2 text-sm mt-2">
                                <div className="flex justify-between">
                                  <span className="text-charcoal-600">操作员</span>
                                  <span>{product.settlement.operator || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-charcoal-600">确认时间</span>
                                  <span>{formatDate(product.settlement.confirmedAt || '')}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h5 className="font-display font-semibold text-luxury-800">流转记录</h5>
                            <div className="bg-white rounded-luxury p-4 space-y-3 max-h-64 overflow-y-auto">
                              {product.statusLogs.slice().reverse().map((log) => (
                                <div key={log.id} className="flex gap-3">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                    log.status === 'SETTLED' ? 'bg-jade-500' : 'bg-champagne-500'
                                  }`} />
                                  <div>
                                    <p className="text-sm text-luxury-800">{log.description}</p>
                                    <p className="text-xs text-charcoal-500 mt-0.5">
                                      {log.operator} · {formatDate(log.timestamp)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4 mt-4 border-t border-ivory-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopySettlementInfo(product);
                            }}
                            className="btn-outline text-sm flex items-center gap-2"
                          >
                            {copiedId === product.id ? (
                              <>
                                <Check className="w-4 h-4" />
                                已复制
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                复制结算单
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
