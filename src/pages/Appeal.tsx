import { useState, useMemo } from 'react';
import { Eye, Bell, ArrowRight, Filter } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { StatusTag } from '@/components/common/StatusTag';
import { SearchBar } from '@/components/common/SearchBar';
import { AppealDetail } from '@/components/appeal/AppealDetail';
import { AppealProcessModal } from '@/components/appeal/AppealProcessModal';
import { formatCurrency, formatDateTime, appealStatusMap, userRoleMap } from '@/utils/format';

export const Appeal = () => {
  const {
    appeals,
    selectedAppealId,
    setSelectedAppealId,
    currentUser,
    getRolePermissions,
    getNextPendingAppeal,
    updateAppealStatus,
  } = useStore();

  const [showProcessModal, setShowProcessModal] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [onlyFeeUpdated, setOnlyFeeUpdated] = useState(false);

  const permissions = getRolePermissions(currentUser.role);
  const selectedAppeal = appeals.find((a) => a.id === selectedAppealId);
  const nextPending = getNextPendingAppeal(selectedAppealId || undefined);

  const filteredAppeals = useMemo(() => {
    return appeals.filter((a) => {
      const matchKeyword = !keyword ||
        a.driverName.includes(keyword) ||
        a.detention?.orderNo.toLowerCase().includes(keyword.toLowerCase()) ||
        a.appealReason.includes(keyword);
      const matchStatus = !statusFilter || a.status === statusFilter;
      const matchFeeUpdate = !onlyFeeUpdated || a.hasFeeUpdate;
      return matchKeyword && matchStatus && matchFeeUpdate;
    });
  }, [appeals, keyword, statusFilter, onlyFeeUpdated]);

  const handleProcessed = () => {
    if (nextPending) {
      setSelectedAppealId(nextPending.id);
    } else {
      setSelectedAppealId(null);
    }
  };

  const handleNext = () => {
    if (nextPending) {
      setSelectedAppealId(nextPending.id);
    }
  };

  const handleQuickProcess = (appealId: string, status: 'processing') => {
    updateAppealStatus(
      appealId,
      status,
      '开始处理',
      '仓库文员开始处理申诉',
      currentUser.name,
      currentUser.role
    );
    setSelectedAppealId(appealId);
    setShowProcessModal(true);
  };

  const filters = [
    {
      label: '状态',
      options: Object.entries(appealStatusMap).map(([value, config]) => ({
        value,
        label: config.label,
      })),
      value: statusFilter,
      onChange: setStatusFilter,
    },
  ];

  const pendingCount = appeals.filter(
    (a) => a.status === 'pending' || a.status === 'processing'
  ).length;
  const feeUpdatedCount = appeals.filter((a) => a.hasFeeUpdate).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">司机申诉管理</h2>
          <p className="text-sm text-gray-500">
            {userRoleMap[currentUser.role]}视角 - 处理司机申诉，关联滞留单核查，保障公正透明
          </p>
        </div>
        <div className="flex items-center gap-3">
          {feeUpdatedCount > 0 && (
            <button
              onClick={() => setOnlyFeeUpdated(!onlyFeeUpdated)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors ${
                onlyFeeUpdated
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-cyan-300'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span className="text-sm">费用已更新</span>
              <span className="text-xs font-medium">{feeUpdatedCount}</span>
            </button>
          )}
          {pendingCount > 0 && permissions.canProcessAppeal && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded">
              <span className="text-sm text-orange-700">
                待处理 <span className="font-semibold">{pendingCount}</span> 条
              </span>
              {nextPending && (
                <button
                  onClick={() => {
                    setSelectedAppealId(nextPending.id);
                    setShowProcessModal(true);
                  }}
                  className="text-xs px-2 py-0.5 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  快速处理
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <SearchBar
        placeholder="搜索司机姓名、订单号、申诉内容"
        onSearch={setKeyword}
        filters={filters}
        leftContent={
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            共 {filteredAppeals.length} 条记录
          </div>
        }
      />

      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">申诉编号</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">关联订单</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">司机</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">申诉内容</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">申请减免</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">当前费用</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">状态</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">更新时间</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAppeals.map((a) => (
                <tr
                  key={a.id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedAppealId === a.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedAppealId(a.id)}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">#{a.id}</span>
                      {a.hasFeeUpdate && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded">
                          <Bell className="w-3 h-3" />
                          费用更新
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{a.detention?.orderNo || '-'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{a.driverName}</td>
                  <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {a.appealReason}
                  </td>
                  <td className="px-5 py-3 text-sm text-orange-600 font-medium">
                    {formatCurrency(a.requestedAdjustment)}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-900">
                    <div>
                      {formatCurrency(a.detention?.feeAmount || 0)}
                      {a.detention && a.detention.feeAmount !== a.detention.originalFee && (
                        <span className="text-xs text-gray-400 line-through ml-1">
                          {formatCurrency(a.detention.originalFee)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusTag status={a.status} type="appeal" />
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {formatDateTime(a.processedAt || a.submittedAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppealId(a.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(a.status === 'pending') && permissions.canProcessAppeal && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickProcess(a.id, 'processing');
                          }}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="快速处理"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAppeals.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-sm">
            暂无匹配的申诉记录
          </div>
        )}
      </div>

      <AppealDetail
        isOpen={!!selectedAppealId}
        onClose={() => setSelectedAppealId(null)}
        appeal={selectedAppeal || null}
        onProcess={() => setShowProcessModal(true)}
        onNext={nextPending ? handleNext : undefined}
        hasNext={!!nextPending}
      />

      {selectedAppealId && (
        <AppealProcessModal
          isOpen={showProcessModal}
          onClose={() => setShowProcessModal(false)}
          appealId={selectedAppealId}
          onProcessed={handleProcessed}
        />
      )}
    </div>
  );
};
