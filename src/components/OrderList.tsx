import Link from 'next/link';
import type { RecyclingOrderStatus } from '@/types/models';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  URGENCY_LABELS,
} from '@/types/stateMachine';
import { formatDateTime, formatTimeAgo, formatPrice } from '@/utils/api';

interface OrderListItem {
  id: string;
  orderNo: string;
  status: RecyclingOrderStatus;
  customerName: string;
  customerPhone: string;
  device: {
    category: string;
    brand: string;
    model: string;
    condition: string;
  };
  urgency: string;
  source: string;
  currentPrice?: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

interface OrderListProps {
  orders: OrderListItem[];
  role: string;
}

const CONDITION_LABELS: Record<string, string> = {
  NEW: '全新',
  LIKE_NEW: '准新',
  GOOD: '良好',
  FAIR: '一般',
  POOR: '较差',
  BROKEN: '故障',
};

const URGENCY_COLORS: Record<string, string> = {
  NORMAL: '#10b981',
  URGENT: '#f59e0b',
  EMERGENCY: '#ef4444',
};

export default function OrderList({ orders, role }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>📭</div>
        <div style={styles.emptyText}>暂无订单</div>
      </div>
    );
  }

  return (
    <div style={styles.list}>
      {orders.map((order) => (
        <Link
          key={order.id}
          href={
            role === 'PROCESSOR'
              ? `/processor/valuation/${order.id}`
              : role === 'MANAGER'
              ? `/manager/order/${order.id}`
              : `/receptionist/confirm/${order.id}`
          }
          style={styles.card}
        >
          <div style={styles.cardHeader}>
            <div style={styles.left}>
              <span style={styles.orderNo}>{order.orderNo}</span>
              <span
                style={{
                  ...styles.statusBadge,
                  background: STATUS_COLORS[order.status] + '20',
                  color: STATUS_COLORS[order.status],
                }}
              >
                {STATUS_LABELS[order.status]}
              </span>
              {order.urgency !== 'NORMAL' && (
                <span
                  style={{
                    ...styles.urgencyBadge,
                    background: URGENCY_COLORS[order.urgency] + '20',
                    color: URGENCY_COLORS[order.urgency],
                  }}
                >
                  ⚡ {URGENCY_LABELS[order.urgency]}
                </span>
              )}
            </div>
            <div style={styles.right}>
              {order.currentPrice && (
                <span style={styles.price}>
                  {formatPrice(order.currentPrice)}
                </span>
              )}
              <span style={styles.time}>{formatTimeAgo(order.updatedAt)}</span>
            </div>
          </div>

          <div style={styles.cardBody}>
            <div style={styles.row}>
              <span style={styles.label}>客户</span>
              <span style={styles.value}>
                {order.customerName} ({order.customerPhone})
              </span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>设备</span>
              <span style={styles.value}>
                {order.device.brand} {order.device.model} ·{' '}
                {CONDITION_LABELS[order.device.condition] ||
                  order.device.condition}
              </span>
            </div>
            {order.tags.length > 0 && (
              <div style={styles.tags}>
                {order.tags.map((tag, i) => (
                  <span key={i} style={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={styles.cardFooter}>
            <span style={styles.createTime}>
              创建于 {formatDateTime(order.createdAt)}
            </span>
            <span style={styles.viewDetail}>查看详情 →</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '18px',
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.2s',
    border: '1px solid #e5e7eb',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  orderNo: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
  },
  urgencyBadge: {
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    animation: 'pulse 2s infinite',
  },
  price: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#059669',
  },
  time: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  cardBody: {
    marginBottom: '12px',
  },
  row: {
    display: 'flex',
    marginBottom: '6px',
    fontSize: '14px',
  },
  label: {
    width: '60px',
    color: '#6b7280',
    flexShrink: 0,
  },
  value: {
    color: '#1f2937',
    flex: 1,
  },
  tags: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  tag: {
    padding: '2px 8px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '6px',
    fontSize: '12px',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  createTime: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  viewDetail: {
    fontSize: '13px',
    color: '#2563eb',
    fontWeight: '500',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#9ca3af',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '14px',
  },
};
