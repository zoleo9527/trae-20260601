import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { UrgentBadge } from '@/components/StatusBadge';
import type { DailyOrder } from '@/types';

export default function ProcurementSummary() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [orders, setOrders] = useState<DailyOrder[]>([]);

  useEffect(() => {
    fetchOrders();
  }, [selectedDate]);

  const fetchOrders = async () => {
    const res = await fetch(`/api/orders?order_date=${selectedDate}`);
    const data = await res.json();
    if (data.success) setOrders(data.data);
  };

  const summaryByDish = orders.reduce((acc, order) => {
    if (!acc[order.dish_name!]) {
      acc[order.dish_name!] = {
        quantity: 0,
        urgentQuantity: 0,
        stores: new Set(),
        allergens: order.dish_allergens,
      };
    }
    acc[order.dish_name!].quantity += order.quantity;
    if (order.is_urgent) {
      acc[order.dish_name!].urgentQuantity += order.quantity;
    }
    acc[order.dish_name!].stores.add(order.store_name);
    return acc;
  }, {} as Record<string, { quantity: number; urgentQuantity: number; stores: Set<string>; allergens?: string }>);

  const summaryByStore = orders.reduce((acc, order) => {
    if (!acc[order.store_name!]) {
      acc[order.store_name!] = {
        quantity: 0,
        urgentQuantity: 0,
        dishes: [],
      };
    }
    acc[order.store_name!].quantity += order.quantity;
    if (order.is_urgent) {
      acc[order.store_name!].urgentQuantity += order.quantity;
    }
    acc[order.store_name!].dishes.push({
      name: order.dish_name,
      quantity: order.quantity,
      is_urgent: order.is_urgent,
    });
    return acc;
  }, {} as Record<string, { quantity: number; urgentQuantity: number; dishes: Array<{ name?: string; quantity: number; is_urgent: boolean }> }>);

  const totalQuantity = orders.reduce((sum, o) => sum + o.quantity, 0);
  const totalUrgentQuantity = orders.filter(o => o.is_urgent).reduce((sum, o) => sum + o.quantity, 0);

  return (
    <Layout currentRole="procurement">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">📊 报量汇总</h2>
          <input
            type="date"
            className="input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">门店数</div>
              <div className="text-3xl font-bold">{Object.keys(summaryByStore).length}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">菜品种类</div>
              <div className="text-3xl font-bold">{Object.keys(summaryByDish).length}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">总份数</div>
              <div className="text-3xl font-bold text-blue-600">{totalQuantity}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="text-sm text-gray-500">加急份数</div>
              <div className="text-3xl font-bold text-red-600">{totalUrgentQuantity}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">按菜品汇总</h3>
            </div>
            <div className="card-body">
              {Object.keys(summaryByDish).length === 0 ? (
                <div className="text-center py-4 text-gray-500">暂无数据</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>菜品</th>
                        <th>总数</th>
                        <th>加急</th>
                        <th>门店数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(summaryByDish).map(([dishName, data]) => (
                        <tr key={dishName}>
                          <td className="font-medium">{dishName}</td>
                          <td className="font-bold">{data.quantity} 份</td>
                          <td>
                            {data.urgentQuantity > 0 ? (
                              <span className="text-red-600 font-medium">{data.urgentQuantity} 份</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td>{data.stores.size} 家</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">按门店汇总</h3>
            </div>
            <div className="card-body">
              {Object.keys(summaryByStore).length === 0 ? (
                <div className="text-center py-4 text-gray-500">暂无数据</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>门店</th>
                        <th>总数</th>
                        <th>加急</th>
                        <th>菜品种类</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(summaryByStore).map(([storeName, data]) => (
                        <tr key={storeName}>
                          <td className="font-medium">{storeName}</td>
                          <td className="font-bold">{data.quantity} 份</td>
                          <td>
                            {data.urgentQuantity > 0 ? (
                              <span className="text-red-600 font-medium">{data.urgentQuantity} 份</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td>{data.dishes.length} 种</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">报单明细</h3>
          </div>
          <div className="card-body">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无报单数据</div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>门店</th>
                      <th>菜品</th>
                      <th>数量</th>
                      <th>加急</th>
                      <th>过敏原确认</th>
                      <th>特殊说明</th>
                      <th>创建人</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td className="font-medium">{order.store_name}</td>
                        <td>{order.dish_name}</td>
                        <td>{order.quantity} 份</td>
                        <td><UrgentBadge isUrgent={order.is_urgent} /></td>
                        <td className="text-sm text-gray-600">{order.allergens_confirmation}</td>
                        <td className="text-gray-500 text-sm">{order.special_instructions || '-'}</td>
                        <td className="text-sm">{order.created_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
