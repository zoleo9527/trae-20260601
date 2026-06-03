import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Palette, 
  RefreshCw, 
  Package, 
  CheckCircle2, 
  Clock,
  AlertTriangle,
  Eye,
  UserCheck,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow, isBefore, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';
import OrderTable from '@/components/OrderTable';

const Home = () => {
  const { orders, receiveModel, completeQualityCheck } = useOrderStore();
  const { currentUser } = useAuthStore();
  const [showAll, setShowAll] = useState(false);

  const isDelayed = (deliveryDate: string) => isBefore(parseISO(deliveryDate), new Date());

  const statistics = useMemo(() => {
    const now = new Date();
    const total = orders.length;
    const delayed = orders.filter(o => isDelayed(o.deliveryDate)).length;
    const rework = orders.filter(o => o.status === 'rework').length;
    const pendingModel = orders.filter(o => !o.modelReceived).length;
    const pendingColor = orders.filter(o => o.modelReceived && !o.shade).length;
    const qualityCheck = orders.filter(o => o.status === 'quality_check').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const inProduction = orders.filter(o => o.status === 'in_production').length;
    
    return { total, delayed, rework, pendingModel, pendingColor, qualityCheck, completed, inProduction };
  }, [orders]);

  const designerTasks = useMemo(() => {
    return orders.filter(o => {
      if (!o.modelReceived) return true;
      if (o.modelReceived && !o.shade) return true;
      if (o.status === 'rework' && o.currentHandler === currentUser?.name) return true;
      if (o.status === 'color_confirmed') return true;
      if (o.status === 'in_production') return true;
      return false;
    }).sort((a, b) => {
      const priority = (o: typeof orders[0]) => {
        if (!o.modelReceived) return 0;
        if (o.modelReceived && !o.shade) return 1;
        if (o.status === 'rework') return 2;
        return 3;
      };
      return priority(a) - priority(b);
    });
  }, [orders, currentUser]);

  const inspectorTasks = useMemo(() => {
    return orders.filter(o => 
      o.status === 'quality_check' || o.status === 'rework'
    ).sort((a, b) => {
      if (a.status === 'quality_check' && b.status !== 'quality_check') return -1;
      if (b.status === 'quality_check' && a.status !== 'quality_check') return 1;
      return 0;
    });
  }, [orders]);

  const customerServiceOrders = useMemo(() => {
    return orders.filter(o => 
      isDelayed(o.deliveryDate) || o.reworkCount > 0 || !o.modelReceived
    );
  }, [orders]);

  const renderCustomerServiceView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">客服工作台</h1>
        <p className="text-gray-500 mt-1">订单总览与异常追踪，快速响应诊所查询</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">订单总数</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{statistics.total}</p>
            </div>
            <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-sky-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm">已超期</p>
              <p className="text-3xl font-bold text-red-700 mt-1">{statistics.delayed}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm">返工中</p>
              <p className="text-3xl font-bold text-orange-700 mt-1">{statistics.rework}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm">模型漏收</p>
              <p className="text-3xl font-bold text-amber-700 mt-1">{statistics.pendingModel}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {customerServiceOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              需要关注的订单
            </h2>
            <span className="text-sm text-gray-500">{customerServiceOrders.length} 条异常记录</span>
          </div>
          <div className="divide-y divide-gray-100">
            {(showAll ? customerServiceOrders : customerServiceOrders.slice(0, 5)).map(order => (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium text-gray-800">{order.orderNo}</p>
                    <p className="text-sm text-gray-500">{order.patientName} · {order.clinic}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap gap-1 justify-end">
                    {isDelayed(order.deliveryDate) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                        <Clock className="w-3 h-3" />
                        已超期
                      </span>
                    )}
                    {!order.modelReceived && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                        <Package className="w-3 h-3" />
                        模型漏收
                      </span>
                    )}
                    {order.reworkCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                        <RefreshCw className="w-3 h-3" />
                        返工{order.reworkCount}次
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/order/${order.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-lg text-sm transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    查看
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {customerServiceOrders.length > 5 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-sky-600 hover:text-sky-700"
              >
                {showAll ? `收起（显示5条）` : `查看全部 ${customerServiceOrders.length} 条`}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">全部订单</h2>
      </div>
      <OrderTable />
    </div>
  );

  const renderDesignerView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">设计师工作台</h1>
        <p className="text-gray-500 mt-1">我的任务列表，按优先级处理</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm">待色号确认</p>
              <p className="text-3xl font-bold text-amber-700 mt-1">{statistics.pendingColor}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Palette className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm">待处理返工</p>
              <p className="text-3xl font-bold text-orange-700 mt-1">{statistics.rework}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sky-600 text-sm">待模型接收</p>
              <p className="text-3xl font-bold text-sky-700 mt-1">{statistics.pendingModel}</p>
            </div>
            <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-sky-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm">生产中</p>
              <p className="text-3xl font-bold text-green-700 mt-1">{statistics.inProduction}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">我的待办任务</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {designerTasks.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p>暂无待处理任务</p>
            </div>
          ) : (
            designerTasks.map(order => (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    !order.modelReceived ? 'bg-sky-100' :
                    !order.shade ? 'bg-amber-100' :
                    order.status === 'rework' ? 'bg-orange-100' : 'bg-gray-100'
                  }`}>
                    {!order.modelReceived && <Package className="w-5 h-5 text-sky-600" />}
                    {order.modelReceived && !order.shade && <Palette className="w-5 h-5 text-amber-600" />}
                    {order.status === 'rework' && <RefreshCw className="w-5 h-5 text-orange-600" />}
                    {order.status === 'color_confirmed' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {order.status === 'in_production' && <Clock className="w-5 h-5 text-purple-600" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800">{order.orderNo}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{order.patientName} · {order.clinic}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      isDelayed(order.deliveryDate) ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {formatDistanceToNow(parseISO(order.deliveryDate), { addSuffix: true, locale: zhCN })}
                    </p>
                    {isDelayed(order.deliveryDate) && (
                      <p className="text-xs text-red-500">已超期</p>
                    )}
                  </div>
                  {!order.modelReceived && (
                    <button
                      onClick={() => receiveModel(order.id)}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      接收模型
                    </button>
                  )}
                  {order.modelReceived && !order.shade && (
                    <Link
                      to={`/order/${order.id}/color`}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm transition-colors"
                    >
                      <Palette className="w-4 h-4" />
                      确认色号
                    </Link>
                  )}
                  {order.status === 'rework' && order.currentHandler === currentUser?.name && (
                    <Link
                      to={`/order/${order.id}/rework`}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      处理返工
                    </Link>
                  )}
                  <Link
                    to={`/order/${order.id}`}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderInspectorView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">质检工作台</h1>
        <p className="text-gray-500 mt-1">质量检查与返工管理</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm">待质检</p>
              <p className="text-3xl font-bold text-purple-700 mt-1">{statistics.qualityCheck}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm">返工中</p>
              <p className="text-3xl font-bold text-orange-700 mt-1">{statistics.rework}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm">已完成</p>
              <p className="text-3xl font-bold text-green-700 mt-1">{statistics.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm">已超期</p>
              <p className="text-3xl font-bold text-red-700 mt-1">{statistics.delayed}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">待质检订单</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {inspectorTasks.filter(o => o.status === 'quality_check').length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p>暂无待质检订单</p>
            </div>
          ) : (
            inspectorTasks.filter(o => o.status === 'quality_check').map(order => (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800">{order.orderNo}</p>
                      {order.shade && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">
                          <Palette className="w-3 h-3 mr-1" />
                          {order.shade}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{order.patientName} · {order.clinic}</p>
                    {order.reworkCount > 0 && (
                      <p className="text-xs text-orange-600 mt-1">已返工 {order.reworkCount} 次</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      isDelayed(order.deliveryDate) ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {formatDistanceToNow(parseISO(order.deliveryDate), { addSuffix: true, locale: zhCN })}
                    </p>
                  </div>
                  <button
                    onClick={() => completeQualityCheck(order.id, true)}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    通过
                  </button>
                  <Link
                    to={`/order/${order.id}/rework`}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    返工
                  </Link>
                  <Link
                    to={`/order/${order.id}`}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {inspectorTasks.filter(o => o.status === 'rework').length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-orange-500" />
              返工中订单
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {inspectorTasks.filter(o => o.status === 'rework').map(order => (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800">{order.orderNo}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{order.patientName} · {order.clinic}</p>
                    <p className="text-xs text-orange-600 mt-1">返工 {order.reworkCount} 次 · 处理人: {order.currentHandler}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      isDelayed(order.deliveryDate) ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {formatDistanceToNow(parseISO(order.deliveryDate), { addSuffix: true, locale: zhCN })}
                    </p>
                  </div>
                  <Link
                    to={`/order/${order.id}/rework`}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    查看返工
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderByRole = () => {
    switch (currentUser?.role) {
      case 'customer_service':
        return renderCustomerServiceView();
      case 'designer':
        return renderDesignerView();
      case 'inspector':
        return renderInspectorView();
      default:
        return renderCustomerServiceView();
    }
  };

  return renderByRole();
};

export default Home;
