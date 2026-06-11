import { Search, RotateCcw, Home, Maximize2, DollarSign } from 'lucide-react';
import { useHouseStore } from '@/store/useHouseStore';
import { useUserStore } from '@/store/useUserStore';
import { customers } from '@/data';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { HOUSE_STATUS_MAP } from '@/utils/status';
import type { HouseStatus, HouseFilters } from '@/types';

const statusOptions: { value: HouseStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'available', label: '可售' },
  { value: 'locked', label: '锁定' },
  { value: 'sold', label: '已售' },
  { value: 'reserved', label: '预留' },
];

export default function HouseFilter() {
  const { filters, setFilters, resetFilters, houses } = useHouseStore();
  const { currentUser } = useUserStore();

  const buildings = Array.from(new Set(houses.map((h) => h.building)));
  const layouts = Array.from(new Set(houses.map((h) => h.layout)));

  const buildingOptions = [
    { value: '', label: '全部楼栋' },
    ...buildings.map((b) => ({ value: b, label: b })),
  ];

  const layoutOptions = [
    { value: '', label: '全部户型' },
    ...layouts.map((l) => ({ value: l, label: l })),
  ];

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value;
    setFilters({ keyword });
  };

  const handleBuildingChange = (value: string | number) => {
    setFilters({ building: value as string });
  };

  const handleLayoutChange = (value: string | number) => {
    setFilters({ layout: value as string });
  };

  const handleStatusClick = (status: HouseStatus | 'all') => {
    if (status === 'all') {
      setFilters({ status: undefined });
    } else {
      setFilters({ status });
    }
  };

  const handleMinAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters({ minArea: value ? Number(value) : undefined });
  };

  const handleMaxAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters({ maxArea: value ? Number(value) : undefined });
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters({ minPrice: value ? Number(value) * 10000 : undefined });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters({ maxPrice: value ? Number(value) * 10000 : undefined });
  };

  const getActiveStatusValue = (): HouseStatus | 'all' => {
    return filters.status || 'all';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-slate-800">筛选条件</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="text-slate-500 hover:text-slate-700"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </Button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Input
            placeholder="搜索房号、客户姓名、置业顾问..."
            value={filters.keyword || ''}
            onChange={handleKeywordChange}
            showClear
            prefixIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <Select
              options={buildingOptions}
              value={filters.building || ''}
              onChange={handleBuildingChange}
              placeholder="选择楼栋"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm flex-shrink-0 w-4">🏠</span>
            <Select
              options={layoutOptions}
              value={filters.layout || ''}
              onChange={handleLayoutChange}
              placeholder="选择户型"
            />
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-600 mb-2 font-medium">房源状态</p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <button
                key={status.value}
                onClick={() => handleStatusClick(status.value)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg border transition-all duration-200',
                  getActiveStatusValue() === status.value
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                )}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600 mb-2 font-medium flex items-center gap-1">
              <Maximize2 className="w-4 h-4" />
              面积范围 (㎡)
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="最小"
                value={filters.minArea || ''}
                onChange={handleMinAreaChange}
                min={0}
              />
              <span className="text-slate-400">-</span>
              <Input
                type="number"
                placeholder="最大"
                value={filters.maxArea || ''}
                onChange={handleMaxAreaChange}
                min={0}
              />
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-2 font-medium flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              价格范围 (万元)
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="最小"
                value={filters.minPrice ? filters.minPrice / 10000 : ''}
                onChange={handleMinPriceChange}
                min={0}
              />
              <span className="text-slate-400">-</span>
              <Input
                type="number"
                placeholder="最大"
                value={filters.maxPrice ? filters.maxPrice / 10000 : ''}
                onChange={handleMaxPriceChange}
                min={0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
