import { useState } from 'react';
import {
  MessageSquare,
  User,
  Clock,
  Send,
  AlertCircle,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Remark, Role } from '@/types';
import { ROLE_LABELS, ROLE_COLORS } from '@/types';
import { cn } from '@/lib/utils';

interface RemarkChainProps {
  remarks: Remark[];
  currentRole: Role | null;
  currentUser: string;
  onAddRemark?: (content: string) => void;
  className?: string;
  maxVisible?: number;
}

const ROLE_ICON_BG: Record<Role, string> = {
  CUSTOMER_SERVICE: 'bg-blue-500',
  DESIGNER: 'bg-purple-500',
  QUALITY: 'bg-green-500',
  ADMIN: 'bg-gray-500',
};

export function RemarkChain({
  remarks,
  currentRole,
  currentUser,
  onAddRemark,
  className,
  maxVisible = 5,
}: RemarkChainProps) {
  const [newRemark, setNewRemark] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedRemarks = [...remarks].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const displayedRemarks = showAll
    ? sortedRemarks
    : sortedRemarks.slice(-maxVisible);

  const hasMore = sortedRemarks.length > maxVisible;

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;

    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFullDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleSubmit = async () => {
    if (!newRemark.trim() || !onAddRemark || !currentRole) return;

    setIsSubmitting(true);
    try {
      onAddRemark(newRemark.trim());
      setNewRemark('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.slice(0, 1);
  };

  return (
    <div className={cn('bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-200 bg-gradient-to-r from-success-50 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-neutral-800 flex items-center gap-2">
              <MessageSquare size={18} className="text-success-600" />
              备注记录
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              共 {sortedRemarks.length} 条备注，按时间顺序展示
            </p>
          </div>
          {onAddRemark && currentRole && (
            <span className="px-2 py-1 bg-success-100 text-success-700 text-xs rounded-full font-medium">
              可添加备注
            </span>
          )}
        </div>
      </div>

      {/* Add Remark Form */}
      {onAddRemark && currentRole && (
        <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50">
          <div className="flex gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0',
                ROLE_ICON_BG[currentRole]
              )}
            >
              {getInitials(currentUser)}
            </div>
            <div className="flex-1">
              <div className="mb-2">
                <span className="text-sm font-medium text-neutral-700">{currentUser}</span>
                <span className={cn('ml-2 px-2 py-0.5 text-xs rounded-full', ROLE_COLORS[currentRole])}>
                  {ROLE_LABELS[currentRole]}
                </span>
              </div>
              <div className="relative">
                <textarea
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入备注内容，按 Enter 发送，Shift+Enter 换行..."
                  rows={3}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-success-500/20 focus:border-success-500 transition-all resize-none"
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-neutral-400">
                    {newRemark.length} / 500 字
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNewRemark('')}
                      disabled={!newRemark.trim() || isSubmitting}
                      className="px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors disabled:opacity-50"
                    >
                      清空
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!newRemark.trim() || isSubmitting}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-success-500 text-white text-sm rounded-lg hover:bg-success-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={14} />
                      {isSubmitting ? '发送中...' : '发送'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remark List */}
      <div className="px-5 py-4">
        {displayedRemarks.length > 0 ? (
          <div className="space-y-4">
            {/* Show More Toggle */}
            {hasMore && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full flex items-center justify-center gap-1 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <ChevronDown size={16} />
                查看更早的 {sortedRemarks.length - maxVisible} 条备注
              </button>
            )}

            {/* Show Less Toggle */}
            {showAll && hasMore && (
              <button
                onClick={() => setShowAll(false)}
                className="w-full flex items-center justify-center gap-1 py-2 text-sm text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
              >
                <ChevronUp size={16} />
                收起，只显示最新 {maxVisible} 条
              </button>
            )}

            {/* Remark Items */}
            {displayedRemarks.map((remark, index) => {
              const isLast = index === displayedRemarks.length - 1;
              const colors = ROLE_COLORS[remark.role];
              const iconBg = ROLE_ICON_BG[remark.role];

              return (
                <div key={remark.id} className="relative group animate-fade-in">
                  {/* Timeline Line */}
                  {!isLast && (
                    <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-neutral-100" />
                  )}

                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shadow-sm',
                          iconBg
                        )}
                      >
                        {getInitials(remark.createdBy)}
                      </div>
                      {/* Role Badge */}
                      <div
                        className={cn(
                          'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white',
                          iconBg,
                          'border-2 border-white'
                        )}
                      >
                        {remark.role === 'CUSTOMER_SERVICE' && '客'}
                        {remark.role === 'DESIGNER' && '设'}
                        {remark.role === 'QUALITY' && '质'}
                        {remark.role === 'ADMIN' && '管'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-neutral-800 text-sm">
                          {remark.createdBy}
                        </span>
                        <span className={cn('px-2 py-0.5 text-xs rounded-full', colors)}>
                          {ROLE_LABELS[remark.role]}
                        </span>
                        <span className="text-xs text-neutral-400 flex items-center gap-1" title={formatFullDateTime(remark.createdAt)}>
                          <Clock size={12} />
                          {formatDateTime(remark.createdAt)}
                        </span>
                      </div>

                      {/* Content Card */}
                      <div
                        className={cn(
                          'relative rounded-lg p-4 border transition-all duration-200',
                          'bg-gradient-to-br from-neutral-50 to-white',
                          'border-neutral-100 hover:border-neutral-200',
                          'group-hover:shadow-sm'
                        )}
                      >
                        {/* Quote Icon */}
                        <div className="absolute -top-2 -left-1 text-success-200 opacity-50">
                          <MessageSquare size={16} fill="currentColor" />
                        </div>

                        {/* Remark Text */}
                        <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                          {remark.content}
                        </p>
                      </div>

                      {/* Reply Hint (for last item) */}
                      {isLast && onAddRemark && currentRole && (
                        <button
                          onClick={() => {
                            const textarea = document.querySelector('textarea');
                            textarea?.focus();
                          }}
                          className="mt-2 flex items-center gap-1 text-xs text-neutral-400 hover:text-primary-600 transition-colors"
                        >
                          <Plus size={12} />
                          回复此备注
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={28} className="text-neutral-300" />
            </div>
            <p className="text-neutral-500 font-medium">暂无备注记录</p>
            <p className="text-sm text-neutral-400 mt-1">
              {onAddRemark && currentRole ? '您可以添加第一条备注' : '等待相关人员添加备注'}
            </p>
          </div>
        )}
      </div>

      {/* Role Legend */}
      {sortedRemarks.length > 0 && (
        <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs text-neutral-500">角色说明：</span>
            {(['CUSTOMER_SERVICE', 'DESIGNER', 'QUALITY', 'ADMIN'] as Role[]).map((role) => (
              <div key={role} className="flex items-center gap-1.5">
                <div className={cn('w-3 h-3 rounded-full', ROLE_ICON_BG[role])} />
                <span className="text-xs text-neutral-600">{ROLE_LABELS[role]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
