import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, User, Calendar, Tag } from 'lucide-react';
import { MeasurementSheet } from '@/components/OrderDetail/MeasurementSheet';
import { FittingTimeline } from '@/components/OrderDetail/FittingTimeline';
import { AdjustmentPanel } from '@/components/OrderDetail/AdjustmentPanel';
import { useOrderStore } from '@/store/orderStore';
import { getOrderById, getMeasurementsByOrderId, getFittingRecordsByOrderId, getAdjustmentsByOrderId, updateAdjustmentStatus } from '@/data/mockData';
import { Loader2 } from 'lucide-react';
import type { Adjustment } from '@/types';

interface OrderDetailProps {
  orderId: string;
  onBack: () => void;
}

const statusConfig = {
  pending: { label: '待量体', color: 'bg-gray-100 text-gray-600' },
  fitting: { label: '试穿中', color: 'bg-blue-100 text-blue-600' },
  adjusting: { label: '调整中', color: 'bg-coral-100 text-coral-600' },
  completed: { label: '已完成', color: 'bg-mint-100 text-mint-600' },
};

const productConfig = {
  suit: { label: '西装', icon: '👔' },
  'wedding-dress': { label: '婚纱', icon: '👰' },
  custom: { label: '定制', icon: '🎩' },
};

export function OrderDetail({ orderId, onBack }: OrderDetailProps) {
  const { setSelectedOrder, selectedOrder, setMeasurements, measurements, setFittingRecords, fittingRecords, setAdjustments, adjustments } = useOrderStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'measurements' | 'fitting' | 'adjustments'>('measurements');

  useEffect(() => {
    const loadOrderData = async () => {
      setLoading(true);
      const [order, measurementList, fittingList, adjustmentList] = await Promise.all([
        getOrderById(orderId),
        getMeasurementsByOrderId(orderId),
        getFittingRecordsByOrderId(orderId),
        getAdjustmentsByOrderId(orderId),
      ]);
      
      if (order) {
        setSelectedOrder(order);
      }
      setMeasurements(measurementList);
      setFittingRecords(fittingList);
      setAdjustments(adjustmentList);
      setLoading(false);
    };
    
    loadOrderData();
  }, [orderId, setSelectedOrder, setMeasurements, setFittingRecords, setAdjustments]);

  const handleUpdateStatus = async (adjustmentId: string, status: Adjustment['status']) => {
    await updateAdjustmentStatus(adjustmentId, status);
    const updatedAdjustments = await getAdjustmentsByOrderId(orderId);
    setAdjustments(updatedAdjustments);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-navy-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!selectedOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-navy-600 hover:text-navy-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回工作台</span>
        </button>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500">订单不存在</p>
        </div>
      </div>
    );
  }

  const status = statusConfig[selectedOrder.status];
  const product = productConfig[selectedOrder.productType];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-navy-600 hover:text-navy-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回工作台</span>
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-navy-900 text-white p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{product.icon}</span>
                <div>
                  <h1 className="text-xl font-bold">{selectedOrder.customerName}</h1>
                  <p className="text-navy-300 text-sm">{selectedOrder.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                  {status.label}
                </span>
                <span className="text-sm text-navy-300">{product.label}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4" />
            <span className="text-sm">负责人: {selectedOrder.assignee}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">创建时间: {selectedOrder.createdAt}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">预计交付: {selectedOrder.expectedDelivery}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Tag className="w-4 h-4" />
            <span className="text-sm">产品类型: {product.label}</span>
          </div>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('measurements')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'measurements'
                ? 'text-navy-900 border-b-2 border-navy-600 bg-navy-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            量体单
          </button>
          <button
            onClick={() => setActiveTab('fitting')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'fitting'
                ? 'text-navy-900 border-b-2 border-navy-600 bg-navy-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            试衣记录
          </button>
          <button
            onClick={() => setActiveTab('adjustments')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'adjustments'
                ? 'text-navy-900 border-b-2 border-navy-600 bg-navy-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            售后调整
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'measurements' && measurements.length > 0 && (
            <MeasurementSheet measurement={measurements[0]} />
          )}
          {activeTab === 'measurements' && measurements.length === 0 && (
            <div className="text-center py-8 text-gray-500">暂无量体数据</div>
          )}
          
          {activeTab === 'fitting' && (
            <FittingTimeline records={fittingRecords} />
          )}
          
          {activeTab === 'adjustments' && (
            <AdjustmentPanel 
              adjustments={adjustments} 
              onUpdateStatus={handleUpdateStatus}
            />
          )}
        </div>
      </div>
    </div>
  );
}
