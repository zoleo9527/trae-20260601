import { useState } from 'react';
import { Package, ChefHat, Utensils, Check, AlertTriangle } from 'lucide-react';
import type { MaterialItem } from '@shared/types';
import { MaterialStatusBadge } from './Badges';
import { useAppStore } from '@/store/useAppStore';

interface MaterialListProps {
  materials: MaterialItem[];
  banquetId: string;
  version: number;
  showKitchen?: boolean;
}

export default function MaterialList({ materials, banquetId, version, showKitchen = true }: MaterialListProps) {
  const { currentRole, confirmBanquet } = useAppStore();
  const isKitchenRole = currentRole === 'kitchen_manager';
  const [activeTab, setActiveTab] = useState<'all' | 'hall' | 'kitchen'>(isKitchenRole ? 'kitchen' : 'all');
  const [localChecked, setLocalChecked] = useState<Record<string, boolean>>({});

  const visibleMaterials = isKitchenRole
    ? materials.filter(m => m.category === 'kitchen' || m.category === 'both')
    : materials;

  const filteredMaterials = visibleMaterials.filter(m => {
    if (activeTab === 'all') return true;
    if (activeTab === 'hall') return m.category === 'hall' || m.category === 'both';
    if (activeTab === 'kitchen') return m.category === 'kitchen' || m.category === 'both';
    return true;
  });

  const hallMaterials = visibleMaterials.filter(m => m.category === 'hall' || m.category === 'both');
  const kitchenMaterials = visibleMaterials.filter(m => m.category === 'kitchen' || m.category === 'both');
  const shortageItems = visibleMaterials.filter(m => m.status === 'shortage');

  const handleConfirm = async () => {
    const role = currentRole === 'hall_manager' ? 'hall_manager' : currentRole === 'kitchen_manager' ? 'kitchen_manager' : 'sales';
    await confirmBanquet(banquetId, {
      version,
      role,
      confirmer: role === 'hall_manager' ? '厅面主管' : role === 'kitchen_manager' ? '后厨主管' : '销售经理',
      remark: isKitchenRole ? '备餐物资已确认' : '物资清单已确认',
      confirmItem: 'materials',
    });
  };

  type TabKey = 'all' | 'hall' | 'kitchen';
  const tabs: Array<{ key: TabKey; label: string; icon: typeof Package; count: number }> = [
    { key: 'all', label: '全部', icon: Package, count: visibleMaterials.length },
    ...(isKitchenRole ? [] : [{ key: 'hall' as TabKey, label: '厅面物资', icon: Utensils, count: hallMaterials.length }]),
    { key: 'kitchen' as TabKey, label: isKitchenRole ? '备餐物资' : '后厨物资', icon: ChefHat, count: kitchenMaterials.length },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border border-champagne-100 overflow-hidden">
      <div className="bg-gradient-to-r from-champagne-50 to-wine-50 px-5 py-4 border-b border-champagne-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="text-wine-700" size={22} />
            <div>
              <h3 className="font-display text-lg font-semibold text-gray-800">物资清单</h3>
              <p className="text-xs text-gray-500">共 {visibleMaterials.length} 项物资{isKitchenRole ? '（仅显示备餐相关）' : ''}</p>
            </div>
          </div>
          {shortageItems.length > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-full">
              <AlertTriangle size={14} />
              <span className="text-xs font-medium">{shortageItems.length} 项缺货</span>
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-gray-100">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-wine-600 text-wine-700 bg-wine-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p>暂无物资数据</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredMaterials.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 px-5 py-3 hover:bg-champagne-50/30 transition-colors stagger-item`}
                style={{ animationDelay: `${index * 0.03}s`, transform: 'translateY(10px)' }}
              >
                <input
                  type="checkbox"
                  checked={localChecked[item.id] || item.status === 'confirmed' || item.status === 'prepared'}
                  onChange={(e) => setLocalChecked(prev => ({ ...prev, [item.id]: e.target.checked }))}
                  disabled={item.status === 'confirmed' || item.status === 'prepared'}
                  className="w-4 h-4 text-wine-600 rounded focus:ring-wine-500"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{item.name}</span>
                    {item.scope === 'both' && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">双部门</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-500">
                      数量: <span className="font-semibold text-wine-700">{item.quantity}</span> {item.unit}
                    </span>
                    {item.note && (
                      <span className="text-xs text-gray-400">备注: {item.note}</span>
                    )}
                  </div>
                </div>

                <MaterialStatusBadge status={item.status} />

                {(item.status === 'shortage' || (item.scope === 'kitchen' && currentRole === 'kitchen_manager')) && (
                  <div className={`w-2 h-2 rounded-full ${item.status === 'shortage' ? 'bg-red-500 animate-pulse' : 'bg-forest-500'}`}></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            已确认 {visibleMaterials.filter(m => m.status === 'confirmed' || m.status === 'prepared').length}/{visibleMaterials.length} 项
          </div>
          {(currentRole === 'hall_manager' || currentRole === 'kitchen_manager' || currentRole === 'sales') && (
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-forest-600 to-forest-700 text-white rounded-lg hover:from-forest-700 hover:to-forest-800 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <Check size={16} />
              确认物资清单
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
