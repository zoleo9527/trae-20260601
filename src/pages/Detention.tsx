import { useState, useMemo } from 'react';
import { Eye, CheckCircle, ArrowRight, Filter } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { StatusTag } from '@/components/common/StatusTag';
import { SearchBar } from '@/components/common/SearchBar';
import { DetentionDetail } from '@/components/detention/DetentionDetail';
import { FeeAdjustModal } from '@/components/detention/FeeAdjustModal';
import { formatCurrency, formatDateTime, detentionStatusMap, userRoleMap } from '@/utils/format';
import { DetentionStatus } from '@/types';

export const Detention = () => {
  const {
    detentions,
    selectedDetentionId,
    setSelectedDetentionId,
    updateDetentionStatus,
    currentUser,
    getRolePermissions,
    getNextPendingDetention,
  } = useStore();

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const permissions = getRolePermissions(currentUser.role);
  const selectedDetention = detentions.find((d) => d.id === selectedDetentionId);
  const nextPending = getNextPendingDetention(selectedDetentionId || undefined);

  const filteredDetentions = useMemo(() => {
    return detentions.filter((d) => {
      const matchKeyword = !keyword ||
        d.orderNo.toLowerCase().includes(keyword.toLowerCase()) ||
        d.plateNumber.toLowerCase().includes(keyword.toLowerCase()) ||
        d.driverName.includes(keyword);
      const matchStatus = !statusFilter || d.status === statusFilter;
      const matchRole = !roleFilter || d.createdByRole === roleFilter;
      return matchKeyword && matchStatus && matchRole;
    });
  }, [detentions, keyword, statusFilter, roleFilter]);

  const handleConfirm = () => {
    if (selectedDetentionId) {
      updateDetentionStatus(
        selectedDetentionId,
        'confirmed',
        `${userRoleMap[currentUser.role]}确认费用无误`,
        currentUser.name,
        currentUser.role
      );
      if (nextPending) {
        setSelectedDetentionId(nextPending.id);
      } else {
        setSelectedDetentionId(null);
      }
    }
  };

  const handleNext = () => {
    if (nextPending) {
      setSelectedDetentionId(nextPending.id);
    }
  };

  const filters = [
    {
      label: '状态',
      options: Object.entries(detentionStatusMap).map(([value, config]) => ({
        value,
        label: config.label,
      })),
      value: statusFilter,
      onChange: setStatusFilter,
    },
    {
      label: '创建角色',
      options: Object.entries(userRoleMap).map(([value, label]) => ({
        value,
        label,
      })),
      value: roleFilter,
      onChange: setRoleFilter,
    },
  ];

  const pendingCount = detentions.filter((d) => d.status === 'pending').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">滞留费用管理</h2>
          <p className="text-sm text-gray-500">
            {userRoleMap[currentUser.role]}视角 - 查看和管理所有车辆滞留费用记录
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && permissions.canConfirmDetention && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded">
              <span className="text-sm text-orange-700">
                待确认 <span className="font-semibold">{pendingCount}</span> 条
              </span>
              {nextPending && (
                <button
                  onClick={() => setSelectedDetentionId(nextPending.id)}
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
        placeholder="搜索订单号、车牌号、司机姓名"
        onSearch={setKeyword}
        filters={filters}
        leftContent={
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            共 {filteredDetentions.length} 条记录
          </div>
        }
      />

      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">订单号</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">车牌号</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">司机</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">月台</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">滞留时长</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">费用</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">状态</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">创建人</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">更新时间</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDetentions.map((d) => (
                <tr
                  key={d.id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedDetentionId === d.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedDetentionId(d.id)}
                >
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{d.orderNo}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{d.plateNumber}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{d.driverName}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{d.platformNo}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{d.detentionHours}小时</td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">
                    <div>
                      {formatCurrency(d.feeAmount)}
                      {d.feeAmount !== d.originalFee && (
                        <span className="text-xs text-gray-400 line-through ml-1">
                          {formatCurrency(d.originalFee)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusTag status={d.status} type="detention" />
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {d.createdBy}
                    <span className="text-xs text-gray-400 ml-1">
                      ({userRoleMap[d.createdByRole]})
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{formatDateTime(d.updatedAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDetentionId(d.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {d.status === 'pending' && permissions.canConfirmDetention && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateDetentionStatus(
                              d.id,
                              'confirmed',
                              '列表快速确认',
                              currentUser.name,
                              currentUser.role
                            );
                          }}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="快速确认"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredDetentions.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-sm">
            暂无匹配的滞留记录
          </div>
        )}
      </div>

      <DetentionDetail
        isOpen={!!selectedDetentionId}
        onClose={() => setSelectedDetentionId(null)}
        detention={selectedDetention || null}
        onAdjustFee={() => setShowAdjustModal(true)}
        onConfirm={handleConfirm}
        onNext={nextPending ? handleNext : undefined}
        hasNext={!!nextPending}
      />

      {selectedDetention && (
        <FeeAdjustModal
          isOpen={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
          detentionId={selectedDetention.id}
          currentFee={selectedDetention.feeAmount}
        />
      )}
    </div>
  );
};
