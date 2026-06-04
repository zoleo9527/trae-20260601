import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { PACKAGING_STATUS_LABELS, PACKAGING_STATUS_COLORS, ROLE_LABELS } from '../types';
import type { PackagingRequisition } from '../types';

export default function PackagingList() {
  const { currentUser, refreshTrigger } = useContext(AppContext);
  const [requisitions, setRequisitions] = useState<PackagingRequisition[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/packaging-requisitions').then(r => r.json()).then(setRequisitions);
  }, [refreshTrigger]);

  const filteredRequisitions = filter === 'all'
    ? requisitions
    : requisitions.filter(r => r.status === filter);

  const statusFilters = [
    { key: 'all', label: '全部' },
    { key: 'PENDING', label: '待审核' },
    { key: 'APPROVED', label: '已通过' },
    { key: 'ISSUED', label: '已发放' },
    { key: 'REJECTED', label: '已退回' },
    { key: 'COMPLETED', label: '已完成' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">包装领用</h1>
          <p className="text-gray-500 mt-1">管理包装材料领用申请</p>
        </div>
        <button onClick={() => navigate('/packaging/new')} className="btn-primary">
          + 新建包装领用
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm rounded-full transition-all ${
              filter === f.key
                ? 'bg-beer-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-beer-300'
            }`}
          >
            {f.label}
            <span className="ml-1 opacity-75">
              ({f.key === 'all' ? requisitions.length : requisitions.filter(r => r.status === f.key).length})
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">领用单号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联产品</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">包装规格</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">需求日期</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前处理</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提醒</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequisitions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              filteredRequisitions.map(req => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm font-medium text-gray-900">{req.requisitionNo}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{req.schedule?.productName}</div>
                    <div className="text-sm text-gray-500">{req.schedule?.batchNo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {req.bottleType} · {req.bottleCount}个
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.requiredDate).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`status-badge ${PACKAGING_STATUS_COLORS[req.status]}`}>
                      {PACKAGING_STATUS_LABELS[req.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      req.currentHandler === currentUser?.role
                        ? 'bg-beer-100 text-beer-700 font-medium'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {ROLE_LABELS[req.currentHandler]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {req.hasPendingChange ? (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded flex items-center space-x-1 animate-pulse border border-orange-200">
                        <span>⚠️</span>
                        <span>变更待处置({req.pendingChangeCount})</span>
                      </span>
                    ) : req.hasConfirmedChange ? (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center space-x-1 border border-green-200">
                        <span>✓</span>
                        <span>变更已处置</span>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => navigate(`/packaging/${req.id}`)}
                      className="text-beer-600 hover:text-beer-700 font-medium"
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
