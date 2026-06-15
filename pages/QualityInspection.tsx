import React, { useState } from 'react';
import { CheckSquare, XSquare, Clock, FileText, AlertTriangle, ChevronRight, Search, Filter, Edit2, Save, Eye } from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { QualityInspection as QualityInspectionType } from '../types';

export default function QualityInspection() {
  const { orders, qualityInspections, updateCheckItem, updateQualityInspection } = useAppStore();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRemark, setEditingRemark] = useState<string | null>(null);
  const [remarkValue, setRemarkValue] = useState('');

  const ordersForQuality = orders.filter(o => o.status === 'quality_check' || o.status === 'completed');
  const filteredOrders = ordersForQuality.filter(order => {
    const matchesSearch = order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getInspectionForOrder = (orderId: string): QualityInspectionType | undefined => {
    return qualityInspections.find(qi => qi.productionOrderId === orderId);
  };

  const selectedInspection = selectedOrder ? getInspectionForOrder(selectedOrder) : null;

  const handleCheckResult = (inspectionId: string, itemId: string, result: 'pass' | 'fail' | 'pending') => {
    updateCheckItem(inspectionId, itemId, result, '');
  };

  const startEditRemark = (itemId: string, currentRemark: string) => {
    setEditingRemark(itemId);
    setRemarkValue(currentRemark);
  };

  const saveRemark = (inspectionId: string, itemId: string) => {
    const inspection = qualityInspections.find(qi => qi.id === inspectionId);
    if (inspection) {
      const item = inspection.checkItems.find(i => i.id === itemId);
      if (item) {
        updateCheckItem(inspectionId, itemId, item.result, remarkValue);
      }
    }
    setEditingRemark(null);
    setRemarkValue('');
  };

  const resultColors = {
    pass: 'bg-green-100 text-green-700 border-green-200',
    fail: 'bg-red-100 text-red-700 border-red-200',
    pending: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  const resultIcons = {
    pass: CheckSquare,
    fail: XSquare,
    pending: Clock
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">成品质检</h2>
          <p className="text-gray-500 mt-1">检查产品质量，记录质检结果与备注</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索订单号、产品名或客户..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部</option>
                  <option value="quality_check">质检中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredOrders.map(order => {
              const inspection = getInspectionForOrder(order.id);
              const isSelected = selectedOrder === order.id;
              
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order.id)}
                  className={`p-4 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">{order.orderNo.slice(-3)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{order.productName}</p>
                        <p className="text-sm text-gray-500">{order.orderNo} · {order.customer.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {inspection && (
                        <span className={`px-3 py-1 text-xs rounded-full border ${resultColors[inspection.overallResult]}`}>
                          {inspection.overallResult === 'pass' && '已通过'}
                          {inspection.overallResult === 'fail' && '未通过'}
                          {inspection.overallResult === 'pending' && '进行中'}
                        </span>
                      )}
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  
                  {inspection && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          质检员: {inspection.inspector}
                        </span>
                        <span>更新于: {inspection.updatedAt}</span>
                        {inspection.revisionCount > 0 && (
                          <span className="text-red-500 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            修改{inspection.revisionCount}次
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-96 bg-white rounded-xl shadow-sm border border-gray-100">
          {selectedOrder && selectedInspection ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">质检详情</h3>
                <button className="p-2 hover:bg-gray-100 rounded-lg" title="查看图纸">
                  <Eye className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">设计规格</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">字体版本:</span>
                    <span className="font-medium">{selectedInspection.order.designSpec.fontName} {selectedInspection.order.designSpec.fontVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">材料:</span>
                    <span className="font-medium">{selectedInspection.order.designSpec.material}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">尺寸:</span>
                    <span className="font-medium">{selectedInspection.order.designSpec.size}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">颜色:</span>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: selectedInspection.order.designSpec.colorCode }} />
                      <span className="font-medium">{selectedInspection.order.designSpec.colorCode}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">现场勘测信息</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">安装高度:</span>
                    <span className="font-medium">{selectedInspection.order.siteSurvey.height}米</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">安装方式:</span>
                    <span className="font-medium">
                      {selectedInspection.order.siteSurvey.installationType === 'wall' && '墙面安装'}
                      {selectedInspection.order.siteSurvey.installationType === 'ground' && '地面安装'}
                      {selectedInspection.order.siteSurvey.installationType === 'hanging' && '悬挂安装'}
                      {selectedInspection.order.siteSurvey.installationType === 'ceiling' && '吊顶安装'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">作业方式:</span>
                    <span className="font-medium">
                      {selectedInspection.order.siteSurvey.accessType === 'ladder' && '梯子'}
                      {selectedInspection.order.siteSurvey.accessType === 'scaffold' && '脚手架'}
                      {selectedInspection.order.siteSurvey.accessType === 'crane' && '吊车'}
                      {selectedInspection.order.siteSurvey.accessType === 'elevator' && '升降机'}
                    </span>
                  </div>
                  {selectedInspection.order.siteSurvey.notes && (
                    <div>
                      <span className="text-gray-500 block">备注:</span>
                      <span className="font-medium">{selectedInspection.order.siteSurvey.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">质检项目</h4>
                <div className="space-y-3">
                  {selectedInspection.checkItems.map(item => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <div className="flex items-center gap-2">
                          {['pass', 'fail', 'pending'].map(result => {
                            const Icon = resultIcons[result as keyof typeof resultIcons];
                            const isSelected = item.result === result;
                            return (
                              <button
                                key={result}
                                onClick={() => handleCheckResult(selectedInspection!.id, item.id, result as 'pass' | 'fail' | 'pending')}
                                className={`p-1.5 rounded transition-colors ${isSelected ? resultColors[result as keyof typeof resultColors] : 'hover:bg-gray-200'}`}
                              >
                                <Icon className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">标准: {item.standard}</p>
                      <div className="flex items-center gap-2">
                        {editingRemark === item.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={remarkValue}
                              onChange={(e) => setRemarkValue(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="输入备注..."
                            />
                            <button
                              onClick={() => saveRemark(selectedInspection!.id, item.id)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 text-sm text-gray-600 truncate">
                              {item.remark || '暂无备注'}
                            </span>
                            <button
                              onClick={() => startEditRemark(item.id, item.remark)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                      {item.checkedBy && (
                        <p className="text-xs text-gray-400 mt-1">
                          检查人: {item.checkedBy} · {item.checkedAt}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">质检结论</span>
                  <span className={`px-3 py-1 text-sm rounded-full font-medium ${resultColors[selectedInspection.overallResult]}`}>
                    {selectedInspection.overallResult === 'pass' && '全部通过'}
                    {selectedInspection.overallResult === 'fail' && '存在问题'}
                    {selectedInspection.overallResult === 'pending' && '进行中'}
                  </span>
                </div>
                <textarea
                  value={selectedInspection.remarks}
                  onChange={(e) => updateQualityInspection(selectedInspection.id, { remarks: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="输入质检备注..."
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <CheckSquare className="w-12 h-12 mb-3 opacity-50" />
              <p>选择一个订单查看质检详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}