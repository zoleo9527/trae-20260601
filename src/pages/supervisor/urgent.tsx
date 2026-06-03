import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { StatusBadge, UrgentBadge, AllergenBadge } from '@/components/StatusBadge';
import type { Store, Dish, DailyOrder } from '@/types';

export default function SupervisorUrgent() {
  const [stores, setStores] = useState<Store[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [urgentOrders, setUrgentOrders] = useState<DailyOrder[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | ''>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDish, setSelectedDish] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [allergensConfirmation, setAllergensConfirmation] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStores();
    fetchDishes();
    fetchUrgentOrders();
  }, []);

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

  const fetchUrgentOrders = async () => {
    const res = await fetch(`/api/orders?is_urgent=true&order_date=${selectedDate}`);
    const data = await res.json();
    if (data.success) setUrgentOrders(data.data);
  };

  const handleDishChange = (dishId: number) => {
    setSelectedDish(dishId);
    const dish = dishes.find(d => d.id === dishId);
    if (dish) {
      setAllergensConfirmation(dish.allergens === '无' ? '确认无过敏原' : `已确认含${dish.allergens}`);
    }
  };

  const submitUrgentOrder = async () => {
    if (!selectedStore || !selectedDish || !quantity || !allergensConfirmation) {
      alert('请填写完整信息');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_date: selectedDate,
        store_id: selectedStore,
        dish_id: selectedDish,
        quantity,
        is_urgent: true,
        allergens_confirmation: allergensConfirmation,
        special_instructions: specialInstructions,
        created_by: '门店督导',
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      alert('临时加单提交成功！');
      setSelectedDish('');
      setQuantity(1);
      setAllergensConfirmation('');
      setSpecialInstructions('');
      fetchUrgentOrders();
    } else {
      alert(data.error || '提交失败');
    }
  };

  const cancelOrder = async (orderId: number) => {
    if (!confirm('确定要取消此加急单吗？')) return;

    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator: '门店督导' }),
    });

    const data = await res.json();
    if (data.success) {
      fetchUrgentOrders();
    } else {
      alert(data.error || '取消失败');
    }
  };

  return (
    <Layout currentRole="supervisor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">⚡ 临时加单</h2>
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
            ⚠️ 加急单将优先安排生产，请谨慎使用
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">新增加急单</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">门店 *</label>
                <select
                  className="select w-full"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">日期 *</label>
                <input
                  type="date"
                  className="input w-full"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">菜品 *</label>
                <select
                  className="select w-full"
                  value={selectedDish}
                  onChange={(e) => handleDishChange(Number(e.target.value))}
                >
                  <option value="">请选择菜品</option>
                  {dishes.map(dish => (
                    <option key={dish.id} value={dish.id}>{dish.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">数量 *</label>
                <input
                  type="number"
                  min="1"
                  className="input w-full"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">过敏原确认 *</label>
                <select
                  className="select w-full"
                  value={allergensConfirmation}
                  onChange={(e) => setAllergensConfirmation(e.target.value)}
                >
                  <option value="">请确认</option>
                  <option value="确认无过敏原">确认无过敏原</option>
                  <option value="客户知悉过敏原">客户知悉过敏原</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">特殊说明</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="如：少盐、不要辣等"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="btn btn-primary"
                onClick={submitUrgentOrder}
                disabled={loading}
              >
                {loading ? '提交中...' : '提交加急单'}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">今日加急单</h3>
          </div>
          <div className="card-body">
            {urgentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                今日暂无加急单
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>门店</th>
                      <th>菜品</th>
                      <th>数量</th>
                      <th>状态</th>
                      <th>过敏原</th>
                      <th>特殊说明</th>
                      <th>创建人</th>
                      <th>创建时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urgentOrders.map(order => (
                      <tr key={order.id}>
                        <td className="font-medium">{order.store_name}</td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <span>{order.dish_name}</span>
                            <UrgentBadge isUrgent={order.is_urgent} />
                          </div>
                        </td>
                        <td>{order.quantity} 份</td>
                        <td><StatusBadge status={order.status} /></td>
                        <td><AllergenBadge allergens={order.dish_allergens || ''} /></td>
                        <td className="text-gray-500 text-sm">{order.special_instructions || '-'}</td>
                        <td className="text-sm">{order.created_by}</td>
                        <td className="text-gray-500 text-sm">{order.created_at}</td>
                        <td>
                          {order.status === 'pending' && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => cancelOrder(order.id)}
                            >
                              取消
                            </button>
                          )}
                        </td>
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
