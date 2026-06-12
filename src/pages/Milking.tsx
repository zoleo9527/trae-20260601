import { useState } from 'react';
import { useFarmStore } from '@/store';
import { Search, Plus, Calendar, User, Milk } from 'lucide-react';

export default function Milking() {
  const store = useFarmStore();
  const [searchKeyword, setSearchKeyword] = useState('');

  const filteredRecords = store.milkingRecords.filter(record => {
    const cattle = store.getCattleById(record.cattleId);
    return searchKeyword === '' || 
      cattle?.tagId.includes(searchKeyword) || 
      cattle?.name.includes(searchKeyword) ||
      record.operator.includes(searchKeyword);
  });

  const qualityConfig = {
    good: { label: '优质', className: 'bg-green-100 text-green-700' },
    normal: { label: '正常', className: 'bg-blue-100 text-blue-700' },
    poor: { label: '较差', className: 'bg-red-100 text-red-700' },
  };

  const totalAmount = store.milkingRecords.reduce((sum, record) => sum + record.amount, 0);

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">挤奶记录</h2>
          <p className="text-sm text-gray-500 mt-1">查看牛只挤奶记录</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-pasture-500 text-white rounded-lg hover:bg-pasture-600 transition-colors">
          <Plus className="w-4 h-4" />
          新建记录
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">今日挤奶量</p>
          <p className="text-2xl font-bold text-pasture-600">{totalAmount.toFixed(1)} kg</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">记录总数</p>
          <p className="text-2xl font-bold text-blue-600">{store.milkingRecords.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">优质率</p>
          <p className="text-2xl font-bold text-green-600">
            {((store.milkingRecords.filter(r => r.quality === 'good').length / store.milkingRecords.length) * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索牛只、操作员..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pasture-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">编号</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">牛只信息</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">挤奶时间</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">挤奶量</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">品质</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">操作员</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const cattle = store.getCattleById(record.cattleId);
                const quality = qualityConfig[record.quality];
                return (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 text-sm text-gray-600">#{record.id}</td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium text-gray-900">
                        {cattle ? `${cattle.tagId} ${cattle.name}` : '未知'}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{record.milkingTime}</td>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{record.amount} kg</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${quality.className}`}>
                        {quality.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{record.operator}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Milk className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>暂无挤奶记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
