import { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/StatCard';
import ProductCard from '@/components/ProductCard';
import { useProductStore } from '@/store/useProductStore';
import { ClipboardList, FileWarning, CheckCircle2, AlertTriangle, Filter } from 'lucide-react';
import type { ProductStatus } from '@/types';

export default function Receiving() {
  const [activeTab, setActiveTab] = useState<'pending' | 'missing'>('pending');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const products = useProductStore((state) => state.products);
  const markDocsComplete = useProductStore((state) => state.markDocsComplete);
  const getStats = useProductStore((state) => state.getStats);
  const updateProductStatus = useProductStore((state) => state.updateProductStatus);

  const stats = getStats();

  const pendingAppraisal = useMemo(() => {
    let result = products.filter((p) =>
      ['PENDING_APPRAISAL', 'RECEIVED'].includes(p.status)
    );
    if (filterPriority !== 'all') {
      result = result.filter((p) => p.priority === filterPriority);
    }
    return result.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority || 'medium'] || 1) - (priorityOrder[b.priority || 'medium'] || 1);
    });
  }, [products, filterPriority]);

  const missingDocs = useMemo(() =>
    products.filter((p) => p.status === 'MISSING_DOCS'),
    [products]
  );

  const handleAction = (productId: string, action: string) => {
    if (action === 'mark_docs') {
      markDocsComplete(productId);
    } else if (action === 'start_appraisal') {
      updateProductStatus(productId, 'APPRAISING' as ProductStatus, {
        status: 'APPRAISING',
        description: '鉴定师李鉴定开始鉴定',
        operator: '李鉴定',
        visibleToCustomer: false,
      });
    }
  };

  return (
    <MainLayout
      title="收货台"
      subtitle="管理收货、资料检查和待鉴定商品"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <StatCard
            title="今日待办"
            value={stats.pending}
            icon={ClipboardList}
            color="gold"
          />
          <StatCard
            title="异常提醒"
            value={stats.exception}
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            title="已完成"
            value={stats.completed}
            icon={CheckCircle2}
            color="green"
          />
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-2 px-4 py-2 rounded-luxury text-sm font-medium transition-all ${
                  activeTab === 'pending'
                    ? 'bg-luxury-800 text-white shadow-luxury'
                    : 'text-charcoal-600 hover:bg-ivory-100'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                待鉴定 ({pendingAppraisal.length})
              </button>
              <button
                onClick={() => setActiveTab('missing')}
                className={`flex items-center gap-2 px-4 py-2 rounded-luxury text-sm font-medium transition-all ${
                  activeTab === 'missing'
                    ? 'bg-coral-500 text-white shadow-luxury'
                    : 'text-charcoal-600 hover:bg-ivory-100'
                }`}
              >
                <FileWarning className="w-4 h-4" />
                资料缺失 ({missingDocs.length})
              </button>
            </div>

            {activeTab === 'pending' && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-charcoal-500" />
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="input-field w-32 text-sm"
                >
                  <option value="all">全部优先级</option>
                  <option value="high">紧急</option>
                  <option value="medium">普通</option>
                  <option value="low">低</option>
                </select>
              </div>
            )}
          </div>

          {activeTab === 'pending' ? (
            <div className="space-y-4">
              {pendingAppraisal.length === 0 ? (
                <div className="text-center py-12 text-charcoal-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无待鉴定商品</p>
                </div>
              ) : (
                pendingAppraisal.map((product, index) => (
                  <div key={product.id} className={`animate-stagger-${Math.min(index + 1, 5)}`}>
                    <ProductCard
                      product={product}
                      onAction={(action) => handleAction(product.id, action)}
                    />
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {missingDocs.length === 0 ? (
                <div className="text-center py-12 text-charcoal-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-jade-500" />
                  <p>暂无资料缺失的商品</p>
                </div>
              ) : (
                missingDocs.map((product, index) => (
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
      </div>
    </MainLayout>
  );
}
