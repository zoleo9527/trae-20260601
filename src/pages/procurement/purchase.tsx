import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import type { DailyOrder, Dish } from '@/types';

const purchaseItems = [
  { name: '五花肉', unit: 'kg', dishes: ['红烧肉', '糖醋排骨'] },
  { name: '鸡胸肉', unit: 'kg', dishes: ['宫保鸡丁'] },
  { name: '鲈鱼', unit: '条', dishes: ['清蒸鲈鱼'] },
  { name: '豆腐', unit: '盒', dishes: ['麻婆豆腐'] },
  { name: '西兰花', unit: 'kg', dishes: ['蒜蓉西兰花'] },
  { name: '西红柿', unit: 'kg', dishes: ['西红柿炒鸡蛋'] },
  { name: '鸡蛋', unit: '个', dishes: ['西红柿炒鸡蛋', '紫菜蛋花汤'] },
  { name: '大米', unit: 'kg', dishes: ['米饭'] },
  { name: '紫菜', unit: '包', dishes: ['紫菜蛋花汤'] },
  { name: '木耳', unit: '包', dishes: ['酸辣汤'] },
];

export default function ProcurementPurchase() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [orders, setOrders] = useState<DailyOrder[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);

  useEffect(() => {
    fetchOrders();
    fetchDishes();
  }, [selectedDate]);

  const fetchOrders = async () => {
    const res = await fetch(`/api/orders?order_date=${selectedDate}`);
    const data = await res.json();
    if (data.success) setOrders(data.data);
  };

  const fetchDishes = async () => {
    const res = await fetch('/api/dishes');
    const data = await res.json();
    if (data.success) setDishes(data.data);
  };

  const getDishQuantity = (dishName: string) => {
    return orders
      .filter(o => o.dish_name === dishName)
      .reduce((sum, o) => sum + o.quantity, 0);
  };

  const calculatePurchase = () => {
    return purchaseItems.map(item => {
      let totalQuantity = 0;
      item.dishes.forEach(dishName => {
        const dishQty = getDishQuantity(dishName);
        const dish = dishes.find(d => d.name === dishName);
        let multiplier = 0.3;
        if (dish?.specification) {
          const match = dish.specification.match(/(\d+)/);
          if (match) {
            multiplier = parseInt(match[1]) / 1000;
          }
        }
        totalQuantity += dishQty * multiplier;
      });
      return {
        ...item,
        required: Math.ceil(totalQuantity * 1.1),
        usedBy: item.dishes.filter(d => getDishQuantity(d) > 0),
      };
    }).filter(item => item.required > 0);
  };

  const purchaseList = calculatePurchase();

  return (
    <Layout currentRole="procurement">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">📋 采购清单</h2>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              className="input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={() => window.print()}
            >
              打印清单
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">
              {selectedDate} 原材料采购清单
            </h3>
          </div>
          <div className="card-body">
            {purchaseList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                该日期暂无报单，无法生成采购清单
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>序号</th>
                      <th>原材料名称</th>
                      <th>单位</th>
                      <th>预估需求量</th>
                      <th>用于菜品</th>
                      <th>备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseList.map((item, index) => (
                      <tr key={item.name}>
                        <td>{index + 1}</td>
                        <td className="font-medium">{item.name}</td>
                        <td>{item.unit}</td>
                        <td className="font-bold text-lg">{item.required}</td>
                        <td className="text-sm text-gray-600">
                          {item.usedBy.join('、')}
                        </td>
                        <td className="text-gray-400">含10%损耗</td>
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
            <h3 className="text-lg font-semibold">参考菜品用量</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {dishes.map(dish => {
                const qty = getDishQuantity(dish.name);
                if (qty === 0) return null;
                return (
                  <div key={dish.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium">{dish.name}</div>
                    <div className="text-sm text-gray-600">{dish.specification}</div>
                    <div className="text-lg font-bold text-blue-600 mt-1">{qty} 份</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
