import { MapPin, Maximize2, DollarSign, Sun, Lock, Eye, Clock, CheckCircle } from 'lucide-react';
import { useHouseStore } from '@/store/useHouseStore';
import { useSaleControlStore } from '@/store/useSaleControlStore';
import { useUserStore } from '@/store/useUserStore';
import StatusBadge from '@/components/common/StatusBadge';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';
import type { House, HouseStatus, UserRole } from '@/types';

interface HouseCardProps {
  house: House;
  onSaleControl?: (house: House) => void;
  onViewDetail?: (house: House) => void;
}

const rolePermissions: Record<UserRole, HouseStatus[]> = {
  consultant: ['available'],
  manager: ['available', 'locked'],
  controller: ['available', 'locked'],
};

export default function HouseCard({ house, onSaleControl, onViewDetail }: HouseCardProps) {
  const { setSelectedHouse } = useHouseStore();
  const { saleControls } = useSaleControlStore();
  const { currentUser } = useUserStore();

  const getActiveSaleControl = (houseId: string) => {
    return saleControls.find(
      (sc) => sc.houseId === houseId && sc.stage !== 'completed' && sc.stage !== 'rejected'
    );
  };

  const activeControl = getActiveSaleControl(house.id);

  const canDoSaleControl = () => {
    if (activeControl) return false;
    const allowedStatuses = rolePermissions[currentUser.role] || [];
    return allowedStatuses.includes(house.status);
  };

  const getSaleControlButtonText = () => {
    if (activeControl) return '销控中';
    if (house.status === 'sold') return '已售出';
    if (house.status === 'reserved') return '已预留';
    return '申请销控';
  };

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}万`;
    }
    return `${price.toLocaleString()}`;
  };

  const handleCardClick = () => {
    setSelectedHouse(house);
    onViewDetail?.(house);
  };

  const handleSaleControlClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canDoSaleControl()) {
      setSelectedHouse(house);
      onSaleControl?.(house);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden',
        'transition-all duration-200 cursor-pointer hover:shadow-md',
        activeControl && 'border-secondary/30 bg-secondary/5'
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-slate-800">{house.houseNumber}</h3>
              {activeControl && <Clock className="w-4 h-4 text-secondary animate-pulse" />}
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>{house.building} {house.unit} {house.floor}</span>
            </div>
          </div>
          <StatusBadge type="house" value={house.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Maximize2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-slate-500">面积</p>
              <p className="text-sm font-medium text-slate-700">{house.area} ㎡</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <span className="text-secondary text-sm">🏠</span>
            </div>
            <div>
              <p className="text-xs text-slate-500">户型</p>
              <p className="text-sm font-medium text-slate-700">{house.layout}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <Sun className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-slate-500">朝向</p>
              <p className="text-sm font-medium text-slate-700">{house.orientation}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-danger" />
            </div>
            <div>
              <p className="text-xs text-slate-500">单价</p>
              <p className="text-sm font-medium text-slate-700">{(house.unitPrice / 1000).toFixed(1)}k/㎡</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">总价</p>
            <p className="text-xl font-bold text-primary">{formatPrice(house.totalPrice)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="text-slate-500 hover:text-slate-700 gap-1"
            >
              <Eye className="w-4 h-4" />
              详情
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaleControlClick}
              disabled={!canDoSaleControl()}
              className="gap-1"
            >
              {activeControl ? (
                <Clock className="w-4 h-4" />
              ) : house.status === 'sold' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {getSaleControlButtonText()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
