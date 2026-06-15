import { useState, useEffect } from 'react';
import { Table, Tag, Button, Tooltip } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { api } from '@/api/mockApi';
import type { Order } from '@/types';
import { ORDER_STATUS_MAP, ORDER_STATUS_COLORS, LOCK_STATUS_MAP, LOCK_STATUS_COLORS } from '@/types';

interface OrderListProps {
  onSelect: (order: Order) => void;
  selectedId: string | undefined;
}

export function OrderList({ onSelect, selectedId }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.orders.list();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnType<Order>[] = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 120 },
    { title: '客户', dataIndex: 'customerName', key: 'customerName', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => (
      <Tag color={ORDER_STATUS_COLORS[s as keyof typeof ORDER_STATUS_COLORS]}>
        {ORDER_STATUS_MAP[s as keyof typeof ORDER_STATUS_MAP]}
      </Tag>
    )},
    { title: '锁货', dataIndex: 'lockStatus', key: 'lockStatus', width: 80, render: (s: string) => (
      <Tag color={LOCK_STATUS_COLORS[s as keyof typeof LOCK_STATUS_COLORS]}>
        {LOCK_STATUS_MAP[s as keyof typeof LOCK_STATUS_MAP]}
      </Tag>
    )},
    { title: '操作', key: 'actions', width: 80, render: (_, record) => (
      <Tooltip title="查看详情">
        <Button type="link" onClick={() => onSelect(record)}>查看</Button>
      </Tooltip>
    )},
  ];

  return (
    <Table
      dataSource={orders}
      columns={columns}
      loading={loading}
      rowKey="id"
      rowSelection={{
        type: 'radio',
        selectedRowKeys: selectedId ? [selectedId] : [],
        onChange: (keys) => {
          const order = orders.find(o => o.id === keys[0]);
          if (order) onSelect(order);
        },
      }}
      pagination={{ pageSize: 10 }}
    />
  );
}
