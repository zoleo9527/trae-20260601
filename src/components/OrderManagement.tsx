import { useState } from 'react';
import { Row, Col } from 'antd';
import type { Order } from '@/types';
import { OrderList } from './OrderList';
import { OrderDetail } from './OrderDetail';

export function OrderManagement() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setSelectedOrder(null);
  };

  return (
    <Row gutter={16}>
      <Col span={14}>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">订单列表</h2>
          </div>
          <OrderList 
            key={refreshKey}
            onSelect={setSelectedOrder} 
            selectedId={selectedOrder?.id}
          />
        </div>
      </Col>
      <Col span={10}>
        <div className="bg-white rounded-lg shadow-sm p-4 h-[calc(100vh-180px)] overflow-y-auto">
          <OrderDetail order={selectedOrder} onRefresh={handleRefresh} />
        </div>
      </Col>
    </Row>
  );
}