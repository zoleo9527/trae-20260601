import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  FileText,
  User,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { REWORK_REASONS, STATUS_LABELS, STATUS_COLORS } from '@/types';
import { DEMO_USERS } from '@/utils/mock';

const ReworkPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    getOrderById, 
    createRework, 
    getReworksByOrderId,
    completeQualityCheck,
    resolveRework
  } = useOrderStore();
  const { currentUser } = useAuthStore();
  
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [handler, setHandler] = useState('');
  const [resolvingReworkId, setResolvingReworkId] = useState<string | null>(null);
  
  const order = id ? getOrderById(id) : undefined;
  const reworkHistory = id ? getReworksByOrderId(id) : [];
  
  if (!order) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">订单不存在</p>
      </div>
    );
  }
  
  const handleSubmitRework = () => {
    if (!selectedReason || !description || !handler || !id) return;
    createRework(id, selectedReason, description, handler);
    setSelectedReason('');
    setDescription('');
    setHandler('');
  };
  
  const handleQualityPass = () => {
    if (!id) return;
    completeQualityCheck(id, true);
    navigate(`/order/${id}`);
  };
  
  const handleResolveRework = (reworkId: string) => {
    resolveRework(reworkId);
    setResolvingReworkId(null);
  };
  
  const isInspector = currentUser?.role === 'inspector';
  const isDesigner = currentUser?.role === 'designer';
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={`/order/${id}`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回详情
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">试戴返工管理</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">订单信息</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">订单号</p>
                  <p className="font-medium text-gray-800">{order.orderNo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">患者姓名</p>
                  <p className="font-medium text-gray-800">{order.patientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">返工次数</p>
                  <p className={`font-medium ${order.reworkCount > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
                    {order.reworkCount} 次
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {isInspector && order.status === 'quality_check' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">质检处理</h2>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-3">快速操作</h3>
                <div className="flex gap-4">
                  <button
                    onClick={handleQualityPass}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    质检通过
                  </button>
                  <button
                    onClick={() => document.getElementById('rework-form')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    申请返工
                  </button>
                </div>
              </div>
              
              <div id="rework-form" className="border-t border-gray-200 pt-6">
                <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-orange-500" />
                  提交返工申请
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      返工原因
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {REWORK_REASONS.map((reason) => (
                        <button
                          key={reason}
                          onClick={() => setSelectedReason(reason)}
                          className={`px-4 py-3 rounded-lg border text-sm transition-all ${
                            selectedReason === reason
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      问题描述
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="请详细描述问题..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      指定处理人
                    </label>
                    <select
                      value={handler}
                      onChange={(e) => setHandler(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">请选择处理人</option>
                      {DEMO_USERS.filter(u => u.role === 'designer').map((user) => (
                        <option key={user.id} value={user.name}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-gray-500">
                      申请人: <span className="font-medium text-gray-700">{currentUser?.name}</span>
                    </div>
                    <button
                      onClick={handleSubmitRework}
                      disabled={!selectedReason || !description || !handler}
                      className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className="w-5 h-5" />
                      提交返工
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {isDesigner && order.status === 'rework' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">返工处理</h2>
              
              {reworkHistory.filter(r => r.status === 'processing').map((rework) => (
                <div key={rework.id} className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      <AlertTriangle className="w-4 h-4" />
                      {rework.reason}
                    </span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(rework.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{rework.description}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      申请人: {rework.applicant}
                    </p>
                    {rework.handler === currentUser?.name && (
                      <button
                        onClick={() => setResolvingReworkId(rework.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        标记完成
                      </button>
                    )}
                  </div>
                  
                  {resolvingReworkId === rework.id && (
                    <div className="mt-4 p-4 bg-white rounded-lg border">
                      <p className="text-sm text-gray-600 mb-3">确认返工已完成？将提交质检审核。</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleResolveRework(rework.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          确认完成
                        </button>
                        <button
                          onClick={() => setResolvingReworkId(null)}
                          className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {reworkHistory.filter(r => r.status === 'processing').length === 0 && (
                <p className="text-gray-500 text-center py-8">暂无待处理的返工任务</p>
              )}
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">返工历史记录</h3>
            {reworkHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">暂无返工记录</p>
            ) : (
              <div className="space-y-4">
                {reworkHistory.map((record) => (
                  <div 
                    key={record.id} 
                    className={`p-4 rounded-lg ${
                      record.status === 'resolved' ? 'bg-green-50' : 'bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        record.status === 'resolved' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {record.status === 'resolved' ? '已解决' : '处理中'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(record.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-1">{record.reason}</p>
                    <p className="text-sm text-gray-600 mb-2">{record.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>申请人: {record.applicant}</span>
                      <span>处理人: {record.handler}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h4 className="font-medium text-red-800 mb-2">⚠️ 返工风险提示</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• 返工将影响交付日期</li>
              <li>• 请详细记录问题原因</li>
              <li>• 明确指定处理责任人</li>
              <li>• 完成后及时提交复核</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReworkPage;
