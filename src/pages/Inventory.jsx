import { useEffect, useState } from 'react';
import { useStore } from '../stores/appStore';
import { AlertTriangle, TrendingUp, Package } from 'lucide-react';

export default function Inventory() {
  const { inventory, fetchInventory, updateInventory, loading, getSeasonalSuggestion } = useStore();
  const { currentUser } = useStore();

  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState(null);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    fetchInventory();
    loadSuggestion();
  }, []);

  const loadSuggestion = async () => {
    const data = await getSeasonalSuggestion();
    setSuggestion(data);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditQuantity(item.quantity);
  };

  const handleSave = async (id) => {
    try {
      await updateInventory(id, { quantity: editQuantity });
      setEditingId(null);
      setEditQuantity(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const lowStockItems = inventory.filter(i => i.quantity <= i.warning_threshold);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">库存管理</h1>
      </div>

      {/* Warnings */}
      {lowStockItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-orange-800">库存预警</p>
              <p className="text-sm text-orange-600 mt-1">
                以下 {lowStockItems.length} 种农药库存不足，请及时补货：
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {lowStockItems.map((item) => (
                  <span
                    key={item.id}
                    className="px-3 py-1 bg-white border border-orange-200 rounded-full text-sm"
                  >
                    {item.pesticide_name}: {item.quantity} {item.unit}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seasonal Suggestion */}
      {suggestion && (
        <div className="bg-gradient-to-r from-primary-light to-primary rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={24} />
            <div>
              <p className="font-bold text-lg">季节备货建议</p>
              <p className="text-sm opacity-80">
                {suggestion.season === 'spring' && '春季'}
                {suggestion.season === 'summer' && '夏季'}
                {suggestion.season === 'autumn' && '秋季'}
                {suggestion.season === 'winter' && '冬季'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {suggestion.suggestions.slice(0, 3).map((item) => (
              <div key={item.pesticideId} className="bg-white/20 rounded-lg p-4">
                <p className="font-medium">{item.pesticideName}</p>
                <p className="text-sm opacity-80 mt-1">
                  月均销售：{item.avgMonthly} {item.unit || '件'}
                </p>
                <p className="text-sm opacity-80">
                  当前库存：{item.currentStock}
                </p>
                <p className={`text-sm mt-2 font-medium ${
                  item.action === '补货' ? 'text-yellow-200' :
                  item.action === '观察' ? 'text-orange-200' : 'text-green-200'
                }`}>
                  建议：{item.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">农药名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">当前库存</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">预警阈值</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {inventory.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                  暂无库存数据
                </td>
              </tr>
            ) : (
              inventory.map((item) => {
                const isLow = item.quantity <= item.warning_threshold;
                const isEmpty = item.quantity === 0;

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Package className="text-gray-400" size={20} />
                        <span className="font-medium text-gray-800">{item.pesticide_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.pesticide_type === '常规' ? 'bg-green-100 text-green-700' :
                        item.pesticide_type === '限用' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.pesticide_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-gray-500">{item.unit}</span>
                        </div>
                      ) : (
                        <span className={`font-medium ${
                          isEmpty ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-gray-800'
                        }`}>
                          {item.quantity} {item.unit}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.warning_threshold} {item.unit}
                    </td>
                    <td className="px-6 py-4">
                      {isEmpty ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">缺货</span>
                      ) : isLow ? (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">库存不足</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">正常</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSave(item.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-3 py-1 text-primary hover:bg-primary-light hover:text-white rounded text-sm transition-colors"
                        >
                          调整库存
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
