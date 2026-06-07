import { Droplets, AlertCircle } from 'lucide-react';
import type { OilData } from '@/types';

interface OilDataPanelProps {
  oilData?: OilData[];
}

export default function OilDataPanel({ oilData }: OilDataPanelProps) {
  if (!oilData || oilData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Droplets className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">油品损耗数据</h3>
        </div>
        <p className="text-gray-500 text-sm">暂无油品数据，请计量员补充</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Droplets className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">油品损耗数据</h3>
            <p className="text-sm text-gray-500">计量员盘点数据</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="table-header">油罐号</th>
              <th className="table-header">油品</th>
              <th className="table-header">期初库存</th>
              <th className="table-header">期末库存</th>
              <th className="table-header">销售量</th>
              <th className="table-header">实际损耗</th>
              <th className="table-header">标准损耗</th>
              <th className="table-header">差异</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {oilData.map((item, index) => {
              const isAbnormal = item.difference > 10;
              return (
                <tr key={index} className={isAbnormal ? 'bg-rose-50' : ''}>
                  <td className="table-cell font-medium">{item.tankNo}</td>
                  <td className="table-cell">{item.oilType}</td>
                  <td className="table-cell">{item.startStock} L</td>
                  <td className="table-cell">{item.endStock} L</td>
                  <td className="table-cell">{item.salesVolume} L</td>
                  <td className="table-cell">{item.actualLoss} L</td>
                  <td className="table-cell">{item.standardLoss.toFixed(2)} L</td>
                  <td className="table-cell">
                    <div className={`inline-flex items-center gap-1 ${isAbnormal ? 'text-rose-600 font-semibold' : 'text-gray-700'}`}>
                      {isAbnormal && <AlertCircle className="w-4 h-4" />}
                      +{item.difference.toFixed(2)} L
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
