import { Search, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ControlStage, User } from '@/types';
import { STAGE_MAP } from '@/utils/status';
import { useSaleControlStore } from '@/store/useSaleControlStore';
import { useUserStore } from '@/store/useUserStore';
import Input from '../common/Input';
import Select from '../common/Select';
import DateRangePicker from '../common/DateRangePicker';

interface StageTab {
  key: ControlStage | 'all';
  label: string;
  count: number;
}

interface ApprovalFilterProps {
  keyword?: string;
  onKeywordChange?: (keyword: string) => void;
  className?: string;
}

const STAGE_FILTERS: (ControlStage | 'all')[] = ['all', 'application', 'review', 'lock', 'completed', 'rejected'];

export default function ApprovalFilter({
  keyword = '',
  onKeywordChange,
  className,
}: ApprovalFilterProps) {
  const { saleControls, filters, setFilters } = useSaleControlStore();
  const { users } = useUserStore();

  const stageTabs: StageTab[] = STAGE_FILTERS.map((stage) => ({
    key: stage,
    label: stage === 'all' ? '全部' : STAGE_MAP[stage],
    count: stage === 'all'
      ? saleControls.length
      : saleControls.filter((sc) => sc.stage === stage).length,
  }));

  const handlerOptions = [
    { value: '', label: '全部处理人' },
    ...users.map((u: User) => ({
      value: u.id,
      label: `${u.name} (${u.roleName})`,
    })),
  ];

  const handleStageChange = (stage: ControlStage | 'all') => {
    setFilters({ stage: stage === 'all' ? undefined : stage });
  };

  const handleHandlerChange = (operatorId: string | number) => {
    setFilters({ operatorId: operatorId ? String(operatorId) : undefined });
  };

  const handleDateChange = (startDate: string, endDate: string) => {
    setFilters({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const handleClearFilters = () => {
    setFilters({
      stage: undefined,
      operatorId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    onKeywordChange?.('');
  };

  const hasActiveFilters = filters.stage || filters.operatorId || filters.startDate || filters.endDate || keyword;

  return (
    <div className={cn('bg-white rounded-xl shadow-sm border border-slate-200 p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          筛选条件
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-danger transition-colors"
          >
            <X className="w-4 h-4" />
            清除筛选
          </button>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-600 mb-3">
          审批阶段
        </label>
        <div className="flex flex-wrap gap-2">
          {stageTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleStageChange(tab.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                'flex items-center gap-2',
                (filters.stage === tab.key || (!filters.stage && tab.key === 'all'))
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {tab.label}
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                (filters.stage === tab.key || (!filters.stage && tab.key === 'all'))
                  ? 'bg-white/20 text-white'
                  : 'bg-white text-slate-500'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            搜索
          </label>
          <Input
            placeholder="搜索房源、客户、申请人..."
            value={keyword}
            onChange={(e) => onKeywordChange?.(e.target.value)}
            prefixIcon={<Search className="w-4 h-4" />}
            showClear
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            处理人
          </label>
          <Select
            options={handlerOptions}
            value={filters.operatorId || ''}
            onChange={handleHandlerChange}
            placeholder="选择处理人"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            申请时间
          </label>
          <DateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={handleDateChange}
          />
        </div>
      </div>
    </div>
  );
}
