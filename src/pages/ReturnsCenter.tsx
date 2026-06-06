import React from 'react';
import { useStore } from '@/store/useStore';
import { RETURN_REASON_MAP, type ReturnReasonCode } from '@/types';
import { Package, AlertTriangle, XCircle, ShieldAlert, PackageX, MoreHorizontal, FileText, Link2, Hash, User, Warehouse, Calendar } from 'lucide-react';

const reasonIcons: Record<ReturnReasonCode, React.ReactNode> = {
  DAMAGED: <Package className="w-6 h-6" />,
  WRONG_ITEM: <XCircle className="w-6 h-6" />,
  QUALITY: <AlertTriangle className="w-6 h-6" />,
  CUSTOMS_REJECT: <ShieldAlert className="w-6 h-6" />,
  OVERSTOCK: <PackageX className="w-6 h-6" />,
  OTHER: <MoreHorizontal className="w-6 h-6" />,
};

const reasonColors: Record<ReturnReasonCode, string> = {
  DAMAGED: 'bg-red-50 text-red-600 border-red-200',
  WRONG_ITEM: 'bg-orange-50 text-orange-600 border-orange-200',
  QUALITY: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  CUSTOMS_REJECT: 'bg-purple-50 text-purple-600 border-purple-200',
  OVERSTOCK: 'bg-blue-50 text-blue-600 border-blue-200',
  OTHER: 'bg-gray-50 text-gray-600 border-gray-200',
};

export const ReturnsCenter: React.FC = () => {
  const returnRecords = useStore((state) => state.returnRecords);

  const reasonStats = Object.keys(RETURN_REASON_MAP).reduce((acc, reason) => {
    acc[reason as ReturnReasonCode] = returnRecords.filter(
      (r) => r.reasonCode === reason
    ).length;
    return acc;
  }, {} as Record<ReturnReasonCode, number>);

  const totalReturns = returnRecords.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">退件复盘中心</h1>
        <p className="text-gray-500 mt-1">统计和分析所有退件记录，共 {returnRecords.length} 条记录，{totalReturns} 件商品</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {(Object.keys(RETURN_REASON_MAP) as ReturnReasonCode[]).map((reason) => (
          <div
            key={reason}
            className={`p-4 rounded-xl border ${reasonColors[reason]}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="opacity-80">{reasonIcons[reason]}</span>
              <span className="text-2xl font-bold">{reasonStats[reason]}</span>
            </div>
            <p className="text-sm font-medium">{RETURN_REASON_MAP[reason]}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">退件记录</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  退件单号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  关联备货单
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  原因
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  处理人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  仓库
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {returnRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-blue-600">{record.returnNo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.preparationOrderNo ? (
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{record.preparationOrderNo}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className="font-mono text-sm text-gray-900">{record.sku}</span>
                      <p className="text-xs text-gray-500">{record.skuName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {record.quantity} 件
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reasonColors[record.reasonCode]}`}
                    >
                      {RETURN_REASON_MAP[record.reasonCode]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{record.handlerName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{record.warehouseName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500 text-sm">
                        {new Date(record.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
