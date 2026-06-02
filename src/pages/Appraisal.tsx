import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/StatCard';
import ProductCard from '@/components/ProductCard';
import { useProductStore } from '@/store/useProductStore';
import { Search, AlertTriangle, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import type { ProductStatus, Flaw } from '@/types';

export default function Appraisal() {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [conclusion, setConclusion] = useState<'genuine' | 'counterfeit' | 'disputed'>('genuine');
  const [remark, setRemark] = useState('');
  const [flaws, setFlaws] = useState<Flaw[]>([]);
  const [newFlaw, setNewFlaw] = useState({ description: '', severity: 'minor' as Flaw['severity'], location: '' });

  const products = useProductStore((state) => state.products);
  const updateProductStatus = useProductStore((state) => state.updateProductStatus);
  const updateAppraisal = useProductStore((state) => state.updateAppraisal);
  const resolveDispute = useProductStore((state) => state.resolveDispute);
  const getStats = useProductStore((state) => state.getStats);

  const stats = getStats();

  const pendingAppraisal = useMemo(() =>
    products.filter((p) =>
      ['PENDING_APPRAISAL', 'APPRAISING'].includes(p.status)
    ).sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority || 'medium'] || 1) - (priorityOrder[b.priority || 'medium'] || 1);
    }),
    [products]
  );

  const disputed = useMemo(() =>
    products.filter((p) => p.status === 'APPRAISAL_DISPUTE'),
    [products]
  );

  const completed = useMemo(() =>
    products.filter((p) =>
      ['APPRAISAL_PASSED', 'APPRAISAL_FAILED'].includes(p.status)
    ),
    [products]
  );

  const selectedProductData = useMemo(() =>
    products.find((p) => p.id === selectedProduct),
    [products, selectedProduct]
  );

  const handleStartAppraisal = (productId: string) => {
    setSelectedProduct(productId);
    setConclusion('genuine');
    setRemark('');
    setFlaws([]);
    updateProductStatus(productId, 'APPRAISING' as ProductStatus, {
      status: 'APPRAISING',
      description: '鉴定师李鉴定开始鉴定',
      operator: '李鉴定',
      visibleToCustomer: false,
    });
  };

  const handleAddFlaw = () => {
    if (newFlaw.description && newFlaw.location) {
      setFlaws([
        ...flaws,
        {
          id: `flaw-${Date.now()}`,
          ...newFlaw,
        },
      ]);
      setNewFlaw({ description: '', severity: 'minor', location: '' });
    }
  };

  const handleRemoveFlaw = (flawId: string) => {
    setFlaws(flaws.filter((f) => f.id !== flawId));
  };

  const handleSubmitAppraisal = () => {
    if (!selectedProduct) return;

    updateAppraisal(selectedProduct, {
      conclusion,
      remark,
      appraiser: '李鉴定',
      flaws,
    });

    if (conclusion === 'disputed') {
      updateProductStatus(selectedProduct, 'APPRAISAL_DISPUTE' as ProductStatus, {
        status: 'APPRAISAL_DISPUTE',
        description: '鉴定存疑，已提交资深鉴定师复核',
        operator: '李鉴定',
        visibleToCustomer: false,
      });
    } else if (conclusion === 'genuine') {
      updateProductStatus(selectedProduct, 'APPRAISAL_PASSED' as ProductStatus, {
        status: 'APPRAISAL_PASSED',
        description: '鉴定通过，正品，已登记瑕疵',
        operator: '李鉴定',
        visibleToCustomer: true,
      });
      updateProductStatus(selectedProduct, 'PENDING_PHOTO' as ProductStatus, {
        status: 'PENDING_PHOTO',
        description: '转入拍照环节，待拍摄商品展示图',
        operator: '李鉴定',
        visibleToCustomer: false,
      });
    } else {
      updateProductStatus(selectedProduct, 'APPRAISAL_FAILED' as ProductStatus, {
        status: 'APPRAISAL_FAILED',
        description: '鉴定为仿品，已通知客户退回',
        operator: '李鉴定',
        visibleToCustomer: true,
      });
    }

    setSelectedProduct(null);
  };

  const handleResolveDispute = (productId: string, isGenuine: boolean) => {
    resolveDispute(productId, isGenuine ? 'genuine' : 'counterfeit', '王资深');
  };

  const handleAction = (productId: string, action: string) => {
    if (action === 'start_appraisal') {
      handleStartAppraisal(productId);
    } else if (action === 'resolve_dispute') {
      navigate(`/product/${productId}`);
    }
  };

  return (
    <MainLayout
      title="鉴定区"
      subtitle="奢侈品真伪鉴定、瑕疵登记和争议处理"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            title="待鉴定"
            value={pendingAppraisal.length}
            icon={Clock}
            color="gold"
          />
          <StatCard
            title="鉴定争议"
            value={disputed.length}
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            title="今日通过"
            value={completed.filter((p) => p.status === 'APPRAISAL_PASSED').length}
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="鉴定未过"
            value={completed.filter((p) => p.status === 'APPRAISAL_FAILED').length}
            icon={XCircle}
            color="red"
          />
        </div>

        {selectedProduct && selectedProductData ? (
          <div className="grid grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold text-luxury-800">商品信息</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-sm text-charcoal-500 hover:text-luxury-800"
                >
                  返回列表
                </button>
              </div>
              <div className="flex gap-4 mb-6">
                <div className="w-32 h-32 rounded-luxury overflow-hidden bg-ivory-100 flex-shrink-0">
                  {selectedProductData.images[0] && (
                    <img
                      src={selectedProductData.images[0]}
                      alt={selectedProductData.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <h4 className="font-display font-semibold text-luxury-800 text-xl">{selectedProductData.name}</h4>
                  <p className="text-charcoal-600">{selectedProductData.brand} · {selectedProductData.model}</p>
                  <p className="text-sm text-charcoal-500 mt-2">编号：{selectedProductData.id}</p>
                  <p className="text-sm text-charcoal-500">客户：{selectedProductData.customer.name}</p>
                  <p className="text-sm text-champagne-600 font-semibold mt-2">
                    预期售价：{selectedProductData.expectedPrice.toLocaleString()} 元
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-ivory-50 rounded-luxury">
                  <p className="text-sm font-medium text-charcoal-700 mb-2">随附资料</p>
                  <div className="flex gap-4 text-sm">
                    <span className={selectedProductData.documents.hasCertificate ? 'text-jade-600' : 'text-coral-600'}>
                      {selectedProductData.documents.hasCertificate ? '✓' : '✗'} 证书
                    </span>
                    <span className={selectedProductData.documents.hasInvoice ? 'text-jade-600' : 'text-coral-600'}>
                      {selectedProductData.documents.hasInvoice ? '✓' : '✗'} 发票
                    </span>
                    <span className={selectedProductData.documents.hasBox ? 'text-jade-600' : 'text-coral-600'}>
                      {selectedProductData.documents.hasBox ? '✓' : '✗'} 原盒
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold text-luxury-800 mb-4">鉴定录入</h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">鉴定结论</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setConclusion('genuine')}
                      className={`p-3 rounded-luxury border-2 text-sm font-medium transition-all ${
                        conclusion === 'genuine'
                          ? 'border-jade-500 bg-jade-50 text-jade-700'
                          : 'border-ivory-200 hover:border-jade-300'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
                      正品
                    </button>
                    <button
                      onClick={() => setConclusion('disputed')}
                      className={`p-3 rounded-luxury border-2 text-sm font-medium transition-all ${
                        conclusion === 'disputed'
                          ? 'border-champagne-500 bg-champagne-50 text-champagne-700'
                          : 'border-ivory-200 hover:border-champagne-300'
                      }`}
                    >
                      <Zap className="w-5 h-5 mx-auto mb-1" />
                      存疑
                    </button>
                    <button
                      onClick={() => setConclusion('counterfeit')}
                      className={`p-3 rounded-luxury border-2 text-sm font-medium transition-all ${
                        conclusion === 'counterfeit'
                          ? 'border-coral-500 bg-coral-50 text-coral-700'
                          : 'border-ivory-200 hover:border-coral-300'
                      }`}
                    >
                      <XCircle className="w-5 h-5 mx-auto mb-1" />
                      仿品
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">瑕疵记录</label>
                  <div className="space-y-3 mb-3">
                    {flaws.map((flaw) => (
                      <div key={flaw.id} className="flex items-center justify-between p-3 bg-ivory-50 rounded-luxury">
                        <div className="flex items-center gap-3">
                          <span className={`status-badge ${
                            flaw.severity === 'minor' ? 'bg-jade-100 text-jade-700' :
                            flaw.severity === 'moderate' ? 'bg-champagne-100 text-champagne-700' :
                            'bg-coral-100 text-coral-700'
                          }`}>
                            {flaw.severity === 'minor' ? '轻微' : flaw.severity === 'moderate' ? '中度' : '严重'}
                          </span>
                          <div>
                            <p className="text-sm text-charcoal-800">{flaw.description}</p>
                            <p className="text-xs text-charcoal-500">位置：{flaw.location}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFlaw(flaw.id)}
                          className="text-coral-500 hover:text-coral-600 text-sm"
                        >
                          移除
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="瑕疵描述"
                      value={newFlaw.description}
                      onChange={(e) => setNewFlaw({ ...newFlaw, description: e.target.value })}
                      className="input-field col-span-2 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="位置"
                      value={newFlaw.location}
                      onChange={(e) => setNewFlaw({ ...newFlaw, location: e.target.value })}
                      className="input-field text-sm"
                    />
                    <div className="flex gap-2">
                      <select
                        value={newFlaw.severity}
                        onChange={(e) => setNewFlaw({ ...newFlaw, severity: e.target.value as Flaw['severity'] })}
                        className="input-field text-sm flex-1"
                      >
                        <option value="minor">轻微</option>
                        <option value="moderate">中度</option>
                        <option value="severe">严重</option>
                      </select>
                      <button
                        onClick={handleAddFlaw}
                        className="btn-secondary text-sm px-3"
                      >
                        添加
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">鉴定备注</label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="请详细描述鉴定依据、特殊说明等..."
                    className="input-field h-24 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-ivory-200">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="btn-outline"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmitAppraisal}
                    className="btn-primary"
                  >
                    提交鉴定结果
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {disputed.length > 0 && (
              <div className="card p-6 border-l-4 border-l-coral-500">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-coral-500" />
                  <h3 className="font-display text-lg font-semibold text-luxury-800">
                    待复核（{disputed.length}）
                  </h3>
                </div>
                <div className="space-y-4">
                  {disputed.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAction={(action) => {
                        if (action === 'resolve_dispute') {
                          const isGenuine = confirm('是否复核为正品？取消则为仿品。');
                          handleResolveDispute(product.id, isGenuine);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-champagne-600" />
                <h3 className="font-display text-lg font-semibold text-luxury-800">
                  待鉴定队列（{pendingAppraisal.length}）
                </h3>
              </div>
              <div className="space-y-4">
                {pendingAppraisal.length === 0 ? (
                  <div className="text-center py-12 text-charcoal-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-jade-500" />
                    <p>暂无待鉴定商品</p>
                  </div>
                ) : (
                  pendingAppraisal.map((product, index) => (
                    <div key={product.id} className={`animate-stagger-${Math.min(index + 1, 5)}`}>
                      <ProductCard
                        product={product}
                        onAction={handleAction.bind(null, product.id)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
