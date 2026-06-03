import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { StatusBadge, UrgentBadge, AllergenBadge } from '@/components/StatusBadge';
import type { Store, Dish, DailyOrder } from '@/types';

export default function SupervisorOrders() {
  const [stores, setStores] = useState<Store[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<DailyOrder[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | ''>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderItems, setOrderItems] = useState<Array<{
    dish_id: number;
    quantity: number;
    is_urgent: boolean;
    allergens_confirmation: string;
    special_instructions: string;
  }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStores();
    fetchDishes();
  }, []);

  useEffect(() => {
    if (selectedStore && selectedDate) {
      fetchOrders();
    }
  }, [selectedStore, selectedDate]);

  const fetchStores = async () => {
    const res = await fetch('/api/stores');
    const data = await res.json();
    if (data.success) setStores(data.data);
  };

  const fetchDishes = async () => {
    const res = await fetch('/api/dishes');
    const data = await res.json();
    if (data.success) setDishes(data.data);
  };

  const fetchOrders = async () => {
    const res = await fetch(`/api/orders?order_date=${selectedDate}&store_id=${selectedStore}`);
    const data = await res.json();
    if (data.success) setOrders(data.data);
  };

  const addOrderItem = (dish: Dish) => {
    const exists = orderItems.find(item => item.dish_id === dish.id);
    if (exists) return;

    setOrderItems([...orderItems, {
      dish_id: dish.id,
      quantity: 1,
      is_urgent: false,
      allergens_confirmation: dish.allergens === '无' ? '确认无过敏原' : `已确认含${dish.allergens}`,
      special_instructions: '',
    }]);
  };

  const updateOrderItem = (dishId: number, field: string, value: any) => {
    setOrderItems(orderItems.map(item =>
      item.dish_id === dishId ? { ...item, [field]: value } : item
    ));
  };

  const removeOrderItem = (dishId: number) => {
    setOrderItems(orderItems.filter(item => item.dish_id !== dishId));
  };

  const submitOrders = async () => {
    if (!selectedStore || orderItems.length === 0) return;
    
    const hasUnconfirmed = orderItems.some(item => !item.allergens_confirmation);
    if (hasUnconfirmed) {
      alert('请确认所有菜品的过敏原信息');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/orders/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_date: selectedDate,
        store_id: selectedStore,
        items: orderItems,
        created_by: '门店督导',
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      alert('报单提交成功！');
      setOrderItems([]);
      fetchOrders();
    } else {
      alert(data.error || '提交失败');
    }
  };

  return (
    <Layout currentRole="supervisor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">📝 菜品报量录入</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">选择门店和日期</h3>
          </div>
          <div className="card-body">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">门店</label>
                <select
                  className="select w-48"
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">请选择门店</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input
                  type="date"
                  className="input w-48"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {selectedStore && (
          <>
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">选择菜品</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {dishes.map(dish => {
                    const isSelected = orderItems.some(item => item.dish_id === dish.id);
                    return (
                      <button
                        key={dish.id}
                        onClick={() => addOrderItem(dish)}
                        disabled={isSelected}
                        className={`p-3 rounded-lg border-2 text-left transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-medium">{dish.name}</div>
                        <div className="text-xs text-gray-500">{dish.category} · {dish.specification}</div>
                        {dish.allergens !== '无' && (
                          <div className="mt-1">
                            <AllergenBadge allergens={dish.allergens} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {orderItems.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">已选菜品</h3>
                </div>
                <div className="card-body">
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>菜品</th>
                          <th>过敏原</th>
                          <th>数量</th>
                          <th>加急</th>
                          <th>过敏原确认</th>
                          <th>特殊说明</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map(item => {
                          const dish = dishes.find(d => d.id === item.dish_id);
                          return (
                            <tr key={item.dish_id}>
                              <td className="font-medium">{dish?.name}</td>
                              <td><AllergenBadge allergens={dish?.allergens || '无'} /></td>
                              <td>
                                <input
                                  type="number"
                                  min="1"
                                  className="input w-20"
                                  value={item.quantity}
                                  onChange={(e) => updateOrderItem(item.dish_id, 'quantity', parseInt(e.target.value) || 1)}
                                />
                              </td>
                              <td>
                                <input
                                  type="checkbox"
                                  className="checkbox"
                                  checked={item.is_urgent}
                                  onChange={(e) => updateOrderItem(item.dish_id, 'is_urgent', e.target.checked)}
                                />
                              </td>
                              <td>
                                <select
                                  className="select w-40"
                                  value={item.allergens_confirmation}
                                  onChange={(e) => updateOrderItem(item.dish_id, 'allergens_confirmation', e.target.value)}
                                >
                                  <option value="">请确认</option>
                                  <option value="确认无过敏原">确认无过敏原</option>
                                  <option value={`已确认含${dish?.allergens}`}>已确认含{dish?.allergens}</option>
                                  <option value="客户知悉过敏原">客户知悉过敏原</option>
                                </select>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="input w-32"
                                  placeholder="特殊要求"
                                  value={item.special_instructions}
                                  onChange={(e) => updateOrderItem(item.dish_id, 'special_instructions', e.target.value)}
                                />
                              </td>
                              <td>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => removeOrderItem(item.dish_id)}
                                >
                                  删除
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      className="btn btn-primary"
                      onClick={submitOrders}
                      disabled={loading}
                    >
                      {loading ? '提交中...' : '提交报单'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {orders.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">今日已报</h3>
                </div>
                <div className="card-body">
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>菜品</th>
                          <th>数量</th>
                          <th>状态</th>
                          <th>加急</th>
                          <th>过敏原</th>
                          <th>特殊说明</th>
                          <th>创建时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id}>
                            <td className="font-medium">{order.dish_name}</td>
                            <td>{order.quantity} 份</td>
                            <td><StatusBadge status={order.status} /></td>
                            <td><UrgentBadge isUrgent={order.is_urgent} /></td>
                            <td><AllergenBadge allergens={order.dish_allergens || ''} /></td>
                            <td className="text-gray-500">{order.special_instructions || '-'}</td>
                            <td className="text-gray-500 text-sm">{order.created_at}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
