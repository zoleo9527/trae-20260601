import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User,
  Shield,
  Search,
  Calendar,
  Filter,
  X,
  ChevronDown,
  FileText,
  LogOut,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Pagination } from '@/components/Pagination';
import { Role, ROLE_LABELS, ROLE_COLORS, STATUS_LABELS } from '@/types';
import { cn } from '@/lib/utils';

export default function AuditLog() {
  const navigate = useNavigate();
  const {
    initMockData,
    getAuditLogs,
    setCurrentRole,
    currentRole,
    currentUser,
    setCurrentUser,
    auditLogs,
  } = useAppStore();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    initMockData();
    if (!currentRole) {
      setCurrentRole('ADMIN');
    }
    if (!currentUser) {
      setCurrentUser('系统管理员');
    }
  }, [initMockData, currentRole, currentUser, setCurrentRole, setCurrentUser]);

  const filteredLogs = useMemo(() => {
    let result = [...auditLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(
        (log) =>
          log.orderId.toLowerCase().includes(kw) ||
          log.operator.toLowerCase().includes(kw) ||
          log.action.toLowerCase().includes(kw) ||
          log.detail.toLowerCase().includes(kw)
      );
    }

    if (roleFilter) {
      result = result.filter((log) => log.role === roleFilter);
    }

    if (startDate) {
      result = result.filter((log) => log.createdAt >= startDate);
    }

    if (endDate) {
      result = result.filter((log) => log.createdAt <= endDate + 'T23:59:59');
    }

    return result;
  }, [auditLogs, keyword, roleFilter, startDate, endDate]);

  const paginatedData = useMemo(() => {
    const total = filteredLogs.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = filteredLogs.slice(start, start + pageSize);

    return { data, total, page, pageSize, totalPages };
  }, [filteredLogs, page, pageSize]);

  const handleLogout = () => {
    setCurrentRole(null);
    navigate('/');
  };

  const handleResetFilter = () => {
    setKeyword('');
    setRoleFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const hasActiveFilters = () => {
    return keyword || roleFilter || startDate || endDate;
  };

  const activeFilterCount = [keyword, roleFilter, startDate, endDate].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-neutral-600" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-700">审计日志</h1>
                <p className="text-xs text-neutral-500">全流程操作记录追踪</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <User size={16} />
                <span>{currentUser || '未登录'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: '全部操作记录',
              value: filteredLogs.length,
              color: 'text-primary-600',
              bg: 'bg-primary-50',
            },
            {
              label: '客服操作',
              value: filteredLogs.filter((l) => l.role === 'CUSTOMER_SERVICE').length,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              label: '设计师操作',
              value: filteredLogs.filter((l) => l.role === 'DESIGNER').length,
              color: 'text-purple-600',
              bg: 'bg-purple-50',
            },
            {
              label: '质检操作',
              value: filteredLogs.filter((l) => l.role === 'QUALITY').length,
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <FileText size={24} className={stat.color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200 bg-gradient-to-r from-primary-500 to-primary-600">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">操作日志列表</h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60"
                  />
                  <input
                    type="text"
                    placeholder="搜索订单号、操作人、操作内容..."
                    value={keyword}
                    onChange={(e) => {
                      setKeyword(e.target.value);
                      setPage(1);
                    }}
                    className="w-64 pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all"
                  />
                  {keyword && (
                    <button
                      onClick={() => {
                        setKeyword('');
                        setPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/20 text-white/60 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all',
                      'bg-white/10 border border-white/20 text-white',
                      'hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40',
                      roleFilter && 'bg-white/20'
                    )}
                  >
                    <Filter size={16} className="text-white/60" />
                    <span className="min-w-[80px]">
                      {roleFilter ? ROLE_LABELS[roleFilter] : '全部角色'}
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        'text-white/60 transition-transform duration-200',
                        showRoleDropdown && 'rotate-180'
                      )}
                    />
                  </button>

                  {showRoleDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 overflow-hidden animate-fade-in">
                      <button
                        onClick={() => {
                          setRoleFilter('');
                          setPage(1);
                          setShowRoleDropdown(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2.5 text-left text-sm transition-colors',
                          'hover:bg-neutral-50 border-b border-neutral-100',
                          !roleFilter && 'bg-primary-50 text-primary-700'
                        )}
                      >
                        全部角色
                      </button>
                      {(['CUSTOMER_SERVICE', 'DESIGNER', 'QUALITY', 'ADMIN'] as Role[]).map(
                        (role) => (
                          <button
                            key={role}
                            onClick={() => {
                              setRoleFilter(role);
                              setPage(1);
                              setShowRoleDropdown(false);
                            }}
                            className={cn(
                              'w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-neutral-50',
                              roleFilter === role && 'bg-primary-50 text-primary-700'
                            )}
                          >
                            {ROLE_LABELS[role]}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all',
                    'bg-white/10 border border-white/20 text-white',
                    'hover:bg-white/20',
                    isExpanded && 'bg-white/20'
                  )}
                >
                  <Calendar size={16} className="text-white/60" />
                  <span>{isExpanded ? '收起' : '日期筛选'}</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-danger-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {hasActiveFilters() && (
                  <button
                    onClick={handleResetFilter}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white hover:bg-white/20 transition-colors"
                  >
                    <X size={16} />
                    重置
                  </button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-white/20 animate-slide-in">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/80 whitespace-nowrap">日期范围：</span>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Calendar
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60"
                        />
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setPage(1);
                          }}
                          className="pl-9 pr-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
                        />
                      </div>
                      <span className="text-white/60">至</span>
                      <div className="relative">
                        <Calendar
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60"
                        />
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            setPage(1);
                          }}
                          className="pl-9 pr-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-white/80">快捷：</span>
                    {[
                      { label: '今天', days: 0 },
                      { label: '近7天', days: 7 },
                      { label: '近30天', days: 30 },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          const end = new Date();
                          const start = new Date();
                          start.setDate(start.getDate() - item.days);
                          setStartDate(start.toISOString().split('T')[0]);
                          setEndDate(end.toISOString().split('T')[0]);
                          setPage(1);
                        }}
                        className="px-3 py-1.5 text-xs bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {hasActiveFilters() && (
            <div className="px-4 py-3 bg-primary-50 border-b border-primary-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-primary-600">当前筛选：</span>
                {roleFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-md">
                    角色：{ROLE_LABELS[roleFilter]}
                    <button
                      onClick={() => {
                        setRoleFilter('');
                        setPage(1);
                      }}
                      className="ml-1 hover:text-primary-900"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {startDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-success-100 text-success-700 text-xs rounded-md">
                    开始：{startDate}
                    <button
                      onClick={() => {
                        setStartDate('');
                        setPage(1);
                      }}
                      className="ml-1 hover:text-success-900"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {endDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-success-100 text-success-700 text-xs rounded-md">
                    结束：{endDate}
                    <button
                      onClick={() => {
                        setEndDate('');
                        setPage(1);
                      }}
                      className="ml-1 hover:text-success-900"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {keyword && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-warning-100 text-warning-700 text-xs rounded-md">
                    关键词：{keyword}
                    <button
                      onClick={() => {
                        setKeyword('');
                        setPage(1);
                      }}
                      className="ml-1 hover:text-warning-900"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    操作时间
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    操作人
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    操作类型
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    状态变更
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    详情
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {paginatedData.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-neutral-500">
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={48} className="text-neutral-300" />
                        <p>暂无操作记录</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.data.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-primary-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-neutral-400" />
                          <span className="text-sm text-neutral-700">
                            {formatDateTime(log.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                            <User size={14} className="text-neutral-600" />
                          </div>
                          <span className="font-medium text-neutral-800">{log.operator}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                            ROLE_COLORS[log.role]
                          )}
                        >
                          {ROLE_LABELS[log.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 bg-primary-50 text-primary-700 rounded-md text-sm font-medium">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.oldStatus && log.newStatus ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-xs">
                              {STATUS_LABELS[log.oldStatus]}
                            </span>
                            <span className="text-neutral-400">→</span>
                            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                              {STATUS_LABELS[log.newStatus]}
                            </span>
                          </div>
                        ) : log.newStatus ? (
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                            初始：{STATUS_LABELS[log.newStatus]}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-neutral-600 max-w-md truncate" title={log.detail}>
                          {log.detail}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={paginatedData.page}
            totalPages={paginatedData.totalPages}
            pageSize={paginatedData.pageSize}
            totalItems={paginatedData.total}
            onPageChange={setPage}
          />
        </div>
      </main>

      {showRoleDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowRoleDropdown(false)}
        />
      )}
    </div>
  );
}
