import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../stores/appStore';
import { ArrowLeft, Package } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';

export default function Trace() {
  const { id } = useParams();
  const { currentSale, fetchSaleById, loading } = useStore();

  useEffect(() => {
    fetchSaleById(id);
    // 组件卸载时清理详情缓存，避免显示旧数据
    return () => {
      useStore.setState({ currentSale: null });
    };
  }, [id]);

  if (!currentSale) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          to="/sales/list"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
          返回列表
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  销售单详情
                </h1>
                <p className="text-sm text-gray-400 font-mono">
                  #{currentSale.id}
                </p>
              </div>
              <StatusBadge status={currentSale.status} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">客户</p>
                <p className="font-medium text-gray-800">{currentSale.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">创建人</p>
                <p className="font-medium text-gray-800">{currentSale.created_by_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">支付方式</p>
                <p className="font-medium text-gray-800">
                  {currentSale.is_credit ? '赊账' : '现结'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">订单金额</p>
                <p className="text-2xl font-bold text-primary">
                  ¥{currentSale.total_amount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">农药明细</h2>
            <div className="space-y-3">
              {currentSale.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="text-gray-400" size={20} />
                    <div>
                      <p className="font-medium text-gray-800">{item.pesticide_name}</p>
                      <p className={`text-xs px-2 py-0.5 rounded inline-block mt-1 ${
                        item.pesticide_type === '常规' ? 'bg-green-100 text-green-700' :
                        item.pesticide_type === '限用' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.pesticide_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">
                      {item.quantity} {item.unit}
                    </p>
                    <p className="text-sm text-gray-500">
                      ¥{item.subtotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation Card */}
          {currentSale.confirmation && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4">用药确认信息</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentSale.confirmation.result === 'available' ? 'bg-green-100 text-green-700' :
                    currentSale.confirmation.result === 'caution' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {currentSale.confirmation.result === 'available' ? '可用' :
                     currentSale.confirmation.result === 'caution' ? '慎用' : '禁用'}
                  </span>
                  <span className="text-sm text-gray-500">
                    确认人：{currentSale.confirmation.confirmed_by_name}
                  </span>
                  <span className="text-sm text-gray-400">
                    {new Date(currentSale.confirmation.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>

                {currentSale.confirmation.reminder && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-1">用药提醒</p>
                    <p className="text-sm text-blue-700">{currentSale.confirmation.reminder}</p>
                  </div>
                )}

                {currentSale.confirmation.comments && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 mb-1">备注</p>
                    <p className="text-sm text-gray-600">{currentSale.confirmation.comments}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warehouse Confirmation Card */}
          {currentSale.warehouseConfirm && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4">出库确认信息</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {currentSale.warehouseConfirm.status === 'confirmed' ? '已出库' : '部分出库'}
                  </span>
                  <span className="text-sm text-gray-500">
                    确认人：{currentSale.warehouseConfirm.confirmed_by_name}
                  </span>
                  <span className="text-sm text-gray-400">
                    {new Date(currentSale.warehouseConfirm.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>

                {currentSale.warehouseConfirm.comments && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 mb-1">备注</p>
                    <p className="text-sm text-gray-600">{currentSale.warehouseConfirm.comments}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Timeline Sidebar */}
        <div className="col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm sticky top-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">操作记录</h2>
            <Timeline logs={currentSale.logs} />
          </div>
        </div>
      </div>
    </div>
  );
}
