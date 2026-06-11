import { useState, useMemo } from 'react';
import { Search, Filter, Plus, Building2, User, Clock, Home, X } from 'lucide-react';
import { useSaleControlStore } from '@/store/useSaleControlStore';
import { useHouseStore } from '@/store/useHouseStore';
import { useUserStore } from '@/store/useUserStore';
import SaleControlCard from '@/components/sale/SaleControlCard';
import ControlDrawer from '@/components/sale/ControlDrawer';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import DateRangePicker from '@/components/common/DateRangePicker';
import Select from '@/components/common/Select';
import Input from '@/components/common/Input';
import { cn } from '@/lib/utils';
import type { SaleControl, ControlStage, House } from '@/types';
import { STAGE_MAP } from '@/utils/status';

export default function SaleControlPage() {
  const {
    filteredSaleControls,
    setFilters,
    filters,
    getSaleControlById,
  } = useSaleControlStore();
  const { houses, filteredHouses, setFilters: setHouseFilters, getHousesByStatus } = useHouseStore();
  const { currentUser, users } = useUserStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSaleControl, setSelectedSaleControl] = useState<SaleControl | null>(null);
  const [showHousePicker, setShowHousePicker] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const stats = useMemo(() => {
    const all = filteredSaleControls;
    return {
      total: all.length,
      application: all.filter((s) => s.stage === 'application').length,
      review: all.filter((s) => s.stage === 'review').length,
      lock: all.filter((s) => s.stage === 'lock').length,
      completed: all.filter((s) => s.stage === 'completed').length,
      rejected: all.filter((s) => s.stage === 'rejected').length,
    };
  }, [filteredSaleControls]);

  const handleCreate = (house?: House) => {
    setSelectedHouse(house || null);
    setSelectedSaleControl(null);
    setShowHousePicker(false);
    setDrawerOpen(true);
  };

  const handleViewDetail = (sc: SaleControl) => {
    setSelectedSaleControl(sc);
    setSelectedHouse(null);
    setDrawerOpen(true);
  };

  const handleAction = (sc: SaleControl, action: string) => {
    setSelectedSaleControl(sc);
    setSelectedHouse(null);
    setDrawerOpen(true);
  };

  const stageOptions: Array<{ value: ControlStage | 'all'; label: string }> = [
    { value: 'all', label: '全部阶段' },
    { value: 'application', label: '销控申请' },
    { value: 'review', label: '经理审核' },
    { value: 'lock', label: '执行锁定' },
    { value: 'completed', label: '已完成' },
    { value: 'rejected', label: '已驳回' },
  ];

  const operatorOptions = [
    { value: 'all', label: '全部操作人' },
    ...users.map((u) => ({ value: u.id, label: `${u.name} (${u.roleName})` })),
  ];

  const availableHouses = getHousesByStatus('available');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-6 gap-4">
        <StatCard label="全部申请" value={stats.total} icon={Building2} color="primary" />
        <StatCard label="待审核" value={stats.application + stats.review} icon={Clock} color="secondary" />
        <StatCard label="申请中" value={stats.application} icon={User} color="primary" />
        <StatCard label="审核中" value={stats.review} icon={Clock} color="secondary" />
        <StatCard label="已锁定" value={stats.lock} icon={Home} color="success" />
        <StatCard label="已完成" value={stats.completed} icon={Building2} color="slate" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800">销控申请列表</h3>
            <p className="text-xs text-slate-400 mt-0.5">共 {filteredSaleControls.length} 条记录</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5"
            >
              <Filter className="w-4 h-4" />
              筛选
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowHousePicker(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              新建销控
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">关键词搜索</label>
              <Input
                placeholder="房号/客户/顾问/备注..."
                value={filters.keyword || ''}
                onChange={(e) => setFilters({ keyword: e.target.value || undefined })}
                prefixIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">销控阶段</label>
              <Select
                options={stageOptions}
                value={filters.stage || 'all'}
                onChange={(v) => setFilters({ stage: v === 'all' ? undefined : (v as ControlStage) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">操作人</label>
              <Select
                options={operatorOptions}
                value={filters.operatorId || 'all'}
                onChange={(v) => setFilters({ operatorId: v === 'all' ? undefined : (v as string) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">申请日期</label>
              <DateRangePicker
                startDate={filters.startDate}
                endDate={filters.endDate}
                onChange={(start, end) => setFilters({ startDate: start, endDate: end })}
              />
            </div>
          </div>
        )}

        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 mr-2">快速筛选：</span>
          </div>
          {stageOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilters({ stage: opt.value === 'all' ? undefined : (opt.value as ControlStage) })}
              className={cn(
                'px-2.5 py-1 text-xs rounded-md transition-all',
                (filters.stage || 'all') === opt.value
                  ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent'
              )}
            >
              {opt.label}
              {opt.value !== 'all' && (
                <span className="ml-1 text-slate-400">
                  {opt.value === 'application' && stats.application}
                  {opt.value === 'review' && stats.review}
                  {opt.value === 'lock' && stats.lock}
                  {opt.value === 'completed' && stats.completed}
                  {opt.value === 'rejected' && stats.rejected}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {filteredSaleControls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Building2 className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">暂无销控申请记录</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowHousePicker(true)}
                className="mt-4 gap-1.5"
              >
                <Plus className="w-4 h-4" />
                新建销控申请
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSaleControls.map((sc) => (
                <SaleControlCard
                  key={sc.id}
                  saleControl={sc}
                  onViewDetail={handleViewDetail}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ControlDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        house={selectedHouse}
        saleControlId={selectedSaleControl?.id}
      />

      {showHousePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowHousePicker(false)}
          />
          <div className="relative w-full max-w-3xl max-h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">选择房源</h3>
                <p className="text-sm text-slate-500 mt-0.5">共 {availableHouses.length} 套可售房源</p>
              </div>
              <button
                onClick={() => setShowHousePicker(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索房号、楼栋、户型..."
                onChange={(e) => setHouseFilters({ keyword: e.target.value })}
                className="flex-1"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {availableHouses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Home className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">暂无可售房源</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredHouses
                    .filter((h) => h.status === 'available')
                    .slice(0, 50)
                    .map((house) => (
                      <button
                        key={house.id}
                        onClick={() => handleCreate(house)}
                        className="p-4 rounded-xl border border-slate-200 bg-white text-left hover:border-primary hover:bg-primary/5 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-semibold text-slate-800 group-hover:text-primary transition-colors">
                            {house.houseNumber}
                          </span>
                          <StatusBadge type="house" value={house.status} size="sm" />
                        </div>
                        <p className="text-xs text-slate-500 mb-1">
                          {house.building} {house.unit} {house.floor}
                        </p>
                        <p className="text-xs text-slate-500 mb-2">
                          {house.layout} · {house.area}㎡
                        </p>
                        <p className="text-sm font-bold text-primary">
                          {house.totalPrice >= 10000
                            ? `${(house.totalPrice / 10000).toFixed(0)}万`
                            : house.totalPrice.toLocaleString()}
                        </p>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Building2;
  color: 'primary' | 'secondary' | 'success' | 'danger' | 'slate';
}) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20',
    success: 'bg-success/10 text-success border-success/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
