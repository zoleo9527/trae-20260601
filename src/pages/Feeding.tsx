import { useState } from 'react';
import { useFarmStore } from '@/store';
import { Search, Plus, Calendar, User, Utensils, CheckCircle2, Clock } from 'lucide-react';

export default function Feeding() {
  const store = useFarmStore();
  const [searchKeyword, setSearchKeyword] = useState('');

  const filteredRecords = store.feedingPlans.filter(record => {
    const cattle = store.getCattleById(record.cattleId);
    return searchKeyword === '' || 
      cattle?.tagId.includes(searchKeyword) || 
      cattle?.name.includes(searchKeyword) ||
      record.feedType.includes(searchKeyword);
  });

  const completedCount = store.feedingPlans.filter(r => r.status === 'completed').length;
  const pendingCount = store.feedingPlans.filter(r => r.status === 'pending').length;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">饲喂计划</h2>
          <p className="text-sm text-gray-500 mt-1">管理牛只饲喂计划</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-pasture-500 text-white rounded-lg hover:bg-pasture-600 transition-colors">
          <Plus className="w-4 h-4" />
          新建计划
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">计划总数</p>
          <p className="text-2xl font-bold text-blue-600">{store.feedingPlans.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">已完成</p>
          <p className="text-2xl font-bold text-green-600">{completedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">待执行</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索牛只、饲料类型..."
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
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">饲料类型</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">投喂量</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">饲喂时间</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">操作员</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const cattle = store.getCattleById(record.cattleId);
                const isCompleted = record.status === 'completed';
                return (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 text-sm text-gray-600">#{record.id}</td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium text-gray-900">
                        {cattle ? `${cattle.tagId} ${cattle.name}` : '未知'}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{record.feedType}</td>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{record.amount} kg</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{record.feedingTime}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {isCompleted ? '已完成' : '待执行'}
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
              <Utensils className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>暂无饲喂计划</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
