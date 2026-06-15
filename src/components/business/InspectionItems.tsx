import { useState } from 'react';
import { InspectionItem, InspectionItemResult } from '@/types';
import { CheckCircle, XCircle, MinusCircle, ChevronDown, ChevronUp, Camera, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InspectionItemsProps {
  items: InspectionItem[];
  editable?: boolean;
  onItemChange?: (itemId: string, result: InspectionItemResult, remark?: string) => void;
}

const categories = ['外观检查', '性能检查', '安全检查', '附件检查'];

const resultIcons: Record<InspectionItemResult, React.ReactNode> = {
  pass: <CheckCircle size={18} className="text-emerald-500" />,
  fail: <XCircle size={18} className="text-rose-500" />,
  na: <MinusCircle size={18} className="text-slate-300" />,
};

const resultLabels: Record<InspectionItemResult, string> = {
  pass: '正常',
  fail: '异常',
  na: '未检查',
};

export function InspectionItems({ items, editable = false, onItemChange }: InspectionItemsProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const getCategoryStats = (category: string) => {
    const categoryItems = items.filter((i) => i.category === category);
    const passCount = categoryItems.filter((i) => i.result === 'pass').length;
    const failCount = categoryItems.filter((i) => i.result === 'fail').length;
    const total = categoryItems.length;
    return { passCount, failCount, total };
  };

  const handleResultClick = (itemId: string, currentResult: InspectionItemResult) => {
    if (!editable || !onItemChange) return;
    const results: InspectionItemResult[] = ['pass', 'fail', 'na'];
    const currentIndex = results.indexOf(currentResult);
    const nextResult = results[(currentIndex + 1) % results.length];
    onItemChange(itemId, nextResult);
  };

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const categoryItems = items.filter((i) => i.category === category);
        const { passCount, failCount, total } = getCategoryStats(category);
        const isExpanded = expandedCategories.includes(category);

        return (
          <div key={category} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-800 text-sm">{category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{total} 项</span>
                  {passCount > 0 && (
                    <span className="text-xs text-emerald-600 flex items-center gap-0.5">
                      <CheckCircle size={12} />
                      {passCount}
                    </span>
                  )}
                  {failCount > 0 && (
                    <span className="text-xs text-rose-600 flex items-center gap-0.5">
                      <XCircle size={12} />
                      {failCount}
                    </span>
                  )}
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp size={18} className="text-slate-400" />
              ) : (
                <ChevronDown size={18} className="text-slate-400" />
              )}
            </button>

            {isExpanded && (
              <div className="divide-y divide-slate-100">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'px-4 py-3 flex items-start gap-3',
                      editable && 'hover:bg-slate-50 cursor-pointer'
                    )}
                    onClick={() => handleResultClick(item.id, item.result)}
                  >
                    <div className="pt-0.5">
                      {editable ? (
                        <button className="hover:scale-110 transition-transform">
                          {resultIcons[item.result]}
                        </button>
                      ) : (
                        resultIcons[item.result]
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-700">{item.name}</span>
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded',
                            item.result === 'pass' && 'bg-emerald-50 text-emerald-700',
                            item.result === 'fail' && 'bg-rose-50 text-rose-700',
                            item.result === 'na' && 'bg-slate-100 text-slate-500'
                          )}
                        >
                          {resultLabels[item.result]}
                        </span>
                      </div>
                      {item.remark && (
                        <div className="flex items-start gap-1.5 mt-1.5 text-xs text-slate-500">
                          <MessageSquare size={12} className="flex-shrink-0 mt-0.5" />
                          <span>{item.remark}</span>
                        </div>
                      )}
                      {item.photos.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Camera size={12} className="text-slate-400" />
                          <span className="text-xs text-slate-400">
                            {item.photos.length} 张照片
                          </span>
                        </div>
                      )}
                    </div>
                    {editable && (
                      <span className="text-xs text-slate-400">点击切换</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
