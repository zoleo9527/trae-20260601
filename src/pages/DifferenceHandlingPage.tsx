import { useState } from 'react';
import { Search, Filter, AlertTriangle, Check, Clock, Package, FileText } from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { differenceTypeLabels, differenceStatusLabels, statusLabels } from '../data/mockData';
import { Difference } from '../types';

export default function DifferenceHandlingPage() {
  const { stockRequests, differences, updateDifferenceStatus, currentUser, users } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDifference, setSelectedDifference] = useState<Difference | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processingResult, setProcessingResult] = useState('');

  const getRequestForInspection = (inspectionId: number) => {
    return stockRequests.find(r => r.inspection?.id === inspectionId);
  };

  const filteredDifferences = differences.filter(diff => {
    const request = getRequestForInspection(diff.inspectionId);
    const matchesSearch = !searchTerm || 
      (request && (request.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   request.store.name.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesStatus = statusFilter === 'all' || diff.status === statusFilter;
    const matchesType = typeFilter === 'all' || diff.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const typeColors: Record<string, string> = {
    shortage: 'bg-orange-100 text-orange-800',
    wrong_spec: 'bg-purple-100 text-purple-800',
    temperature: 'bg-blue-100 text-blue-800',
    other: 'bg-gray-100 text-gray-800',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
  };

  const canHandle = currentUser.role === 'purchaser' || currentUser.role === 'supervisor';

  const handleResolve = () => {
    if (!selectedDifference) return;
    updateDifferenceStatus(selectedDifference.id, 'resolved', processingResult, currentUser.id);
    setShowModal(false);
    setSelectedDifference(null);
    setProcessingResult('');
  };

  const handleProcessing = () => {
    if (!selectedDifference) return;
    updateDifferenceStatus(selectedDifference.id, 'processing', undefined, currentUser.id);
    setShowModal(false);
    setSelectedDifference(null);
    setProcessingResult('');
  };

  const stats = {
    total: differences.length,
    pending: differences.filter(d => d.status === 'pending').length,
    processing: differences.filter(d => d.status === 'processing').length,
    resolved: differences.filter(d => d.status === 'resolved').length,
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">差异处理</h2>
          <p className="text-gray-500 mt-1">处理验收中发现的差异问题</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">总差异数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">待处理</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">处理中</p>
              <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">已解决</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索商品或门店..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-6 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
            >
              <option value="all">全部状态</option>
              {Object.entries(differenceStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-10 pr-6 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
            >
              <option value="all">全部类型</option>
              {Object.entries(differenceTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">差异编号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">门店</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">差异类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">描述</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">处理结果</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDifferences.map(diff => {
                const request = getRequestForInspection(diff.inspectionId);
                return (
                  <tr key={diff.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-primary-600">#{String(diff.id).padStart(6, '0')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2 text-primary-500" />
                        <span>{request?.product.name || '未知'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{request?.store.name || '未知'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeColors[diff.type]}`}>
                        {differenceTypeLabels[diff.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs">
                      <p className="truncate">{diff.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[diff.status]}`}>
                        {differenceStatusLabels[diff.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {diff.processingResult ? (
                        <div className="max-w-xs">
                          <p className="text-sm text-green-600 truncate">{diff.processingResult}</p>
                          {diff.handlerId && (
                            <p className="text-xs text-gray-400 mt-1">处理人: {users.find(u => u.id === diff.handlerId)?.name}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedDifference(diff)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                          title="查看详情"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                        {diff.status === 'pending' && canHandle && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedDifference(diff);
                                handleProcessing();
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="开始处理"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDifference(diff);
                                setShowModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="标记已解决"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {diff.status === 'processing' && canHandle && (
                          <button
                            onClick={() => {
                              setSelectedDifference(diff);
                              setShowModal(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="标记已解决"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredDifferences.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mt-6">
          <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无差异记录</p>
        </div>
      )}

      {showModal && selectedDifference && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认解决</h3>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">差异类型</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[selectedDifference.type]}`}>
                  {differenceTypeLabels[selectedDifference.type]}
                </span>
              </div>
              <div>
                <span className="text-gray-500">问题描述</span>
                <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedDifference.description}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">处理结果</label>
                <textarea
                  value={processingResult}
                  onChange={(e) => setProcessingResult(e.target.value)}
                  placeholder="请描述处理结果..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleResolve}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                确认解决
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDifference && !showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedDifference(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">差异详情</h3>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">差异编号</span>
                <span className="font-medium text-primary-600">#{String(selectedDifference.id).padStart(6, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">差异类型</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[selectedDifference.type]}`}>
                  {differenceTypeLabels[selectedDifference.type]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">当前状态</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedDifference.status]}`}>
                  {differenceStatusLabels[selectedDifference.status]}
                </span>
              </div>
              <div>
                <span className="text-gray-500">问题描述</span>
                <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedDifference.description}</p>
              </div>
              {selectedDifference.processingResult && (
                <div>
                  <span className="text-gray-500">处理结果</span>
                  <p className="mt-1 text-green-600 bg-green-50 p-3 rounded-lg">{selectedDifference.processingResult}</p>
                  {selectedDifference.handlerId && (
                    <p className="text-sm text-gray-500 mt-2">处理人: {users.find(u => u.id === selectedDifference.handlerId)?.name}</p>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedDifference(null)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
