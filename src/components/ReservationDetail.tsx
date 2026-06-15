import { useState } from 'react';
import { useAppStore } from '../store';
import { UserRole } from '../types';
import { 
  Warehouse, AlertTriangle, CheckCircle, XCircle, ChevronLeft, 
  Package, Calendar, Send, CheckCircle2, Truck, Clock, Lock
} from 'lucide-react';

interface ReservationDetailProps {
  reservationId: string;
  onBack: () => void;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: '待处理', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock },
  reserved: { label: '已预留', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: CheckCircle },
  shipped: { label: '已发货', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Truck },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2 },
  cancelled: { label: '已取消', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
};

const roleLabel: Record<UserRole, string> = {
  sales: '导购',
  designer: '设计师',
  warehouse: '仓库员',
};

export default function ReservationDetail({ reservationId, onBack }: ReservationDetailProps) {
  const reservation = useAppStore((state) => state.reservations.find(r => r.id === reservationId));
  const colorLock = useAppStore((state) => state.colorLocks.find(l => l.id === reservation?.colorLockId));
  const currentUser = useAppStore((state) => state.currentUser);
  const updateReservation = useAppStore((state) => state.updateReservation);
  const addRemarkToReservation = useAppStore((state) => state.addRemarkToReservation);
  const updateColorLock = useAppStore((state) => state.updateColorLock);

  const [remarkText, setRemarkText] = useState('');
  const [actualQuantity, setActualQuantity] = useState('');

  if (!reservation || !currentUser) return null;

  const status = statusConfig[reservation.status];
  const StatusIcon = status.icon;

  const handleAddRemark = () => {
    if (!remarkText.trim()) return;
    addRemarkToReservation(reservationId, {
      content: remarkText,
      author: currentUser.name,
      authorRole: currentUser.role,
    });
    setRemarkText('');
  };

  const handleReserve = () => {
    updateReservation(reservationId, { status: 'reserved' });
    addRemarkToReservation(reservationId, {
      content: `${currentUser.name}已确认预留库存`,
      author: currentUser.name,
      authorRole: currentUser.role,
    });
  };

  const handleShip = () => {
    const qty = parseInt(actualQuantity) || reservation.reservedQuantity;
    updateReservation(reservationId, { 
      status: 'shipped',
      actualQuantity: qty 
    });
    addRemarkToReservation(reservationId, {
      content: `已发货，数量：${qty}片`,
      author: currentUser.name,
      authorRole: currentUser.role,
    });
  };

  const handleComplete = () => {
    updateReservation(reservationId, { status: 'completed' });
    addRemarkToReservation(reservationId, {
      content: `${currentUser.name}已确认完成`,
      author: currentUser.name,
      authorRole: currentUser.role,
    });
    if (colorLock) {
      updateColorLock(colorLock.id, { status: 'completed' });
    }
  };

  const canReserve = currentUser.role === 'warehouse' && reservation.status === 'pending';
  const canShip = currentUser.role === 'warehouse' && reservation.status === 'reserved';
  const canComplete = currentUser.role === 'warehouse' && reservation.status === 'shipped';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>返回列表</span>
        </button>
      </div>

      <div className={`bg-white rounded-2xl border ${reservation.responsibilityFlag ? 'border-amber-200' : 'border-slate-200'} overflow-hidden`}>
        <div className={`p-6 ${reservation.responsibilityFlag ? 'bg-amber-50' : 'bg-gradient-to-r from-purple-50 to-indigo-50'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center">
                <Warehouse className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl font-bold text-slate-800">{reservation.id}</span>
                  <span className="text-lg text-slate-600">{reservation.colorNo}</span>
                </div>
                <p className="text-slate-500">{reservation.colorName} - {reservation.productName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {reservation.responsibilityFlag && (
                <span className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">责任不清</span>
                </span>
              )}
              <span className={`flex items-center gap-2 px-4 py-2 ${status.bgColor} ${status.color} rounded-xl`}>
                <StatusIcon className="w-5 h-5" />
                <span className="font-medium">{status.label}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Package className="w-4 h-4" />
                <span className="text-sm">预留数量</span>
              </div>
              <p className="font-semibold text-slate-800">{reservation.reservedQuantity} 片</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Warehouse className="w-4 h-4" />
                <span className="text-sm">仓库</span>
              </div>
              <p className="font-semibold text-slate-800">{reservation.warehouseName}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Lock className="w-4 h-4" />
                <span className="text-sm">关联锁定</span>
              </div>
              <p className="font-semibold text-slate-800">{reservation.colorLockId}</p>
            </div>
            {reservation.actualQuantity !== undefined && (
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Truck className="w-4 h-4" />
                  <span className="text-sm">实际发货</span>
                </div>
                <p className="font-semibold text-slate-800">{reservation.actualQuantity} 片</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">创建时间：{reservation.createdAt}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">更新时间：{reservation.updatedAt}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {canReserve && (
              <button
                onClick={handleReserve}
                className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors font-medium"
              >
                <CheckCircle className="w-5 h-5" />
                确认预留
              </button>
            )}
            {canShip && (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={actualQuantity}
                  onChange={(e) => setActualQuantity(e.target.value)}
                  placeholder="实际发货数量"
                  defaultValue={reservation.reservedQuantity}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-32"
                />
                <button
                  onClick={handleShip}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                >
                  <Truck className="w-5 h-5" />
                  确认发货
                </button>
              </div>
            )}
            {canComplete && (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
              >
                <CheckCircle2 className="w-5 h-5" />
                确认完成
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">历史备注记录</h3>
          <p className="text-sm text-slate-500">包含继承自色号锁定的备注</p>
        </div>
        
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {reservation.remarks.map((remark, index) => (
            <div key={remark.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  remark.authorRole === 'sales' ? 'bg-blue-100 text-blue-600' :
                  remark.authorRole === 'designer' ? 'bg-purple-100 text-purple-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {remark.author.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-800">{remark.author}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      remark.authorRole === 'sales' ? 'bg-blue-100 text-blue-700' :
                      remark.authorRole === 'designer' ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {roleLabel[remark.authorRole]}
                    </span>
                    <span className="text-xs text-slate-400">{remark.createdAt}</span>
                  </div>
                  <p className="text-slate-600">{remark.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex gap-3">
            <input
              type="text"
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder="添加备注..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleAddRemark()}
            />
            <button
              onClick={handleAddRemark}
              disabled={!remarkText.trim()}
              className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
