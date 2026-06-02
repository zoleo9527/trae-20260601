import { Bell, Search, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '@/store/useProductStore';
import { useState, useMemo } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const products = useProductStore((state) => state.products);

  const stats = useMemo(() => {
    const pending = products.filter((p) =>
      ['PENDING_APPRAISAL', 'PENDING_LISTING', 'LISTED', 'SOLD', 'PENDING_SETTLEMENT', 'RECEIVED'].includes(p.status)
    ).length;
    const exception = products.filter((p) =>
      ['MISSING_DOCS', 'APPRAISAL_DISPUTE', 'CUSTOMER_WITHDRAW', 'PRICE_CHANGING'].includes(p.status)
    ).length;
    const completed = products.filter((p) =>
      ['APPRAISAL_FAILED', 'SETTLED', 'RETURNED'].includes(p.status)
    ).length;
    return { pending, exception, completed };
  }, [products]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return products.filter((p) =>
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.customer.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [products, searchQuery]);

  return (
    <header className="bg-white border-b border-ivory-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-luxury-800">{title}</h1>
          {subtitle && <p className="text-sm text-charcoal-500 mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-500" />
            <input
              type="text"
              placeholder="搜索商品编号、客户名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-72 bg-ivory-50 border border-ivory-200 rounded-luxury text-sm focus:outline-none focus:ring-2 focus:ring-champagne-500 focus:border-transparent transition-all"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-ivory-200 rounded-luxury shadow-luxury z-50 overflow-hidden">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ivory-50 transition-colors text-left"
                    onClick={() => {
                      navigate(`/product/${p.id}`);
                      setSearchQuery('');
                    }}
                  >
                    <div className="w-10 h-10 rounded-luxury overflow-hidden bg-ivory-100 flex-shrink-0">
                      {p.images[0] && (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-luxury-800 truncate">{p.name}</p>
                      <p className="text-xs text-charcoal-500">{p.id} · {p.customer.name}</p>
                    </div>
                    <span className="status-badge text-xs bg-ivory-100 text-charcoal-600">
                      {p.status.replace(/_/g, ' ')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 px-3 py-1.5 bg-ivory-50 rounded-luxury">
            <button
              className="flex items-center gap-2 px-3 border-r border-ivory-200 hover:opacity-80 transition-opacity"
              onClick={() => navigate('/receiving')}
            >
              <span className="w-2 h-2 rounded-full bg-champagne-500 animate-pulse-soft" />
              <span className="text-sm text-charcoal-600">待办 <span className="font-semibold text-champagne-700">{stats.pending}</span></span>
            </button>
            <button
              className="flex items-center gap-2 px-3 border-r border-ivory-200 hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            >
              <span className="w-2 h-2 rounded-full bg-coral-500 animate-pulse-soft" />
              <span className="text-sm text-charcoal-600">异常 <span className="font-semibold text-coral-600">{stats.exception}</span></span>
            </button>
            <div className="flex items-center gap-2 px-3">
              <span className="w-2 h-2 rounded-full bg-jade-500" />
              <span className="text-sm text-charcoal-600">完成 <span className="font-semibold text-jade-600">{stats.completed}</span></span>
            </div>
          </div>

          <button className="relative p-2 text-charcoal-600 hover:text-luxury-800 hover:bg-ivory-100 rounded-luxury transition-colors">
            <Bell className="w-5 h-5" />
            {stats.exception > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-coral-500 rounded-full" />
            )}
          </button>

          <button className="p-2 text-charcoal-600 hover:text-luxury-800 hover:bg-ivory-100 rounded-luxury transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
