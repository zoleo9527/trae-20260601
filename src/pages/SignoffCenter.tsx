import { useEffect, useState } from 'react';
import { FileCheck, CheckCircle, XCircle, Clock, User, ChevronRight } from 'lucide-react';
import { useWorkOrderStore } from '@/stores/workorder';
import { SIGN_OFF_STATUS_MAP } from '@/types';

export function SignoffCenter() {
  const { workorders, fetchWorkOrders } = useWorkOrderStore();
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const signOffOrders = workorders.filter(w => w.signOff);
  
  const filteredOrders = signOffOrders.filter(w => w.signOff?.status === selectedTab);

  const pendingCount = signOffOrders.filter(w => w.signOff?.status === 'pending').length;
  const approvedCount = signOffOrders.filter(w => w.signOff?.status === 'approved').length;
  const rejectedCount = signOffOrders.filter(w => w.signOff?.status === 'rejected').length;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">签认中心</h1>
          <p className="text-sm text-slate-500">复工签认管理与历史回看</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">待签认</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">已通过</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{approvedCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">已驳回</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{rejectedCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setSelectedTab('pending')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
              selectedTab === 'pending' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            待签认
            {selectedTab === 'pending' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
            )}
          </button>
          <button
            onClick={() => setSelectedTab('approved')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
              selectedTab === 'approved' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            已通过
            {selectedTab === 'approved' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
            )}
          </button>
          <button
            onClick={() => setSelectedTab('rejected')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
              selectedTab === 'rejected' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            已驳回
            {selectedTab === 'rejected' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
            )}
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredOrders.map((order) => (
            <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  order.signOff?.status === 'pending' ? 'bg-yellow-100' :
                  order.signOff?.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {order.signOff?.status === 'pending' && <Clock size={20} className="text-yellow-600" />}
                  {order.signOff?.status === 'approved' && <CheckCircle size={20} className="text-green-600" />}
                  {order.signOff?.status === 'rejected' && <XCircle size={20} className="text-red-600" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{order.equipmentNo}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      order.signOff?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.signOff?.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {SIGN_OFF_STATUS_MAP[order.signOff?.status || 'pending']}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{order.customerName} - {order.model}</p>
                  {order.signOff && (
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {order.signOff.technicianName}
                      </span>
                      <span>{order.signOff.workingHours} 小时</span>
                      <span>{order.signOff.applyTime}</span>
                    </div>
                  )}
                </div>
              </div>
              <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                查看详情
                <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="py-12 text-center">
            <FileCheck size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">暂无{selectedTab === 'pending' ? '待签认' : selectedTab === 'approved' ? '已通过' : '已驳回'}的工单</p>
          </div>
        )}
      </div>
    </div>
  );
}
