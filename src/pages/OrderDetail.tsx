import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Palette, 
  RefreshCw, 
  Clock,
  User,
  FileText,
  Package,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Send,
  Play,
  XCircle,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { STATUS_LABELS, STATUS_COLORS, ROLE_LABELS, ROLE_COLORS } from '@/types';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    getOrderById, 
    getHistoryByOrderId, 
    getReworksByOrderId,
    getColorConfirmsByOrderId,
    updateOrderStatus,
    receiveModel,
    completeQualityCheck
  } = useOrderStore();
  const { currentUser } = useAuthStore();
  
  const [actionRemark, setActionRemark] = useState('');
  const [showRemarkInput, setShowRemarkInput] = useState<string | null>(null);
  
  const order = id ? getOrderById(id) : undefined;
  const history = id ? getHistoryByOrderId(id) : [];
  const reworks = id ? getReworksByOrderId(id) : [];
  const colorConfirms = id ? getColorConfirmsByOrderId(id) : [];
  
  if (!order) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">订单不存在</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }
  
  const getActionIcon = (action: string) => {
    if (action.includes('创建')) return <FileText className="w-4 h-4" />;
    if (action.includes('模型') || action.includes('接收')) return <Package className="w-4 h-4" />;
    if (action.includes('色号')) return <Palette className="w-4 h-4" />;
    if (action.includes('返工')) return <RefreshCw className="w-4 h-4" />;
    if (action.includes('质检') || action.includes('通过')) return <CheckCircle2 className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };
  
  const handleAction = (actionType: string, action: () => void) => {
    if (showRemarkInput === actionType && actionRemark.trim()) {
      action();
      setActionRemark('');
      setShowRemarkInput(null);
    } else if (showRemarkInput === actionType && !actionRemark.trim()) {
      action();
      setShowRemarkInput(null);
    } else {
      setShowRemarkInput(actionType);
    }
  };
  
  const canReceiveModel = currentUser?.role === 'designer' && !order.modelReceived;
  const canStartProduction = currentUser?.role === 'designer' && order.status === 'color_confirmed';
  const canSendToQuality = currentUser?.role === 'designer' && order.status === 'in_production';
  const canQualityPass = currentUser?.role === 'inspector' && order.status === 'quality_check';
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回列表
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{order.orderNo}</h1>
            <p className="text-sm text-gray-500">{order.patientName} · {order.clinic}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {canReceiveModel && (
            <div className="flex flex-col items-end">
              <button
                onClick={() => handleAction('receiveModel', () => id && receiveModel(id, actionRemark))}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
              >
                <Package className="w-4 h-4" />
                接收模型
              </button>
              {showRemarkInput === 'receiveModel' && (
                <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg w-80">
                  <p className="text-sm text-gray-600 mb-2">添加备注（可选）：</p>
                  <textarea
                    value={actionRemark}
                    onChange={(e) => setActionRemark(e.target.value)}
                    placeholder="口扫文件检查情况..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => { setShowRemarkInput(null); setActionRemark(''); }}
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleAction('receiveModel', () => id && receiveModel(id, actionRemark))}
                      className="flex items-center gap-1 px-3 py-1 bg-sky-600 text-white text-sm rounded hover:bg-sky-700"
                    >
                      <Send className="w-3 h-3" />
                      确认
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {canStartProduction && (
            <div className="flex flex-col items-end">
              <button
                onClick={() => handleAction('startProduction', () => id && updateOrderStatus(id, 'in_production', actionRemark))}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                开始生产
              </button>
              {showRemarkInput === 'startProduction' && (
                <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg w-80">
                  <p className="text-sm text-gray-600 mb-2">添加备注（可选）：</p>
                  <textarea
                    value={actionRemark}
                    onChange={(e) => setActionRemark(e.target.value)}
                    placeholder="生产说明..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => { setShowRemarkInput(null); setActionRemark(''); }}
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleAction('startProduction', () => id && updateOrderStatus(id, 'in_production', actionRemark))}
                      className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                    >
                      <Send className="w-3 h-3" />
                      确认
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {canSendToQuality && (
            <div className="flex flex-col items-end">
              <button
                onClick={() => handleAction('sendToQuality', () => id && updateOrderStatus(id, 'quality_check', actionRemark))}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                提交质检
              </button>
              {showRemarkInput === 'sendToQuality' && (
                <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg w-80">
                  <p className="text-sm text-gray-600 mb-2">添加备注（可选）：</p>
                  <textarea
                    value={actionRemark}
                    onChange={(e) => setActionRemark(e.target.value)}
                    placeholder="质检注意事项..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => { setShowRemarkInput(null); setActionRemark(''); }}
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleAction('sendToQuality', () => id && updateOrderStatus(id, 'quality_check', actionRemark))}
                      className="flex items-center gap-1 px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700"
                    >
                      <Send className="w-3 h-3" />
                      确认
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {order.modelReceived && !order.shade && currentUser?.role === 'designer' && (
            <Link
              to={`/order/${id}/color`}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Palette className="w-4 h-4" />
              确认色号
            </Link>
          )}
          
          {canQualityPass && (
            <div className="flex flex-col items-end">
              <button
                onClick={() => handleAction('qualityPass', () => id && completeQualityCheck(id, true, actionRemark))}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                质检通过
              </button>
              {showRemarkInput === 'qualityPass' && (
                <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg w-80">
                  <p className="text-sm text-gray-600 mb-2">添加备注（可选）：</p>
                  <textarea
                    value={actionRemark}
                    onChange={(e) => setActionRemark(e.target.value)}
                    placeholder="质检情况说明..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => { setShowRemarkInput(null); setActionRemark(''); }}
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleAction('qualityPass', () => id && completeQualityCheck(id, true, actionRemark))}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      <Send className="w-3 h-3" />
                      确认
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {order.status === 'quality_check' && currentUser?.role === 'inspector' && (
            <Link
              to={`/order/${id}/rework`}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              申请返工
            </Link>
          )}
          
          {order.status === 'rework' && currentUser?.role === 'designer' && (
            <Link
              to={`/order/${id}/rework`}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              处理返工
            </Link>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">订单概览</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">患者</p>
                  <p className="font-medium text-gray-800">{order.patientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">诊所</p>
                  <p className="font-medium text-gray-800">{order.clinic}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Palette className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">色号</p>
                  <p className="font-medium text-gray-800">{order.shade || '未确认'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">交付日期</p>
                  <p className="font-medium text-gray-800">
                    {format(new Date(order.deliveryDate), 'MM月dd日', { locale: zhCN })}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">预警信息</h3>
            <div className="space-y-3">
              {!order.modelReceived && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">模型未接收</span>
                </div>
              )}
              {order.reworkCount > 0 && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <RefreshCw className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span className="text-sm text-orange-700">已返工 {order.reworkCount} 次</span>
                </div>
              )}
              {order.modelReceived && order.reworkCount === 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-green-700">流程正常</span>
                </div>
              )}
            </div>
          </div>
          
          {colorConfirms.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">色号记录</h3>
              <div className="space-y-3">
                {colorConfirms.map((cc) => (
                  <div key={cc.id} className="p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-amber-700">{cc.shade}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(cc.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{cc.operator}</p>
                    {cc.remark && <p className="text-xs text-gray-500 mt-1">{cc.remark}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {reworks.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">返工记录</h3>
              <div className="space-y-3">
                {reworks.map((rw) => (
                  <div 
                    key={rw.id} 
                    className={`p-3 rounded-lg ${
                      rw.status === 'resolved' ? 'bg-green-50' : 'bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        rw.status === 'resolved' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {rw.status === 'resolved' ? '已解决' : '处理中'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(rw.createdAt), 'MM-dd', { locale: zhCN })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{rw.reason}</p>
                    <p className="text-xs text-gray-600 mt-1">{rw.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">操作历史时间线</h3>
            
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              
              <div className="space-y-6">
                {history.map((record, index) => (
                  <div key={record.id} className="relative pl-12">
                    <div className={`absolute left-0 w-9 h-9 rounded-full flex items-center justify-center ${
                      index === 0 
                        ? 'bg-sky-100 ring-4 ring-sky-50' 
                        : 'bg-gray-100'
                    }`}>
                      <div className={`${
                        index === 0 ? 'text-sky-600' : 'text-gray-500'
                      }`}>
                        {getActionIcon(record.action)}
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${
                      index === 0 ? 'bg-sky-50 border border-sky-200' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`font-medium ${
                            index === 0 ? 'text-sky-700' : 'text-gray-800'
                          }`}>
                            {record.action}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${ROLE_COLORS[record.operatorRole]}`}>
                            {ROLE_LABELS[record.operatorRole]}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(record.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>操作人: {record.operator}</span>
                      </div>
                      {record.remark && (
                        <p className="mt-2 text-sm text-gray-600 bg-white p-2 rounded border">
                          {record.remark}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
