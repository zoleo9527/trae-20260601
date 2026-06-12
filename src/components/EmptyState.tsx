import { ClipboardList, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  onRefresh?: () => void;
}

export const EmptyState = ({ onRefresh }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="w-20 h-20 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <ClipboardList className="w-10 h-10" />
      </div>
      <h3 className="text-lg font-medium text-gray-500 mb-2">暂无工单数据</h3>
      <p className="text-sm mb-4">当前筛选条件下没有找到相关工单</p>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          刷新列表
        </button>
      )}
    </div>
  );
};
