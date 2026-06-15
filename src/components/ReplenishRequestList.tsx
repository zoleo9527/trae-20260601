import { useState } from 'react';
import { useAppStore } from '../store';
import { ClipboardList, Clock, CheckCircle, Package, Calendar, User, AlertCircle } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: '待审批', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock },
  approved: { label: '已审批', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: CheckCircle },
  ordered: { label: '已下单', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Package },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
};

export default function ReplenishRequestList() {
  const replenishRequests = useAppStore((state) => state.replenishRequests);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    colorNo: '',
    colorName: '',
    productName: '',
    quantity: '',
  });

  const sortedRequests = [...replenishRequests].sort((a, b) => {
    const statusOrder = { pending: 0, approved: 1, ordered: 2, completed: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const handleSubmit = () => {
    if (!newRequest.colorNo || !newRequest.colorName || !newRequest.productName || !newRequest.quantity) {
      return;
    }
    setShowAddForm(false);
    setNewRequest({ colorNo: '', colorName: '', productName: '', quantity: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">补货申请列表</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">共 {sortedRequests.length} 条记录</span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            新增申请
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="font-semibold text-slate-800 mb-4">新增补货申请</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              value={newRequest.colorNo}
              onChange={(e) => setNewRequest({ ...newRequest, colorNo: e.target.value })}
              placeholder="色号"
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="text"
              value={newRequest.colorName}
              onChange={(e) => setNewRequest({ ...newRequest, colorName: e.target.value })}
              placeholder="颜色名称"
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="text"
              value={newRequest.productName}
              onChange={(e) => setNewRequest({ ...newRequest, productName: e.target.value })}
              placeholder="产品名称"
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="number"
              value={newRequest.quantity}
              onChange={(e) => setNewRequest({ ...newRequest, quantity: e.target.value })}
              placeholder="补货数量"
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
            >
              提交申请
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {sortedRequests.map((request) => {
          const status = statusConfig[request.status];
          const StatusIcon = status.icon;
          
          return (
            <div 
              key={request.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-xl flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{request.id}</span>
                      <span className="text-slate-500">{request.colorNo}</span>
                    </div>
                    <p className="text-sm text-slate-500">{request.colorName} - {request.productName}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1 px-3 py-1 ${status.bgColor} ${status.color} text-sm rounded-full`}>
                  <StatusIcon className="w-4 h-4" />
                  {status.label}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">补货数量：{request.quantity} 片</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{request.requestedBy}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{request.createdAt}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedRequests.length === 0 && (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">暂无补货申请记录</p>
        </div>
      )}
    </div>
  );
}
