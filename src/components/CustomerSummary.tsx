import { useState } from 'react';
import { STATUS_LABELS, type Product } from '@/types';
import { formatCurrency, formatDate, maskPhone } from '@/utils/format';
import { Copy, Check, Share2, Eye } from 'lucide-react';

interface CustomerSummaryProps {
  product: Product;
}

export default function CustomerSummary({ product }: CustomerSummaryProps) {
  const [copied, setCopied] = useState(false);

  const visibleLogs = product.statusLogs
    .filter((log) => log.visibleToCustomer)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const generateSummaryText = () => {
    const latestLog = visibleLogs[0];
    const lines = [
      `【奢品寄卖进度通知】`,
      ``,
      `商品编号：${product.id}`,
      `商品名称：${product.name}`,
      `品牌型号：${product.brand} ${product.model}`,
      `当前状态：${STATUS_LABELS[product.status]}`,
      ``,
    ];

    if (latestLog) {
      lines.push(`最新进展：${latestLog.description}`);
      lines.push(`更新时间：${formatDate(latestLog.timestamp)}`);
      lines.push(``);
    }

    if (product.currentPrice > 0) {
      lines.push(`寄卖售价：${formatCurrency(product.currentPrice)}`);
      lines.push(``);
    }

    if (product.settlement) {
      if (product.status === 'SETTLED') {
        lines.push(`💰 结算已完成`);
        lines.push(`成交金额：${formatCurrency(product.settlement.salePrice)}`);
        lines.push(`佣金（${(product.settlement.commissionRate * 100).toFixed(0)}%）：${formatCurrency(product.settlement.commission)}`);
        lines.push(`结算金额：${formatCurrency(product.settlement.settlementAmount)}`);
        lines.push(`打款时间：${product.settlement.confirmedAt ? formatDate(product.settlement.confirmedAt) : '待确认'}`);
      } else if (product.status === 'SOLD' || product.status === 'PENDING_SETTLEMENT') {
        lines.push(`✅ 商品已售出`);
        lines.push(`成交金额：${formatCurrency(product.settlement.salePrice)}`);
        lines.push(`预计结算（扣除12%佣金后）：${formatCurrency(product.settlement.settlementAmount)}`);
        lines.push(`结算进度：财务审核中，预计3个工作日内完成`);
      }
    }

    lines.push(``);
    lines.push(`--- 历史进度 ---`);
    visibleLogs.slice(0, 5).forEach((log) => {
      lines.push(`${formatDate(log.timestamp)} ${STATUS_LABELS[log.status]}：${log.description}`);
    });

    lines.push(``);
    lines.push(`如有疑问，请联系客服：400-888-8888`);

    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateSummaryText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败', err);
    }
  };

  return (
    <div className="card p-6 bg-gradient-to-br from-ivory-50 to-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-champagne-600" />
          <h3 className="font-display text-lg font-semibold text-luxury-800">客户可见进度摘要</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-champagne-100 text-luxury-800 rounded-luxury hover:bg-champagne-200 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? '已复制' : '一键复制'}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-luxury-800 text-luxury-800 rounded-luxury hover:bg-luxury-800 hover:text-white transition-colors">
            <Share2 className="w-4 h-4" />
            分享
          </button>
        </div>
      </div>

      <div className="bg-white border border-ivory-200 rounded-luxury p-5">
        <div className="mb-4 pb-4 border-b border-ivory-200">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs text-charcoal-500 mb-1">商品编号</p>
              <p className="font-mono text-luxury-800">{product.id}</p>
            </div>
            <span className={`status-badge ${product.status === 'SETTLED' ? 'bg-luxury-800 text-white' : 'bg-jade-100 text-jade-600'}`}>
              {STATUS_LABELS[product.status]}
            </span>
          </div>
          <h4 className="font-display font-semibold text-luxury-800 text-lg">{product.name}</h4>
          <p className="text-sm text-charcoal-600">{product.brand} · {product.model}</p>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-charcoal-500">客户姓名</span>
            <span className="text-charcoal-800">{product.customer.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-charcoal-500">联系电话</span>
            <span className="text-charcoal-800">{maskPhone(product.customer.phone)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-charcoal-500">收货日期</span>
            <span className="text-charcoal-800">{formatDate(product.receivedAt)}</span>
          </div>
          {product.currentPrice > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-charcoal-500">寄卖售价</span>
              <span className="text-champagne-600 font-semibold">{formatCurrency(product.currentPrice)}</span>
            </div>
          )}
        </div>

        {product.settlement && (
          <div className={`p-4 rounded-luxury mb-4 ${product.status === 'SETTLED' ? 'bg-jade-50 border border-jade-200' : 'bg-champagne-50 border border-champagne-200'}`}>
            <p className={`text-sm font-medium mb-2 ${product.status === 'SETTLED' ? 'text-jade-700' : 'text-champagne-700'}`}>
              {product.status === 'SETTLED' ? '✅ 结算已完成' : '⏳ 待结算'}
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-charcoal-500">成交价：</span>
                <span className="text-charcoal-800">{formatCurrency(product.settlement.salePrice)}</span>
              </div>
              <div>
                <span className="text-charcoal-500">佣金：</span>
                <span className="text-charcoal-800">{formatCurrency(product.settlement.commission)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-charcoal-500">结算金额：</span>
                <span className="text-luxury-800 font-semibold">{formatCurrency(product.settlement.settlementAmount)}</span>
              </div>
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-charcoal-700 mb-2">进度更新</p>
          <div className="space-y-2">
            {visibleLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex gap-3 text-sm">
                <span className="text-charcoal-400 whitespace-nowrap">{formatDate(log.timestamp)}</span>
                <span className="text-charcoal-700">{log.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
