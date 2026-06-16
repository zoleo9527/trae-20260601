import { Phone, Calendar, User, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { Order, FollowUpRecord } from '@/types';

interface FollowUpPanelProps {
  order: Order;
  records: FollowUpRecord[];
}

const pickupStatusConfig = {
  scheduled: { label: '正常取件', color: 'bg-mint-100 text-mint-700', icon: CheckCircle },
  delayed: { label: '延期取件', color: 'bg-coral-100 text-coral-700', icon: AlertTriangle },
  'picked-up': { label: '已取件', color: 'bg-navy-100 text-navy-700', icon: Clock },
};

export function FollowUpPanel({ order, records }: FollowUpPanelProps) {
  const pickupStatus = pickupStatusConfig[order.pickupStatus];
  const PickupIcon = pickupStatus.icon;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-navy-50 to-blue-50 rounded-xl border border-navy-100 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-navy-600" />
          <h4 className="font-semibold text-navy-900">取件信息</h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">原定取件时间</span>
            </div>
            <p className="text-lg font-semibold text-navy-900">{order.originalPickupDate}</p>
          </div>
          
          {order.pickupStatus === 'delayed' && order.newPickupDate && (
            <div className="bg-coral-50 rounded-lg p-3 border border-coral-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-coral-500" />
                <span className="text-xs text-coral-600">最新约定时间</span>
              </div>
              <p className="text-lg font-semibold text-coral-700">{order.newPickupDate}</p>
            </div>
          )}
          
          {order.pickupStatus === 'picked-up' && (
            <div className="bg-mint-50 rounded-lg p-3 border border-mint-100">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-mint-500" />
                <span className="text-xs text-mint-600">实际取件时间</span>
              </div>
              <p className="text-lg font-semibold text-mint-700">{order.originalPickupDate}</p>
            </div>
          )}
        </div>
        
        {order.pickupStatus === 'delayed' && order.delayReason && (
          <div className="mt-4 bg-coral-50 rounded-lg p-3 border border-coral-100">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-coral-500 mt-0.5" />
              <div>
                <span className="text-xs text-coral-600 font-medium">延期原因</span>
                <p className="text-sm text-coral-700 mt-1">{order.delayReason}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-between">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${pickupStatus.color}`}>
            <PickupIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{pickupStatus.label}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="bg-navy-50 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-navy-600" />
            <h4 className="font-semibold text-navy-900">客服跟进记录</h4>
            <span className="ml-auto text-xs text-gray-500">{records.length} 条记录</span>
          </div>
        </div>
        
        {records.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">暂无客服跟进记录</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {[...records].sort((a, b) => 
              new Date(b.followUpDate).getTime() - new Date(a.followUpDate).getTime()
            ).map((record) => (
              <div key={record.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-navy-900">{record.followUpDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">跟进人: {record.follower}</span>
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-gray-500">沟通备注</span>
                      <p className="text-sm text-gray-700 mt-1">{record.note}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-navy-50 rounded-lg p-3">
                  <span className="text-xs text-gray-500">处理动作</span>
                  <p className="text-sm text-navy-700 mt-1">{record.action}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
