import { Eye, Lock, CheckCircle, Clock } from 'lucide-react';
import { useHouseStore } from '@/store/useHouseStore';
import { useSaleControlStore } from '@/store/useSaleControlStore';
import { useUserStore } from '@/store/useUserStore';
import StatusBadge from '@/components/common/StatusBadge';
import Button from '@/components/common/Button';
import Empty from '@/components/Empty';
import { cn } from '@/lib/utils';
import type { House, HouseStatus, UserRole } from '@/types';

interface HouseTableProps {
  onSaleControl?: (house: House) => void;
  onViewDetail?: (house: House) => void;
}

const rolePermissions: Record<UserRole, HouseStatus[]> = {
  consultant: ['available'],
  manager: ['available', 'locked'],
  controller: ['available', 'locked'],
};

export default function HouseTable({ onSaleControl, onViewDetail }: HouseTableProps) {
  const { filteredHouses, loading, setSelectedHouse } = useHouseStore();
  const { saleControls } = useSaleControlStore();
  const { currentUser } = useUserStore();

  const getActiveSaleControl = (houseId: string) => {
    return saleControls.find(
      (sc) => sc.houseId === houseId && sc.stage !== 'completed' && sc.stage !== 'rejected'
    );
  };

  const canDoSaleControl = (house: House) => {
    const activeControl = getActiveSaleControl(house.id);
    if (activeControl) return false;

    const allowedStatuses = rolePermissions[currentUser.role] || [];
    return allowedStatuses.includes(house.status);
  };

  const getSaleControlButtonText = (house: House) => {
    const activeControl = getActiveSaleControl(house.id);
    if (activeControl) {
      return '销控中';
    }
    if (house.status === 'sold') return '已售出';
    if (house.status === 'reserved') return '已预留';
    return '申请销控';
  };

  const handleRowClick = (house: House) => {
    setSelectedHouse(house);
    onViewDetail?.(house);
  };

  const handleSaleControlClick = (e: React.MouseEvent, house: House) => {
    e.stopPropagation();
    if (canDoSaleControl(house)) {
      setSelectedHouse(house);
      onSaleControl?.(house);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}万`;
    }
    return `${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="ml-3 text-slate-600">加载中...</span>
        </div>
      </div>
    );
  }

  if (filteredHouses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <Empty />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                房号
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                楼栋
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                户型
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                面积
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                单价
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                总价
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                朝向
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                状态
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredHouses.map((house) => {
              const activeControl = getActiveSaleControl(house.id);
              const canControl = canDoSaleControl(house);

              return (
                <tr
                  key={house.id}
                  onClick={() => handleRowClick(house)}
                  className={cn(
                    'transition-all duration-200 cursor-pointer',
                    'hover:bg-slate-50 hover:shadow-sm',
                    activeControl && 'bg-secondary/5'
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{house.houseNumber}</span>
                      {activeControl && (
                        <Clock className="w-3.5 h-3.5 text-secondary animate-pulse" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {house.building} {house.unit} {house.floor}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{house.layout}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{house.area} ㎡</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {house.unitPrice.toLocaleString()} 元/㎡
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    {formatPrice(house.totalPrice)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{house.orientation}</td>
                  <td className="px-4 py-3">
                    <StatusBadge type="house" value={house.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleSaleControlClick(e, house)}
                        disabled={!canControl}
                        className={cn(
                          'gap-1',
                          canControl
                            ? 'text-primary hover:text-primary hover:bg-primary/5'
                            : 'text-slate-400 cursor-not-allowed'
                        )}
                      >
                        {activeControl ? (
                          <Clock className="w-4 h-4" />
                        ) : house.status === 'sold' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                        {getSaleControlButtonText(house)}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(house);
                        }}
                        className="text-slate-500 hover:text-slate-700 gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        详情
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-500">
        共 {filteredHouses.length} 条记录
      </div>
    </div>
  );
}
