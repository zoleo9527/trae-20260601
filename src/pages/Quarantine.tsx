import { useState } from 'react';
import { useFarmStore } from '@/store';
import { Search, Plus, Eye, CheckCircle, XCircle, Calendar, User, ShieldCheck, X } from 'lucide-react';
import type { QuarantineRecord } from '@/types';

function StatusBadge({ status }: { status: QuarantineRecord['status'] }) {
  const config = {
    pending: { label: '待审核', className: 'bg-yellow-100 text-yellow-700' },
    quarantining: { label: '隔离中', className: 'bg-orange-100 text-orange-700' },
    completed: { label: '已解除', className: 'bg-green-100 text-green-700' },
    rejected: { label: '已驳回', className: 'bg-red-100 text-red-700' },
  };
  const { label, className } = config[status];
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>{label}</span>;
}

function QuarantineModal({ record, onClose, onUpdateStatus }: { record: QuarantineRecord; onClose: () => void; onUpdateStatus: (status: QuarantineRecord['status'], reason?: string) => void }) {
  const store = useFarmStore();
  const cattle = store.getCattleById(record.cattleId);
  const vetRecord = store.getVeterinaryById(record.vetRecordId);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = () => {
    onUpdateStatus('quarantining');
    onClose();
  };

  const handleComplete = () => {
    onUpdateStatus('completed');
    onClose();
  };

  const handleReject = () => {
    if (rejectReason.trim()) {
      onUpdateStatus('rejected', rejectReason);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto fade-in">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">隔离详情 #{record.id}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {cattle ? `${cattle.tagId} ${cattle.name}` : '未知牛只'}
              </p>
              <p className="text-sm text-gray-500">{cattle?.breed} · {cattle?.weight}kg</p>
            </div>
            <StatusBadge status={record.status} />
          </div>

          {vetRecord && (
            <div className="bg-pasture-50 rounded-lg p-4">
              <p className="text-xs text-pasture-600 font-medium mb-2">关联巡诊记录</p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">#{vetRecord.id}</span>
                <span className="text-sm text-gray-500">|</span>
                <span className="text-sm text-gray-600">{vetRecord.diagnosis}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">隔离开始日期</p>
              <p className="text-sm font-medium">{record.startDate}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">隔离结束日期</p>
              <p className="text-sm font-medium">{record.endDate || '未设置'}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">隔离原因</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{record.reason}</p>
          </div>

          {record.rejectReason && (
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-xs text-red-600 font-medium mb-1">驳回原因</p>
              <p className="text-sm text-red-700">{record.rejectReason}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-200">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              操作人: {record.operator}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              创建时间: {record.createdAt}
            </span>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          {record.status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectForm(!showRejectForm)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                驳回
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-pasture-500 text-white rounded-lg hover:bg-pasture-600 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                批准隔离
              </button>
            </div>
          )}
          
          {record.status === 'quarantining' && (
            <button
              onClick={handleComplete}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              解除隔离
            </button>
          )}

          {showRejectForm && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 font-medium mb-2">请填写驳回原因</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入驳回原因..."
                className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认驳回
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Quarantine() {
  const store = useFarmStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<QuarantineRecord['status'] | 'all'>('all');
  const [selectedRecord, setSelectedRecord] = useState<QuarantineRecord | null>(null);

  const filteredRecords = store.quarantineRecords.filter(record => {
    const matchesKeyword = searchKeyword === '' || record.reason.includes(searchKeyword);
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesKeyword && matchesStatus;
  });

  const handleUpdateStatus = (id: number, status: QuarantineRecord['status'], reason?: string) => {
    store.updateQuarantineStatus(id, status, reason);
  };

  const cattleMap = new Map(store.cattle.map(c => [c.id, c]));

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">隔离管理</h2>
          <p className="text-sm text-gray-500 mt-1">管理牛只隔离记录和状态</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-pasture-500 text-white rounded-lg hover:bg-pasture-600 transition-colors">
          <Plus className="w-4 h-4" />
          新建隔离申请
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">待审核</p>
          <p className="text-2xl font-bold text-yellow-600">
            {store.quarantineRecords.filter(r => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">隔离中</p>
          <p className="text-2xl font-bold text-orange-600">
            {store.quarantineRecords.filter(r => r.status === 'quarantining').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">已解除</p>
          <p className="text-2xl font-bold text-green-600">
            {store.quarantineRecords.filter(r => r.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">已驳回</p>
          <p className="text-2xl font-bold text-red-600">
            {store.quarantineRecords.filter(r => r.status === 'rejected').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索隔离原因..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pasture-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as QuarantineRecord['status'] | 'all')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pasture-500"
            >
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="quarantining">隔离中</option>
              <option value="completed">已解除</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">编号</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">牛只信息</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">隔离原因</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">开始日期</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const cattle = cattleMap.get(record.cattleId);
                return (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 text-sm text-gray-600">#{record.id}</td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium text-gray-900">
                        {cattle ? `${cattle.tagId} ${cattle.name}` : '未知'}
                      </p>
                      <p className="text-xs text-gray-500">{cattle?.breed}</p>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate">{record.reason}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{record.startDate}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>暂无隔离记录</p>
            </div>
          )}
        </div>
      </div>

      {selectedRecord && (
        <QuarantineModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onUpdateStatus={(status, reason) => handleUpdateStatus(selectedRecord.id, status, reason)}
        />
      )}
    </div>
  );
}
