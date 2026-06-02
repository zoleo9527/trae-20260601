import { useProductStore } from '@/store/useProductStore';
import { STATUS_LABELS } from '@/types';
import { AlertTriangle, ArrowRight, FileWarning, RotateCcw, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const workstationStatuses: Record<string, string[]> = {
  '/receiving': ['MISSING_DOCS', 'PENDING_APPRAISAL', 'RECEIVED'],
  '/appraisal': ['PENDING_APPRAISAL', 'APPRAISING', 'APPRAISAL_DISPUTE'],
  '/photo': ['APPRAISAL_PASSED', 'PENDING_PHOTO', 'PHOTOGRAPHING'],
  '/operations': ['PENDING_LISTING', 'LISTED', 'PRICE_CHANGING', 'CUSTOMER_WITHDRAW', 'SOLD'],
  '/finance': ['PENDING_SETTLEMENT', 'SETTLED'],
};

const exceptionStatuses = ['MISSING_DOCS', 'APPRAISAL_DISPUTE', 'CUSTOMER_WITHDRAW', 'PRICE_CHANGING'];

const exceptionRoutes: Record<string, string> = {
  MISSING_DOCS: '/receiving',
  APPRAISAL_DISPUTE: '/appraisal',
  CUSTOMER_WITHDRAW: '/operations',
  PRICE_CHANGING: '/operations',
};

export default function GlobalBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const products = useProductStore((state) => state.products);

  const currentExceptions = products.filter((p) =>
    exceptionStatuses.includes(p.status) &&
    !workstationStatuses[location.pathname]?.includes(p.status)
  );

  const visibleExceptions = currentExceptions.filter((p) => !dismissed.has(p.id));

  if (location.pathname === '/' || visibleExceptions.length === 0) return null;

  const getIcon = (status: string) => {
    switch (status) {
      case 'MISSING_DOCS': return FileWarning;
      case 'APPRAISAL_DISPUTE': return Zap;
      case 'CUSTOMER_WITHDRAW': return RotateCcw;
      case 'PRICE_CHANGING': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="space-y-2">
      {visibleExceptions.slice(0, 3).map((product) => {
        const Icon = getIcon(product.status);
        return (
          <div
            key={product.id}
            className="flex items-center gap-3 px-4 py-2.5 bg-coral-50 border border-coral-200 rounded-luxury text-sm"
          >
            <Icon className="w-4 h-4 text-coral-500 flex-shrink-0" />
            <span className="text-coral-700">
              <span className="font-medium">{product.name}</span>
              <span className="mx-1">—</span>
              <span className={`status-badge text-xs bg-coral-100 text-coral-600`}>
                {STATUS_LABELS[product.status as keyof typeof STATUS_LABELS]}
              </span>
            </span>
            <button
              className="ml-auto text-coral-600 hover:text-coral-700 font-medium text-xs flex items-center gap-1 flex-shrink-0"
              onClick={() => navigate(exceptionRoutes[product.status] || '/')}
            >
              去处理 <ArrowRight className="w-3 h-3" />
            </button>
            <button
              className="text-charcoal-400 hover:text-charcoal-600 flex-shrink-0"
              onClick={() => setDismissed(new Set([...dismissed, product.id]))}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
      {currentExceptions.length > 3 && (
        <button
          className="text-xs text-coral-600 hover:text-coral-700 font-medium"
          onClick={() => navigate('/')}
        >
          还有 {currentExceptions.length - 3} 项异常，查看总览 →
        </button>
      )}
    </div>
  );
}
