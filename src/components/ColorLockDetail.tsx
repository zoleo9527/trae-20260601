import { useState } from 'react';
import { useAppStore } from '../store';
import { ColorLock, UserRole } from '../types';
import { 
  Lock, AlertTriangle, CheckCircle, XCircle, ChevronLeft, 
  User, Phone, MapPin, Calendar, FileText, Send, 
  Warehouse, ArrowRight, Clock, ExternalLink, Truck
} from 'lucide-react';

interface ColorLockDetailProps {
  lockId: string;
  onBack: () => void;
  onViewReservation?: (reservationId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: '待处理', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock },
  locked: { label: '已锁定', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Lock },
  reserved: { label: '已预留', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: CheckCircle },
  shipped: { label: '已发货', color: 'text-cyan-600', bgColor: 'bg-cyan-100', icon: Truck },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
};

const roleLabel: Record<UserRole, string> = {
  sales: '导购',
  designer: '设计师',
  warehouse: '仓库员',
};

export default function ColorLockDetail({ lockId, onBack, onViewReservation }: ColorLockDetailProps) {
  const colorLock = useAppStore((state) => state.colorLocks.find(l => l.id === lockId));
  const currentUser = useAppStore((state) => state.currentUser);
  const updateColorLock = useAppStore((state) => state.updateColorLock);
  const addRemarkToLock = useAppStore((state) => state.addRemarkToLock);
  const addReservation = useAppStore((state) => state.addReservation);

  const [remarkText, setRemarkText] = useState('');
  const [showResponsibilityModal, setShowResponsibilityModal] = useState(false);

  if (!colorLock || !currentUser) return null;

  const status = statusConfig[colorLock.status];
  const StatusIcon = status.icon;

  const handleAddRemark = () => {
    if (!remarkText.trim()) return;
    addRemarkToLock(lockId, {
      content: remarkText,
      author: currentUser.name,
      authorRole: currentUser.role,
    });
    setRemarkText('');
  };

  const handleLock = () => {
    updateColorLock(lockId, { 
      status: 'locked',
      responsibilityFlag: false 
    });
    addRemarkToLock(lockId, {
      content: `${currentUser.name}已确认锁定色号`,
      author: currentUser.name,
      authorRole: currentUser.role,
    });
  };

  const handleMarkResponsibility = () => {
    updateColorLock(lockId, { responsibilityFlag: true });
    addRemarkToLock(lockId, {
      content: '⚠️ 责任标记：色号锁定与库存预留责任不清，请确认后再处理',
      author: currentUser.name,
      authorRole: currentUser.role,
    });
    setShowResponsibilityModal(false);
  };

  const handleCreateReservation = () => {
    if (!colorLock.linkedReservationId) {
      const newReservation = addReservation({
        colorLockId: lockId,
        colorNo: colorLock.colorNo,
        colorName: colorLock.colorName,
        productName: colorLock.productName,
        reservedQuantity: colorLock.quantity,
        warehouseName: 'A区仓库',
        status: 'pending',
        responsibilityFlag: colorLock.responsibilityFlag,
        remarks: [
          ...colorLock.remarks.map(r => ({ ...r })),
          { id: `R${Date.now()}`, content: `接色号锁定${lockId}，需预留${colorLock.quantity}片`, author: '系统', authorRole: 'warehouse', createdAt: new Date().toLocaleString('zh-CN') }
        ] as any,
      });
      
      updateColorLock(lockId, { 
        linkedReservationId: newReservation.id 
      });
      
      addRemarkToLock(lockId, {
        content: `已创建库存预留单 ${newReservation.id}`,
        author: currentUser.name,
        authorRole: currentUser.role,
      });
    }
  };

  const handleViewReservation = () => {
    if (colorLock.linkedReservationId && onViewReservation) {
      onViewReservation(colorLock.linkedReservationId);
    }
  };

  const canLock = currentUser.role === 'sales' && colorLock.status === 'pending';
  const canCreateReservation = colorLock.status === 'locked' && !colorLock.linkedReservationId;

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

      <div className={`bg-white rounded-2xl border ${colorLock.responsibilityFlag ? 'border-amber-200' : 'border-slate-200'} overflow-hidden`}>
        <div className={`p-6 ${colorLock.responsibilityFlag ? 'bg-amber-50' : 'bg-gradient-to-r from-amber-50 to-orange-50'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center">
                <Lock className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl font-bold text-slate-800">{colorLock.colorNo}</span>
                  <span className="text-lg text-slate-600">{colorLock.colorName}</span>
                </div>
                <p className="text-slate-500">{colorLock.productName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {colorLock.responsibilityFlag && (
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
                <User className="w-4 h-4" />
                <span className="text-sm">客户</span>
              </div>
              <p className="font-semibold text-slate-800">{colorLock.customerName}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Phone className="w-4 h-4" />
                <span className="text-sm">联系电话</span>
              </div>
              <p className="font-semibold text-slate-800">{colorLock.customerPhone}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">项目地址</span>
              </div>
              <p className="font-semibold text-slate-800">{colorLock.projectName}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-sm">锁定数量</span>
              </div>
              <p className="font-semibold text-slate-800">{colorLock.quantity} 片</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl">
              <span className="text-blue-600 font-medium">导购：</span>
              <span className="text-slate-700">{colorLock.salesmanName}</span>
            </div>
            {colorLock.designerName && (
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl">
                <span className="text-purple-600 font-medium">设计师：</span>
                <span className="text-slate-700">{colorLock.designerName}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">创建时间：{colorLock.createdAt}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">更新时间：{colorLock.updatedAt}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {canLock && (
              <button
                onClick={handleLock}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium"
              >
                <Lock className="w-5 h-5" />
                确认锁定
              </button>
            )}
            {canCreateReservation && (
              <button
                onClick={handleCreateReservation}
                className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors font-medium"
              >
                <Warehouse className="w-5 h-5" />
                创建库存预留
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {colorLock.linkedReservationId && (
              <button
                onClick={handleViewReservation}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors font-medium"
              >
                <ExternalLink className="w-5 h-5" />
                查看库存预留单 {colorLock.linkedReservationId}
              </button>
            )}
            <button
              onClick={() => setShowResponsibilityModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors font-medium"
            >
              <AlertTriangle className="w-5 h-5" />
              标记责任不清
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">历史备注记录</h3>
          <p className="text-sm text-slate-500">所有备注将被库存预留流程继承使用</p>
        </div>
        
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {colorLock.remarks.map((remark, index) => (
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
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleAddRemark()}
            />
            <button
              onClick={handleAddRemark}
              disabled={!remarkText.trim()}
              className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              发送
            </button>
          </div>
        </div>
      </div>

      {showResponsibilityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">确认标记责任不清</h3>
                <p className="text-sm text-slate-500">此操作将标记该色号锁定责任不清</p>
              </div>
            </div>
            <p className="text-slate-600 mb-6">
              标记后将在系统中显示警告标识，提醒相关人员该订单存在责任不清问题，需要进一步确认。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResponsibilityModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleMarkResponsibility}
                className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
              >
                确认标记
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
