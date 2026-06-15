import { useParams } from 'react-router-dom';
import { Clock, CheckCircle, Wrench, AlertCircle, User, Phone, Calendar, FileText, Package, GitCompare } from 'lucide-react';
import { useStore } from '../store';

const statusConfig = {
  pending: { label: '待确认', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  installing: { label: '待装机', color: 'bg-blue-100 text-blue-800', icon: Wrench },
  delivered: { label: '已交付', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  repairing: { label: '返修中', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

const installStatusConfig = {
  not_started: { label: '未开始', color: 'bg-gray-100 text-gray-800', icon: Clock },
  in_progress: { label: '安装中', color: 'bg-blue-100 text-blue-800', icon: Wrench },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { getOrderById } = useStore();
  const order = getOrderById(id || '');

  if (!order) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">订单不存在</p>
      </div>
    );
  }

  const StatusIcon = statusConfig[order.status].icon;
  const statusColor = statusConfig[order.status].color;
  const statusLabel = statusConfig[order.status].label;

  const InstallStatusIcon = installStatusConfig[order.install_status].icon;
  const installStatusColor = installStatusConfig[order.install_status].color;
  const installStatusLabel = installStatusConfig[order.install_status].label;

  const getPartCategory = (name: string) => {
    if (name.includes('Core') || name.includes('Ryzen')) return 'CPU';
    if (name.includes('DDR') || name.includes('内存')) return '内存';
    if (name.includes('RTX') || name.includes('RX') || name.includes('显卡')) return '显卡';
    if (name.includes('主板') || name.includes('B760') || name.includes('Z790')) return '主板';
    if (name.includes('电源') || name.includes('W') || name.includes('FOCUS')) return '电源';
    if (name.includes('SSD') || name.includes('PRO') || name.includes('硬盘')) return '硬盘';
    return '其他';
  };

  const getDifference = () => {
    const configMap = new Map(order.config_items.map(item => [item.part_name, item]));
    const installedMap = new Map(order.installed_parts.map(part => [part.part_name, part]));
    const differences: { type: 'added' | 'removed' | 'changed'; config?: typeof order.config_items[0]; installed?: typeof order.installed_parts[0] }[] = [];

    order.config_items.forEach(item => {
      const installed = installedMap.get(item.part_name);
      if (!installed) {
        differences.push({ type: 'removed', config: item });
      } else if (installed.part_id !== item.part_id || installed.unit_price !== item.unit_price) {
        differences.push({ type: 'changed', config: item, installed });
      }
    });

    order.installed_parts.forEach(part => {
      if (!configMap.has(part.part_name)) {
        differences.push({ type: 'added', installed: part });
      }
    });

    return differences;
  };

  const differences = getDifference();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{order.id}</h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusLabel}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${installStatusColor}`}>
                  <InstallStatusIcon className="w-3 h-3" />
                  {installStatusLabel}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">创建时间：{order.created_at}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 p-6">
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <User className="w-5 h-5 text-blue-600" />
              客户信息
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-16">姓名：</span>
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-16">电话：</span>
                <span className="font-medium">{order.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-16">下单日期：</span>
                <span className="font-medium">{order.order_date}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-16">创建人：</span>
                <span className="font-medium">{order.created_by}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Calendar className="w-5 h-5 text-green-600" />
              价格信息
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">订单总金额</span>
                <span className="text-lg font-bold text-gray-900">¥{order.total_price.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">已付金额</span>
                <span className="text-lg font-bold text-green-600">¥{order.paid_amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-orange-600">待补金额</span>
                <span className="text-lg font-bold text-orange-600">
                  ¥{(order.total_price - order.paid_amount).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <FileText className="w-5 h-5 text-purple-600" />
              订单统计
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">配件种类</span>
                <span className="font-medium">{order.config_items.length} 种</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">改配记录</span>
                <span className="font-medium">{order.modify_records.length} 条</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">交付记录</span>
                <span className="font-medium">{order.delivery_records.length} 条</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Package className="w-5 h-5 text-cyan-600" />
              实装统计
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">已安装配件</span>
                <span className="font-medium">{order.installed_parts.length} 种</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">安装进度</span>
                <span className="font-medium">{Math.round((order.installed_parts.length / order.config_items.length) * 100)}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">配置差异</span>
                <span className={`font-medium ${differences.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {differences.length > 0 ? `${differences.length} 项变更` : '无差异'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">配置清单（原单）</h2>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 sticky top-0">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    配件名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    规格
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    单价
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    小计
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.config_items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">{getPartCategory(item.part_name)}</span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{item.part_name}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500 max-w-xs truncate" title={item.spec}>
                      {item.spec}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">
                      ¥{item.unit_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      ¥{item.total_price.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">实装配件记录</h2>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {order.installed_parts.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">暂无实装记录</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 sticky top-0">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      分类
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      配件名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      批次号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      质保到期
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      安装人
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.installed_parts.map((part) => (
                    <tr key={part.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">{getPartCategory(part.part_name)}</span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div>
                          <span className="font-medium text-gray-900">{part.part_name}</span>
                          {part.remarks && (
                            <p className="text-xs text-orange-600 mt-1">{part.remarks}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500 font-mono">
                        {part.batch_no}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {part.expire_date}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {part.installed_by}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {differences.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-orange-500">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-orange-600" />
              配置差异对比
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {differences.map((diff, index) => (
              <div key={index} className={`p-3 rounded-lg ${
                diff.type === 'added' ? 'bg-green-50' :
                diff.type === 'removed' ? 'bg-red-50' : 'bg-yellow-50'
              }`}>
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    diff.type === 'added' ? 'bg-green-500' :
                    diff.type === 'removed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}>
                    {diff.type === 'added' ? '新增' : diff.type === 'removed' ? '移除' : '变更'}
                  </span>
                  <div className="flex-1">
                    {diff.type === 'changed' && diff.config && diff.installed && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 line-through">原单: {diff.config.part_name} ¥{diff.config.unit_price}</span>
                          <span className="text-green-600">→ 实装: {diff.installed.part_name} ¥{diff.installed.unit_price}</span>
                        </div>
                        {diff.installed.remarks && (
                          <p className="text-sm text-gray-600">{diff.installed.remarks}</p>
                        )}
                      </div>
                    )}
                    {diff.type === 'added' && diff.installed && (
                      <div>
                        <span className="text-green-600">新增安装: {diff.installed.part_name}</span>
                        {diff.installed.remarks && (
                          <p className="text-sm text-gray-600 mt-1">{diff.installed.remarks}</p>
                        )}
                      </div>
                    )}
                    {diff.type === 'removed' && diff.config && (
                      <span className="text-red-600">未安装: {diff.config.part_name}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
