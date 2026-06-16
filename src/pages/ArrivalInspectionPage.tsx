import { useState } from 'react';
import { Search, Thermometer, Package, AlertTriangle, Check, X } from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { statusLabels } from '../data/mockData';
import { StockRequest } from '../types';

export default function ArrivalInspectionPage() {
  const { stockRequests, addInspection, addDifference, currentUser } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actualQty, setActualQty] = useState('');
  const [actualSpec, setActualSpec] = useState('');
  const [temperature, setTemperature] = useState('');
  const [hasDifference, setHasDifference] = useState(false);
  const [differenceType, setDifferenceType] = useState<string>('');
  const [differenceDesc, setDifferenceDesc] = useState('');

  const requests = stockRequests;
  const deliverableRequests = requests.filter(r => r.status === 'delivered' && !r.inspection);

  const filteredRequests = deliverableRequests.filter(request => 
    request.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInspection = async () => {
    if (!selectedRequest) return;
    
    const request = requests.find(r => r.id === selectedRequest.id);
    if (!request) return;

    const isNormal = !hasDifference && 
      (!request.product.isCold || (temperature !== '' && parseFloat(temperature) >= 0 && parseFloat(temperature) <= 10)) &&
      actualSpec === request.product.spec &&
      Number(actualQty) === request.requestQty;

    try {
      const createdInspection = await addInspection({
        requestId: selectedRequest.id,
        actualQty: Number(actualQty),
        actualSpec: actualSpec || request.product.spec,
        temperature: request.product.isCold ? parseFloat(temperature) || null : null,
        isNormal,
        inspectorId: currentUser.id,
      });

      if (hasDifference && differenceType && differenceDesc && createdInspection) {
        await addDifference({
          inspectionId: createdInspection.id,
          type: differenceType as any,
          description: differenceDesc,
        });
      }
    } catch (err) {
      console.error('Failed to complete inspection:', err);
    }

    setShowModal(false);
    setSelectedRequest(null);
    setActualQty('');
    setActualSpec('');
    setTemperature('');
    setHasDifference(false);
    setDifferenceType('');
    setDifferenceDesc('');
  };

  const openModal = (request: StockRequest) => {
    setSelectedRequest(request);
    const req = requests.find(r => r.id === request.id);
    if (req) {
      setActualQty(req.requestQty.toString());
      setActualSpec(req.product.spec);
    }
    setShowModal(true);
  };

  const requestDetails = selectedRequest ? requests.find(r => r.id === selectedRequest.id) : null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">到货验收</h2>
          <p className="text-gray-500 mt-1">验收到货商品，记录数量、规格、温度等信息</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索待验收的商品或门店..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {filteredRequests.map(request => (
          <div key={request.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">申领单号</p>
                <p className="font-medium text-primary-600">#{String(request.id).padStart(6, '0')}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800`}>
                {statusLabels[request.status]}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <Package className="w-5 h-5 mr-3 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">{request.product.name}</p>
                  <p className="text-sm text-gray-500">{request.product.spec}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">门店</span>
                <span className="font-medium">{request.store.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">申领数量</span>
                <span className="font-medium">{request.requestQty} {request.product.unit}</span>
              </div>
              {request.product.isCold && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">冷链商品</span>
                  <span className="flex items-center text-blue-600">
                    <Thermometer className="w-4 h-4 mr-1" /> 需要测温
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => openModal(request)}
              className="w-full mt-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              开始验收
            </button>
          </div>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无待验收的商品</p>
        </div>
      )}

      {showModal && selectedRequest && requestDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">到货验收</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">商品</span>
                <span className="font-medium">{requestDetails.product.name}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">规格</span>
                <span className="font-medium">{requestDetails.product.spec}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">门店</span>
                <span className="font-medium">{requestDetails.store.name}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">申领数量</span>
                <span className="font-medium">{requestDetails.requestQty} {requestDetails.product.unit}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">实际到货数量</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={actualQty}
                    onChange={(e) => setActualQty(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="ml-2 text-gray-500">{requestDetails.product.unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">实际规格</label>
                <input
                  type="text"
                  value={actualSpec}
                  onChange={(e) => setActualSpec(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-400 mt-1">原规格: {requestDetails.product.spec}</p>
              </div>

              {requestDetails.product.isCold && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Thermometer className="w-4 h-4 inline mr-1" />
                    冷链温度 (°C)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <span className="ml-2 text-gray-500">°C</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">标准范围: 0-10°C</p>
                </div>
              )}

              <div className="flex items-center">
                <button
                  onClick={() => setHasDifference(!hasDifference)}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    hasDifference
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {hasDifference ? (
                    <>
                      <X className="w-4 h-4 mr-2" /> 取消异常
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" /> 登记异常
                    </>
                  )}
                </button>
              </div>

              {hasDifference && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-red-700 mb-2">异常类型</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      { value: 'shortage', label: '少配' },
                      { value: 'wrong_spec', label: '错配' },
                      { value: 'temperature', label: '温度异常' },
                      { value: 'other', label: '其他' },
                    ].map(type => (
                      <button
                        key={type.value}
                        onClick={() => setDifferenceType(type.value)}
                        className={`px-3 py-1 rounded-full text-xs transition-colors ${
                          differenceType === type.value
                            ? 'bg-red-600 text-white'
                            : 'bg-white text-red-700 border border-red-300'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={differenceDesc}
                    onChange={(e) => setDifferenceDesc(e.target.value)}
                    placeholder="请描述异常情况..."
                    className="w-full px-3 py-2 border border-red-300 rounded-lg bg-white"
                    rows={3}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleInspection}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Check className="w-4 h-4 mr-2" />
                完成验收
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
