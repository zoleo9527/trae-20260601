import { Fuel, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { NozzleData } from '@/types';

interface NozzleDataPanelProps {
  nozzleData?: NozzleData[];
}

export default function NozzleDataPanel({ nozzleData }: NozzleDataPanelProps) {
  if (!nozzleData || nozzleData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Fuel className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">油枪走字数据</h3>
        </div>
        <p className="text-gray-500 text-sm">暂无油枪数据</p>
      </div>
    );
  }

  const totalSystemSales = nozzleData.reduce((sum, n) => sum + n.systemSales, 0);
  const totalDifference = nozzleData.reduce((sum, n) => sum + n.difference, 0);
  const totalAmount = nozzleData.reduce((sum, n) => sum + n.amount, 0);
  const abnormalCount = nozzleData.filter((n) => Math.abs(n.difference) > 0).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Fuel className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">油枪走字数据</h3>
              <p className="text-sm text-gray-500">各油枪当班销售明细</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {abnormalCount > 0 ? (
              <span className="badge bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {abnormalCount} 支枪有差异
              </span>
            ) : (
              <span className="badge bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                全部正常
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-5">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">油枪数量</p>
            <p className="text-xl font-bold text-gray-900">{nozzleData.length}</p>
            <p className="text-xs text-gray-500">支</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">系统总销量</p>
            <p className="text-xl font-bold text-gray-900">{totalSystemSales.toFixed(2)}</p>
            <p className="text-xs text-gray-500">升</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">实走总差异</p>
            <p className={`text-xl font-bold ${totalDifference !== 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {totalDifference > 0 ? '+' : ''}{totalDifference.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">升</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">销售总额</p>
            <p className="text-xl font-bold text-primary-900">¥{totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="table-header">油枪号</th>
              <th className="table-header">油品</th>
              <th className="table-header">对应油罐</th>
              <th className="table-header">起始字码</th>
              <th className="table-header">结束字码</th>
              <th className="table-header">系统销量</th>
              <th className="table-header">实走销量</th>
              <th className="table-header">差异</th>
              <th className="table-header">单价</th>
              <th className="table-header">金额</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {nozzleData.map((item) => {
              const hasDiff = Math.abs(item.difference) > 0;
              return (
                <tr key={item.nozzleNo} className={hasDiff ? 'bg-amber-50/50' : ''}>
                  <td className="table-cell font-medium">{item.nozzleNo}</td>
                  <td className="table-cell">{item.oilType}</td>
                  <td className="table-cell text-gray-500">{item.tankNo}</td>
                  <td className="table-cell">{item.startReading.toFixed(2)}</td>
                  <td className="table-cell">{item.endReading.toFixed(2)}</td>
                  <td className="table-cell">{item.systemSales.toFixed(2)} L</td>
                  <td className="table-cell">{item.actualSales.toFixed(2)} L</td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center gap-1 ${hasDiff ? 'text-rose-600 font-semibold' : 'text-emerald-600'}`}>
                      {hasDiff && <AlertCircle className="w-3.5 h-3.5" />}
                      {item.difference > 0 ? '+' : ''}{item.difference.toFixed(2)} L
                    </span>
                  </td>
                  <td className="table-cell">¥{item.unitPrice.toFixed(2)}</td>
                  <td className="table-cell font-medium text-primary-900">¥{item.amount.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
