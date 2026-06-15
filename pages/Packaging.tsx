import React, { useState } from 'react';
import { Package, CheckSquare, Truck, FileText, AlertTriangle, ChevronRight, Search, Plus, Edit2, Save, Send, History } from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { Shipment } from '../types';

export default function Packaging() {
  const { orders, qualityInspections, shipments, updatePackagingItem, updateShipmentStatus, createShipment } = useAppStore();
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const qualityPassedOrders = orders.filter(o => {
    const inspection = qualityInspections.find(qi => qi.productionOrderId === o.id);
    return inspection?.overallResult === 'pass' && o.status !== 'shipped';
  });

  const ordersWithoutShipment = qualityPassedOrders.filter(o => !shipments.find(s => s.productionOrderId === o.id));

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipment.order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.order.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = showHistory ? shipment.status === 'shipped' : shipment.status !== 'shipped';
    return matchesSearch && matchesStatus;
  });

  const selectedShipmentData = selectedShipment ? shipments.find(s => s.id === selectedShipment) : null;

  const handlePackagingItemStatus = (shipmentId: string, itemId: string, status: 'packed' | 'missing' | 'pending') => {
    updatePackagingItem(shipmentId, itemId, status);
  };

  const handleCreateShipment = (orderId: string) => {
    createShipment(orderId);
  };

  const handleShip = (shipmentId: string) => {
    updateShipmentStatus(shipmentId, 'shipped');
  };

  const statusColors = {
    packaging: 'bg-yellow-100 text-yellow-700',
    ready: 'bg-green-100 text-green-700',
    shipped: 'bg-gray-100 text-gray-700',
    delivered: 'bg-blue-100 text-blue-700'
  };

  const statusLabels = {
    packaging: '打包中',
    ready: '待发货',
    shipped: '已发货',
    delivered: '已送达'
  };

  const packagingStatusColors = {
    packed: 'bg-green-100 text-green-700',
    missing: 'bg-red-100 text-red-700',
    pending: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">打包出库</h2>
          <p className="text-gray-500 mt-1">管理打包进度，查看质检备注，完成出库发货</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showHistory ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          <History className="w-4 h-4" />
          {showHistory ? '查看在途' : '查看历史'}
        </button>
      </div>

      {ordersWithoutShipment.length > 0 && !showHistory && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-green-600" />
            待创建打包单
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {ordersWithoutShipment.map(order => {
              const inspection = qualityInspections.find(qi => qi.productionOrderId === order.id);
              return (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{order.productName}</p>
                    <p className="text-sm text-gray-500">{order.orderNo}</p>
                  </div>
                  <button
                    onClick={() => handleCreateShipment(order.id)}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    创建打包单
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索订单号、产品名或客户..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredShipments.map(shipment => {
              const isSelected = selectedShipment === shipment.id;
              const packedCount = shipment.packagingItems.filter(item => item.status === 'packed').length;
              const totalCount = shipment.packagingItems.length;
              const progress = (packedCount / totalCount) * 100;

              return (
                <div
                  key={shipment.id}
                  onClick={() => setSelectedShipment(shipment.id)}
                  className={`p-4 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{shipment.order.productName}</p>
                        <p className="text-sm text-gray-500">{shipment.order.orderNo} · {shipment.order.customer.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{packedCount}/{totalCount} 已打包</p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full ${statusColors[shipment.status]}`}>
                        {statusLabels[shipment.status]}
                      </span>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {shipment.qualityInspection.revisionCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm text-red-500">
                      <AlertTriangle className="w-4 h-4" />
                      <span>质检曾修改{shipment.qualityInspection.revisionCount}次，请注意查看备注</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredShipments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Package className="w-12 h-12 mb-3 opacity-50" />
              <p>{showHistory ? '暂无历史记录' : '暂无打包订单'}</p>
            </div>
          )}
        </div>

        <div className="w-96 bg-white rounded-xl shadow-sm border border-gray-100">
          {selectedShipmentData ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">打包详情</h3>
                {selectedShipmentData.status === 'ready' && (
                  <button
                    onClick={() => handleShip(selectedShipmentData.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    确认发货
                  </button>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">订单信息</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">订单号:</span>
                    <span className="font-medium">{selectedShipmentData.order.orderNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">产品:</span>
                    <span className="font-medium">{selectedShipmentData.order.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">数量:</span>
                    <span className="font-medium">{selectedShipmentData.order.quantity}件</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">客户:</span>
                    <span className="font-medium">{selectedShipmentData.order.customer.name}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  质检备注
                </h4>
                <p className="text-sm text-blue-700">
                  {selectedShipmentData.qualityInspection.remarks || '无质检备注'}
                </p>
                <div className="mt-3 space-y-2">
                  {selectedShipmentData.qualityInspection.checkItems
                    .filter(item => item.remark)
                    .map(item => (
                      <div key={item.id} className="flex items-start gap-2">
                        <span className={`w-2 h-2 rounded-full mt-1.5 ${item.result === 'fail' ? 'bg-red-500' : 'bg-green-500'}`} />
                        <span className="text-xs text-blue-600">
                          <span className="font-medium">{item.name}:</span> {item.remark}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">打包清单</h4>
                <div className="space-y-2">
                  {selectedShipmentData.packagingItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">数量: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {['packed', 'pending', 'missing'].map(status => (
                          <button
                            key={status}
                            onClick={() => handlePackagingItemStatus(selectedShipmentData!.id, item.id, status as 'packed' | 'missing' | 'pending')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${item.status === status ? packagingStatusColors[status] : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                          >
                            {status === 'packed' && '已装'}
                            {status === 'pending' && '待装'}
                            {status === 'missing' && '缺失'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">箱数:</span>
                    <input
                      type="number"
                      defaultValue={selectedShipmentData.boxCount}
                      className="w-full mt-1 px-2 py-1 border border-gray-200 rounded text-center"
                    />
                  </div>
                  <div>
                    <span className="text-gray-500">重量(kg):</span>
                    <input
                      type="number"
                      defaultValue={selectedShipmentData.weight}
                      className="w-full mt-1 px-2 py-1 border border-gray-200 rounded text-center"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-gray-500 text-sm">物流公司:</span>
                  <input
                    type="text"
                    defaultValue={selectedShipmentData.shippingMethod}
                    className="w-full mt-1 px-2 py-1 border border-gray-200 rounded text-sm"
                    placeholder="输入物流公司"
                  />
                </div>
                <div className="mt-3">
                  <span className="text-gray-500 text-sm">运单号:</span>
                  <input
                    type="text"
                    defaultValue={selectedShipmentData.trackingNo}
                    className="w-full mt-1 px-2 py-1 border border-gray-200 rounded text-sm"
                    placeholder="输入运单号"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <Package className="w-12 h-12 mb-3 opacity-50" />
              <p>选择一个打包单查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}