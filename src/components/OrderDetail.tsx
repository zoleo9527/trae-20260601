import { useStore } from '@/store';
import { CompletionRecord, RepairOrder, statusColors, statusLabels, UserRole } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    MapPin,
    MessageSquare,
    Package,
    Phone,
    RefreshCw,
    Send,
    Tag,
    Timer,
    User,
    Wrench,
    X
} from 'lucide-react';
import { useState } from 'react';

interface OrderDetailProps {
  order: RepairOrder;
  onClose: () => void;
}

export function OrderDetail({ order, onClose }: OrderDetailProps) {
  const { 
    currentUser, 
    users, 
    startRepair, 
    submitCompletion, 
    confirmCompletion, 
    requestRework,
    assignOrder
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<'detail' | 'completions' | 'history'>('detail');
  const [showSubmitCompletion, setShowSubmitCompletion] = useState(false);
  const [showConfirmCompletion, setShowConfirmCompletion] = useState(false);
  const [showRequestRework, setShowRequestRework] = useState(false);
  const [selectedCompletionId, setSelectedCompletionId] = useState<string | null>(null);
  
  const [completionDescription, setCompletionDescription] = useState('');
  const [completionMaterials, setCompletionMaterials] = useState('');
  const [completionHours, setCompletionHours] = useState('');
  const [confirmRemark, setConfirmRemark] = useState('');
  const [reworkReason, setReworkReason] = useState('');

  const getUserName = (userId?: string) => {
    if (!userId) return '未分配';
    return users.find(u => u.id === userId)?.name || '未知';
  };

  const role = currentUser?.role as UserRole;
  const isReworkFlow = order.status.startsWith('rework');

  const pendingCompletion = order.completions.find(c => !c.confirmed);

  const canAssign = role === 'logistics_supervisor' && order.status === 'pending';
  const canStartRepair = role === 'repair_worker' && 
    (order.status === 'assigned' || order.status === 'rework_requested') &&
    order.assignedTo === currentUser?.id;
  const canSubmitCompletion = role === 'repair_worker' && 
    (order.status === 'in_progress' || order.status === 'rework_in_progress') &&
    order.assignedTo === currentUser?.id;
  const canConfirmCompletion = role === 'dorm_manager' && 
    (order.status === 'completion_submitted' || order.status === 'rework_completion_submitted');
  const canRequestRework = role === 'dorm_manager' && 
    (order.status === 'completion_confirmed' || order.status === 'rework_completion_confirmed');

  const handleStartRepair = () => {
    startRepair(order.id);
  };

  const handleSubmitCompletion = () => {
    if (!completionDescription.trim()) return;
    
    submitCompletion(order.id, {
      submittedBy: currentUser?.id || '',
      description: completionDescription,
      materialsUsed: completionMaterials || undefined,
      laborHours: completionHours ? parseFloat(completionHours) : undefined
    }, isReworkFlow || order.reworks.length > 0);
    
    setShowSubmitCompletion(false);
    setCompletionDescription('');
    setCompletionMaterials('');
    setCompletionHours('');
  };

  const handleConfirmCompletion = () => {
    const completionId = selectedCompletionId || pendingCompletion?.id;
    if (!completionId) return;
    
    confirmCompletion(order.id, completionId, confirmRemark || undefined);
    setShowConfirmCompletion(false);
    setConfirmRemark('');
    setSelectedCompletionId(null);
  };

  const handleRequestRework = () => {
    if (!reworkReason.trim()) return;
    
    const lastConfirmedCompletion = [...order.completions]
      .reverse()
      .find(c => c.confirmed);
    
    if (lastConfirmedCompletion) {
      requestRework(order.id, lastConfirmedCompletion.id, reworkReason);
    }
    
    setShowRequestRework(false);
    setReworkReason('');
  };

  const handleAssign = (userId: string) => {
    assignOrder(order.id, userId);
  };

  const renderActionButtons = () => {
    const buttons = [];

    if (canAssign) {
      const repairWorkers = users.filter(u => u.role === 'repair_worker');
      buttons.push(
        <div key="assign" className="space-y-2">
          <p className="text-sm text-gray-500">分配维修师傅：</p>
          <div className="flex flex-wrap gap-2">
            {repairWorkers.map(worker => (
              <button
                key={worker.id}
                onClick={() => handleAssign(worker.id)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                分配给 {worker.name}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (canStartRepair) {
      buttons.push(
        <button
          key="start"
          onClick={handleStartRepair}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors flex items-center space-x-2"
        >
          <Wrench className="w-4 h-4" />
          <span>开始{isReworkFlow ? '返修' : '维修'}</span>
        </button>
      );
    }

    if (canSubmitCompletion) {
      buttons.push(
        <button
          key="submit"
          onClick={() => setShowSubmitCompletion(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>提交{isReworkFlow ? '返修' : ''}完工</span>
        </button>
      );
    }

    if (canConfirmCompletion && pendingCompletion) {
      buttons.push(
        <button
          key="confirm"
          onClick={() => {
            setSelectedCompletionId(pendingCompletion.id);
            setShowConfirmCompletion(true);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>确认{pendingCompletion.isRework ? '返修' : ''}完工</span>
        </button>
      );
    }

    if (canRequestRework) {
      buttons.push(
        <button
          key="rework"
          onClick={() => setShowRequestRework(true)}
          className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>申请二次返修</span>
        </button>
      );
    }

    return buttons;
  };

  const getCompletionById = (completionId: string) => {
    return order.completions.find(c => c.id === completionId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">{order.title}</h3>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </span>
              {order.reworks.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>已返修 {order.reworks.length} 次</span>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">工单号：{order.orderNo}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-gray-200 flex-shrink-0">
          <div className="flex">
            {[
              { key: 'detail', label: '工单详情', icon: FileText },
              { key: 'completions', label: '完工与返修追溯', icon: CheckCircle2 },
              { key: 'history', label: '状态历史', icon: Clock }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.key === 'completions' && (order.completions.length > 0 || order.reworks.length > 0) && (
                  <span className="bg-primary-100 text-primary-600 text-xs px-1.5 py-0.5 rounded-full">
                    {order.completions.length + order.reworks.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {activeTab === 'detail' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-500 text-sm mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>位置</span>
                  </div>
                  <p className="font-medium text-gray-900">{order.dormitory} {order.roomNumber}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-500 text-sm mb-1">
                    <Tag className="w-4 h-4" />
                    <span>分类</span>
                  </div>
                  <p className="font-medium text-gray-900">{order.category}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-500 text-sm mb-1">
                    <User className="w-4 h-4" />
                    <span>报修人</span>
                  </div>
                  <p className="font-medium text-gray-900">{order.reporter}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-500 text-sm mb-1">
                    <Phone className="w-4 h-4" />
                    <span>联系电话</span>
                  </div>
                  <p className="font-medium text-gray-900">{order.reporterPhone || '未填写'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-500 text-sm mb-1">
                    <Wrench className="w-4 h-4" />
                    <span>维修师傅</span>
                  </div>
                  <p className="font-medium text-gray-900">{getUserName(order.assignedTo)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-500 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>报修时间</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">问题描述</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{order.description}</p>
                </div>
              </div>

              {order.reworks.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-red-700 font-medium mb-3">
                    <AlertTriangle className="w-5 h-5" />
                    <span>返修追溯链路（共 {order.reworks.length} 次）</span>
                  </div>
                  <div className="space-y-4">
                    {order.reworks.map((rework, index) => {
                      const originalCompletion = getCompletionById(rework.originalCompletionId);
                      return (
                        <div key={rework.id} className="bg-white rounded-lg p-4 border border-red-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-red-700">第 {index + 1} 次返修</span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(rework.requestedAt), 'MM-dd HH:mm', { locale: zhCN })}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="bg-red-50 rounded p-3 border border-red-100">
                              <p className="text-xs text-red-600 font-medium mb-1">返修原因</p>
                              <p className="text-sm text-gray-800">{rework.reason}</p>
                              <p className="text-xs text-gray-500 mt-1">申请人：{getUserName(rework.requestedBy)}</p>
                            </div>
                            
                            {originalCompletion && (
                              <div className="bg-amber-50 rounded p-3 border border-amber-100">
                                <p className="text-xs text-amber-700 font-medium mb-2 flex items-center">
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  关联的原始完工记录
                                </p>
                                <div className="text-xs space-y-1">
                                  <div>
                                    <span className="text-gray-500">维修说明：</span>
                                    <span className="text-gray-800">{originalCompletion.description}</span>
                                  </div>
                                  {originalCompletion.confirmRemark && (
                                    <div className="text-amber-700">
                                      <span className="font-medium">确认备注：</span>
                                      {originalCompletion.confirmRemark}
                                    </div>
                                  )}
                                  {originalCompletion.materialsUsed && (
                                    <div>
                                      <span className="text-gray-500">使用材料：</span>
                                      <span className="text-gray-800">{originalCompletion.materialsUsed}</span>
                                    </div>
                                  )}
                                  {originalCompletion.laborHours !== undefined && (
                                    <div>
                                      <span className="text-gray-500">工时：</span>
                                      <span className="text-gray-800">{originalCompletion.laborHours} 小时</span>
                                    </div>
                                  )}
                                  <div className="text-gray-500">
                                    完工时间：{format(new Date(originalCompletion.submittedAt), 'MM-dd HH:mm', { locale: zhCN })}
                                    {' · '}确认人：{getUserName(originalCompletion.confirmedBy)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'completions' && (
            <div className="space-y-6">
              {order.completions.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无完工记录</p>
                </div>
              ) : (
                [...order.completions].reverse().map((completion, index) => (
                  <CompletionCard 
                    key={completion.id} 
                    completion={completion} 
                    index={order.completions.length - 1 - index}
                    getUserName={getUserName}
                    onConfirm={canConfirmCompletion && !completion.confirmed ? () => {
                      setSelectedCompletionId(completion.id);
                      setShowConfirmCompletion(true);
                    } : undefined}
                    reworks={order.reworks}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {[...order.statusHistory].reverse().map((history, index) => (
                  <div key={history.id} className="relative pl-10">
                    <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                      history.status.includes('rework') ? 'bg-red-500' :
                      history.status.includes('completion') ? 'bg-green-500' :
                      history.status === 'in_progress' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[history.status]}`}>
                          {statusLabels[history.status]}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(history.changedAt), 'MM-dd HH:mm', { locale: zhCN })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 font-medium">{history.remark || statusLabels[history.status]}</p>
                      <p className="text-xs text-gray-500 mt-1">操作人：{getUserName(history.changedBy)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {order.reworks.length > 0 && (
                <span className="flex items-center text-red-600">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  已返修 {order.reworks.length} 次
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {renderActionButtons()}
            </div>
          </div>
        </div>
      </div>

      {showSubmitCompletion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                提交{isReworkFlow ? '返修' : ''}完工
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  维修说明 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={completionDescription}
                  onChange={(e) => setCompletionDescription(e.target.value)}
                  placeholder="请详细描述维修过程和结果..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  使用材料
                </label>
                <input
                  type="text"
                  value={completionMaterials}
                  onChange={(e) => setCompletionMaterials(e.target.value)}
                  placeholder="如：LED灯管1个、锁芯1套"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  工时（小时）
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={completionHours}
                  onChange={(e) => setCompletionHours(e.target.value)}
                  placeholder="如：1.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowSubmitCompletion(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitCompletion}
                disabled={!completionDescription.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>提交</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmCompletion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">确认完工</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">请确认维修结果</p>
                    <p className="text-sm text-green-600 mt-1">确认后工单将标记为已完工</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  确认备注
                </label>
                <textarea
                  value={confirmRemark}
                  onChange={(e) => setConfirmRemark(e.target.value)}
                  placeholder="可填写验收情况、注意事项等..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmCompletion(false);
                  setConfirmRemark('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmCompletion}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>确认完工</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showRequestRework && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">申请二次返修</h3>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">申请返修说明</p>
                    <p className="text-sm text-red-600 mt-1">返修申请将立即通知原维修师傅和后勤主管，责任链路将永久记录</p>
                  </div>
                </div>
              </div>
              
              {(() => {
                const lastConfirmed = [...order.completions].reverse().find(c => c.confirmed);
                return lastConfirmed ? (
                  <div className="border border-amber-200 rounded-lg overflow-hidden">
                    <div className="bg-amber-50 px-4 py-2 border-b border-amber-200">
                      <p className="text-sm font-semibold text-amber-800 flex items-center">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        上次完工记录（将作为返修追溯依据）
                      </p>
                    </div>
                    <div className="p-4 space-y-3 bg-white">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">维修说明</p>
                        <p className="text-sm text-gray-900 bg-gray-50 rounded p-2">{lastConfirmed.description}</p>
                      </div>
                      
                      {lastConfirmed.confirmRemark && (
                        <div className="bg-amber-50 rounded p-3 border border-amber-100">
                          <p className="text-xs text-amber-700 font-medium mb-1">宿管确认备注</p>
                          <p className="text-sm text-amber-900">{lastConfirmed.confirmRemark}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3">
                        {lastConfirmed.materialsUsed && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">使用材料</p>
                            <p className="text-sm text-gray-900 bg-gray-50 rounded p-2">{lastConfirmed.materialsUsed}</p>
                          </div>
                        )}
                        {lastConfirmed.laborHours !== undefined && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">工时</p>
                            <p className="text-sm text-gray-900 bg-gray-50 rounded p-2">{lastConfirmed.laborHours} 小时</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                        <span>提交人：{getUserName(lastConfirmed.submittedBy)}</span>
                        <span>完工时间：{format(new Date(lastConfirmed.submittedAt), 'MM-dd HH:mm', { locale: zhCN })}</span>
                      </div>
                      {lastConfirmed.confirmedBy && (
                        <div className="text-xs text-gray-500">
                          确认人：{getUserName(lastConfirmed.confirmedBy)}
                          {' · '}
                          确认时间：{lastConfirmed.confirmedAt && format(new Date(lastConfirmed.confirmedAt), 'MM-dd HH:mm', { locale: zhCN })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  返修原因 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reworkReason}
                  onChange={(e) => setReworkReason(e.target.value)}
                  placeholder="请详细说明需要返修的原因，建议说明具体问题和期望效果..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => {
                  setShowRequestRework(false);
                  setReworkReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRequestRework}
                disabled={!reworkReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>提交返修申请</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CompletionCardProps {
  completion: CompletionRecord;
  index: number;
  getUserName: (userId?: string) => string;
  onConfirm?: () => void;
  reworks?: Array<{ originalCompletionId: string; reason: string; requestedAt: string; requestedBy: string }>;
}

function CompletionCard({ completion, index, getUserName, onConfirm, reworks = [] }: CompletionCardProps) {
  const relatedReworks = reworks.filter(r => r.originalCompletionId === completion.id);
  
  return (
    <div className={`rounded-lg border-2 p-5 ${
      completion.confirmed 
        ? 'bg-green-50 border-green-200' 
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <span className={`text-sm font-semibold ${
            completion.isRework ? 'text-red-600' : 'text-gray-900'
          }`}>
            {completion.isRework ? `第 ${completion.reworkCount} 次返修完工` : `完工记录 #${index + 1}`}
          </span>
          {completion.confirmed ? (
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>已确认</span>
            </span>
          ) : (
            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>待确认</span>
            </span>
          )}
          {relatedReworks.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>引发 {relatedReworks.length} 次返修</span>
            </span>
          )}
        </div>
        {!completion.confirmed && onConfirm && (
          <button
            onClick={onConfirm}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>确认</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>维修说明</span>
          </div>
          <p className="text-gray-900 bg-white rounded p-3 border border-gray-100">
            {completion.description}
          </p>
        </div>

        {completion.confirmRemark && (
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
            <div className="flex items-center space-x-1 text-sm text-emerald-700 font-medium mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>宿管确认备注</span>
            </div>
            <p className="text-sm text-emerald-900">{completion.confirmRemark}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {completion.materialsUsed && (
            <div>
              <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                <Package className="w-4 h-4" />
                <span>使用材料</span>
              </div>
              <p className="text-sm text-gray-900 bg-white rounded p-2 border border-gray-100">
                {completion.materialsUsed}
              </p>
            </div>
          )}
          {completion.laborHours !== undefined && (
            <div>
              <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                <Timer className="w-4 h-4" />
                <span>工时</span>
              </div>
              <p className="text-sm text-gray-900 bg-white rounded p-2 border border-gray-100">
                {completion.laborHours} 小时
              </p>
            </div>
          )}
        </div>

        {relatedReworks.length > 0 && (
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="flex items-center space-x-1 text-sm text-red-700 font-medium mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>关联的返修记录（{relatedReworks.length} 次）</span>
            </div>
            <div className="space-y-2">
              {relatedReworks.map((rework, idx) => (
                <div key={idx} className="bg-white rounded p-2 border border-red-100">
                  <p className="text-sm text-gray-800">{rework.reason}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(rework.requestedAt), 'MM-dd HH:mm', { locale: zhCN })}
                    {' · '}申请人：{getUserName(rework.requestedBy)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-gray-200/50 gap-2">
          <div className="text-sm">
            <span className="text-gray-500">提交人：</span>
            <span className="text-gray-900 font-medium">{getUserName(completion.submittedBy)}</span>
            <span className="text-gray-400 mx-2">·</span>
            <span className="text-gray-500">
              {format(new Date(completion.submittedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
            </span>
          </div>
          {completion.confirmed && completion.confirmedBy && (
            <div className="text-sm">
              <span className="text-gray-500">确认人：</span>
              <span className="text-gray-900 font-medium">{getUserName(completion.confirmedBy)}</span>
              <span className="text-gray-400 mx-2">·</span>
              <span className="text-gray-500">
                {completion.confirmedAt && format(new Date(completion.confirmedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
