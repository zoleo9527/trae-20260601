import { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/StatCard';
import ProductCard from '@/components/ProductCard';
import PriceChart from '@/components/PriceChart';
import { useProductStore } from '@/store/useProductStore';
import { ShoppingBag, Tag, AlertTriangle, Clock, CheckCircle2, ArrowRightLeft, Banknote, X } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { ProductStatus } from '@/types';

export default function Operations() {
  const [activeTab, setActiveTab] = useState<'pending' | 'listed' | 'pricing'>('pending');
  const [priceChangeProduct, setPriceChangeProduct] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [priceReason, setPriceReason] = useState('');
  const [sellProductId, setSellProductId] = useState<string | null>(null);
  const [sellPrice, setSellPrice] = useState('');

  const products = useProductStore((state) => state.products);
  const listProduct = useProductStore((state) => state.listProduct);
  const updatePrice = useProductStore((state) => state.updatePrice);
  const updateProductStatus = useProductStore((state) => state.updateProductStatus);
  const handleWithdraw = useProductStore((state) => state.handleWithdraw);
  const requestPriceChange = useProductStore((state) => state.requestPriceChange);
  const approvePriceChange = useProductStore((state) => state.approvePriceChange);
  const sellProduct = useProductStore((state) => state.sellProduct);
  const getStats = useProductStore((state) => state.getStats);

  const stats = getStats();

  const pendingListing = useMemo(() =>
    products.filter((p) =>
      ['APPRAISAL_PASSED', 'PENDING_PHOTO', 'PENDING_LISTING'].includes(p.status)
    ),
    [products]
  );

  const listed = useMemo(() =>
    products.filter((p) => p.status === 'LISTED'),
    [products]
  );

  const priceChanging = useMemo(() =>
    products.filter((p) => p.status === 'PRICE_CHANGING'),
    [products]
  );

  const withdrawRequests = useMemo(() =>
    products.filter((p) => p.status === 'CUSTOMER_WITHDRAW'),
    [products]
  );

  const priceChangeProductData = useMemo(() =>
    products.find((p) => p.id === priceChangeProduct),
    [products, priceChangeProduct]
  );

  const sellProductData = useMemo(() =>
    products.find((p) => p.id === sellProductId),
    [products, sellProductId]
  );

  const handleAction = (productId: string, action: string) => {
    if (action === 'list') {
      listProduct(productId, '陈运营');
    } else if (action === 'approve_price') {
      const product = products.find((p) => p.id === productId);
      if (product) {
        setPriceChangeProduct(productId);
        setNewPrice(product.priceRequest?.requestedPrice.toString() || product.currentPrice.toString());
        setPriceReason(product.priceRequest?.reason || '');
      }
    } else if (action === 'process_return') {
      const reason = prompt('请输入退回原因：');
      if (reason) {
        handleWithdraw(productId, reason);
        updateProductStatus(productId, 'RETURNED' as ProductStatus, {
          status: 'RETURNED',
          description: `商品已退回客户，原因：${reason}`,
          operator: '陈运营',
          visibleToCustomer: true,
        });
      }
    } else if (action === 'sell') {
      const product = products.find((p) => p.id === productId);
      if (product) {
        setSellProductId(productId);
        setSellPrice(product.currentPrice.toString());
      }
    }
  };

  const handleApprovePrice = () => {
    if (!priceChangeProduct || !newPrice) return;
    approvePriceChange(priceChangeProduct, '陈运营');
    setPriceChangeProduct(null);
    setNewPrice('');
    setPriceReason('');
  };

  const handleInitiatePriceChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      const price = prompt('请输入新价格：', product.currentPrice.toString());
      if (price) {
        const reason = prompt('请输入改价原因：');
        if (reason) {
          requestPriceChange(productId, parseInt(price), reason, '陈运营');
        }
      }
    }
  };

  const handleConfirmSell = () => {
    if (!sellProductId || !sellPrice) return;
    sellProduct(sellProductId, parseInt(sellPrice), '陈运营');
    setSellProductId(null);
    setSellPrice('');
  };

  return (
    <MainLayout
      title="运营区"
      subtitle="商品上架管理、价格调整和客户撤回处理"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            title="待上架"
            value={pendingListing.length}
            icon={ShoppingBag}
            color="gold"
          />
          <StatCard
            title="已上架"
            value={listed.length}
            icon={Tag}
            color="green"
          />
          <StatCard
            title="改价审批"
            value={priceChanging.length}
            icon={ArrowRightLeft}
            color="gold"
          />
          <StatCard
            title="撤回申请"
            value={withdrawRequests.length}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {withdrawRequests.length > 0 && (
          <div className="card p-6 border-l-4 border-l-coral-500">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-coral-500" />
              <h3 className="font-display text-lg font-semibold text-luxury-800">
                客户撤回申请（{withdrawRequests.length}）
              </h3>
            </div>
            <div className="space-y-4">
              {withdrawRequests.map((product) => (
                <div key={product.id} className="p-4 bg-coral-50 rounded-luxury border border-coral-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-luxury-800">{product.name}</h4>
                      <p className="text-sm text-charcoal-600">{product.brand} · {product.model}</p>
                      {product.withdrawReason && (
                        <p className="text-sm text-coral-600 mt-2">撤回原因：{product.withdrawReason}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAction(product.id, 'process_return')}
                      className="btn-outline text-sm"
                    >
                      处理退回
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sellProductId && sellProductData ? (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-semibold text-luxury-800">标记成交</h3>
              <button
                onClick={() => {
                  setSellProductId(null);
                  setSellPrice('');
                }}
                className="text-sm text-charcoal-500 hover:text-luxury-800"
              >
                返回列表
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="flex gap-4 mb-6">
                  <div className="w-24 h-24 rounded-luxury overflow-hidden bg-ivory-100 flex-shrink-0">
                    {sellProductData.images[0] && (
                      <img
                        src={sellProductData.images[0]}
                        alt={sellProductData.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-luxury-800">{sellProductData.name}</h4>
                    <p className="text-charcoal-600 text-sm">{sellProductData.brand} · {sellProductData.model}</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <p>
                        <span className="text-charcoal-500">当前售价：</span>
                        <span className="text-jade-600 font-semibold">{formatCurrency(sellProductData.currentPrice)}</span>
                      </p>
                      <p>
                        <span className="text-charcoal-500">上架天数：</span>
                        <span>{Math.floor((Date.now() - new Date(sellProductData.listedAt || '').getTime()) / (1000 * 60 * 60 * 24)) || 0} 天</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-jade-50 border border-jade-200 rounded-luxury">
                  <p className="text-sm text-jade-700 font-medium mb-2">💰 成交结算预览</p>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-charcoal-500">成交金额：</span>
                      <span className="text-luxury-800 font-semibold">{formatCurrency(parseInt(sellPrice) || sellProductData.currentPrice)}</span>
                    </p>
                    <p>
                      <span className="text-charcoal-500">平台佣金（12%）：</span>
                      <span className="text-champagne-700">{formatCurrency(Math.round((parseInt(sellPrice) || sellProductData.currentPrice) * 0.12))}</span>
                    </p>
                    <p className="pt-1 border-t border-jade-200">
                      <span className="text-charcoal-500">客户结算：</span>
                      <span className="text-jade-600 font-bold">{formatCurrency(Math.round((parseInt(sellPrice) || sellProductData.currentPrice) * 0.88))}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">实际成交价格</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-500">¥</span>
                    <input
                      type="number"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      className="input-field pl-8 text-lg font-semibold"
                      placeholder="输入实际成交价格"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-ivory-200">
                  <button
                    onClick={() => {
                      setSellProductId(null);
                      setSellPrice('');
                    }}
                    className="btn-outline"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmSell}
                    className="btn-primary"
                  >
                    确认成交，转入结算
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : priceChangeProduct && priceChangeProductData ? (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-semibold text-luxury-800">改价审批</h3>
              <button
                onClick={() => setPriceChangeProduct(null)}
                className="text-sm text-charcoal-500 hover:text-luxury-800"
              >
                返回列表
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="flex gap-4 mb-6">
                  <div className="w-24 h-24 rounded-luxury overflow-hidden bg-ivory-100 flex-shrink-0">
                    {priceChangeProductData.images[0] && (
                      <img
                        src={priceChangeProductData.images[0]}
                        alt={priceChangeProductData.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-luxury-800">{priceChangeProductData.name}</h4>
                    <p className="text-charcoal-600 text-sm">{priceChangeProductData.brand} · {priceChangeProductData.model}</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <p>
                        <span className="text-charcoal-500">原价格：</span>
                        <span className="text-charcoal-800 line-through">{formatCurrency(priceChangeProductData.expectedPrice)}</span>
                      </p>
                      <p>
                        <span className="text-charcoal-500">当前价：</span>
                        <span className="text-champagne-600 font-semibold">{formatCurrency(priceChangeProductData.currentPrice)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <PriceChart
                  priceHistory={priceChangeProductData.priceHistory}
                  currentPrice={priceChangeProductData.currentPrice}
                  expectedPrice={priceChangeProductData.expectedPrice}
                />
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">申请新价格</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-500">¥</span>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="input-field pl-8 text-lg font-semibold"
                      placeholder="输入新价格"
                    />
                  </div>
                  {priceChangeProductData.priceHistory.length > 0 && (
                    <p className="text-xs text-charcoal-500 mt-2">
                      上次调价：{formatCurrency(priceChangeProductData.priceHistory[priceChangeProductData.priceHistory.length - 1].oldPrice)} → {formatCurrency(priceChangeProductData.priceHistory[priceChangeProductData.priceHistory.length - 1].newPrice)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">改价原因</label>
                  <textarea
                    value={priceReason}
                    onChange={(e) => setPriceReason(e.target.value)}
                    className="input-field h-24 resize-none"
                    placeholder="请说明改价原因..."
                  />
                </div>

                <div className="p-4 bg-champagne-50 border border-champagne-200 rounded-luxury">
                  <p className="text-sm text-champagne-700 font-medium mb-2">⚠️ 审批提示</p>
                  <ul className="text-sm text-charcoal-600 space-y-1">
                    <li>• 新价格与客户预期价格相差 {Math.round(((parseInt(newPrice) || 0) - priceChangeProductData.expectedPrice) / priceChangeProductData.expectedPrice * 100)}%</li>
                    <li>• 该商品已上架 {Math.floor((Date.now() - new Date(priceChangeProductData.listedAt || '').getTime()) / (1000 * 60 * 60 * 24)) || 0} 天</li>
                    <li>• 历史调价 {priceChangeProductData.priceHistory.length} 次</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-ivory-200">
                  <button
                    onClick={() => setPriceChangeProduct(null)}
                    className="btn-outline"
                  >
                    驳回
                  </button>
                  <button
                    onClick={handleApprovePrice}
                    className="btn-primary"
                  >
                    通过改价
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-2 px-4 py-2 rounded-luxury text-sm font-medium transition-all ${
                  activeTab === 'pending'
                    ? 'bg-luxury-800 text-white shadow-luxury'
                    : 'text-charcoal-600 hover:bg-ivory-100'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                待上架（{pendingListing.length}）
              </button>
              <button
                onClick={() => setActiveTab('listed')}
                className={`flex items-center gap-2 px-4 py-2 rounded-luxury text-sm font-medium transition-all ${
                  activeTab === 'listed'
                    ? 'bg-jade-600 text-white shadow-luxury'
                    : 'text-charcoal-600 hover:bg-ivory-100'
                }`}
              >
                <Tag className="w-4 h-4" />
                已上架（{listed.length}）
              </button>
              <button
                onClick={() => setActiveTab('pricing')}
                className={`flex items-center gap-2 px-4 py-2 rounded-luxury text-sm font-medium transition-all ${
                  activeTab === 'pricing'
                    ? 'bg-champagne-500 text-luxury-800 shadow-luxury'
                    : 'text-charcoal-600 hover:bg-ivory-100'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                改价审批（{priceChanging.length}）
              </button>
            </div>

            <div className="card p-6">
              {activeTab === 'pending' && (
                <div className="space-y-4">
                  {pendingListing.length === 0 ? (
                    <div className="text-center py-12 text-charcoal-500">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-jade-500" />
                      <p>暂无待上架商品</p>
                    </div>
                  ) : (
                    pendingListing.map((product, index) => (
                      <div key={product.id} className={`animate-stagger-${Math.min(index + 1, 5)}`}>
                        <ProductCard
                          product={product}
                          onAction={(action) => handleAction(product.id, action)}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'listed' && (
                <div className="space-y-4">
                  {listed.length === 0 ? (
                    <div className="text-center py-12 text-charcoal-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>暂无已上架商品</p>
                    </div>
                  ) : (
                    listed.map((product, index) => (
                      <div key={product.id} className={`animate-stagger-${Math.min(index + 1, 5)}`}>
                        <div className="card p-4 border-l-4 border-l-jade-500">
                          <div className="flex items-center justify-between">
                            <div className="flex-1" onClick={() => handleAction(product.id, 'view')}>
                              <ProductCard
                                product={product}
                                showActions={false}
                              />
                            </div>
                            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                              <button
                                onClick={() => handleInitiatePriceChange(product.id)}
                                className="btn-outline text-sm"
                              >
                                发起改价
                              </button>
                              <button
                                onClick={() => handleAction(product.id, 'sell')}
                                className="btn-primary text-sm flex items-center gap-1.5"
                              >
                                <Banknote className="w-4 h-4" />
                                标记成交
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'pricing' && (
                <div className="space-y-4">
                  {priceChanging.length === 0 ? (
                    <div className="text-center py-12 text-charcoal-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>暂无待审批的改价申请</p>
                    </div>
                  ) : (
                    priceChanging.map((product, index) => (
                      <div key={product.id} className={`animate-stagger-${Math.min(index + 1, 5)}`}>
                        <ProductCard
                          product={product}
                          onAction={(action) => handleAction(product.id, action)}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
