import { useNavigate } from 'react-router-dom';
import { STATUS_LABELS, STATUS_COLORS, type Product } from '@/types';
import { formatCurrency, formatRelativeTime, maskPhone } from '@/utils/format';
import { AlertTriangle, FileWarning, Clock, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  showActions?: boolean;
  onAction?: (action: string) => void;
}

export default function ProductCard({ product, showActions = true, onAction }: ProductCardProps) {
  const navigate = useNavigate();

  const getStatusAccent = () => {
    if (product.status === 'MISSING_DOCS' || product.status === 'APPRAISAL_DISPUTE' || product.status === 'CUSTOMER_WITHDRAW') {
      return 'border-l-coral-500';
    }
    if (product.status === 'PENDING_APPRAISAL' || product.status === 'PENDING_LISTING' || product.status === 'PENDING_SETTLEMENT' || product.status === 'PRICE_CHANGING') {
      return 'border-l-champagne-500';
    }
    if (product.status === 'SETTLED' || product.status === 'APPRAISAL_PASSED' || product.status === 'LISTED' || product.status === 'SOLD') {
      return 'border-l-jade-500';
    }
    return 'border-l-charcoal-500';
  };

  const getPriorityBadge = () => {
    if (product.priority === 'high') {
      return <span className="status-badge bg-coral-100 text-coral-600">紧急</span>;
    }
    if (product.priority === 'medium') {
      return <span className="status-badge bg-champagne-100 text-champagne-700">普通</span>;
    }
    return null;
  };

  const getActionButton = () => {
    switch (product.status) {
      case 'MISSING_DOCS':
        return <button className="btn-primary text-sm" onClick={() => onAction?.('mark_docs')}>标记资料已补</button>;
      case 'PENDING_APPRAISAL':
        return <button className="btn-secondary text-sm" onClick={() => onAction?.('start_appraisal')}>开始鉴定</button>;
      case 'APPRAISAL_DISPUTE':
        return <button className="btn-danger text-sm" onClick={() => onAction?.('resolve_dispute')}>复核处理</button>;
      case 'APPRAISAL_PASSED':
      case 'PENDING_LISTING':
        return <button className="btn-primary text-sm" onClick={() => onAction?.('list')}>上架销售</button>;
      case 'PRICE_CHANGING':
        return <button className="btn-primary text-sm" onClick={() => onAction?.('approve_price')}>审批改价</button>;
      case 'CUSTOMER_WITHDRAW':
        return <button className="btn-outline text-sm" onClick={() => onAction?.('process_return')}>处理退回</button>;
      case 'SOLD':
      case 'PENDING_SETTLEMENT':
        return <button className="btn-secondary text-sm" onClick={() => onAction?.('confirm_settlement')}>确认结算</button>;
      default:
        return null;
    }
  };

  return (
    <div
      className={`card p-4 border-l-4 ${getStatusAccent()} animate-slide-up cursor-pointer hover:shadow-luxury`}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="flex gap-4">
        <div className="w-20 h-20 flex-shrink-0 rounded-luxury overflow-hidden bg-ivory-100">
          {product.images[0] && (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-luxury-800 truncate">{product.name}</h3>
              <p className="text-xs text-charcoal-500">{product.brand} · {product.model}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {getPriorityBadge()}
              <span className={`status-badge ${STATUS_COLORS[product.status]}`}>
                {STATUS_LABELS[product.status]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-charcoal-600 mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatRelativeTime(product.receivedAt)}
            </span>
            <span>客户：{product.customer.name}</span>
            <span className="text-charcoal-500">{maskPhone(product.customer.phone)}</span>
          </div>

          {product.status === 'MISSING_DOCS' && product.documents.missingNotes && (
            <div className="flex items-start gap-2 mb-3 p-2 bg-coral-50 rounded-luxury text-xs text-coral-600">
              <FileWarning className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{product.documents.missingNotes}</span>
            </div>
          )}

          {product.status === 'APPRAISAL_DISPUTE' && product.disputeReason && (
            <div className="flex items-start gap-2 mb-3 p-2 bg-coral-50 rounded-luxury text-xs text-coral-600">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{product.disputeReason}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-charcoal-500">售价：</span>
              <span className="font-semibold text-luxury-800">{formatCurrency(product.currentPrice)}</span>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                className="p-2 text-charcoal-500 hover:text-luxury-800 hover:bg-ivory-100 rounded-luxury transition-colors"
                title="查看详情"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <Eye className="w-4 h-4" />
              </button>
              {showActions && getActionButton()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
