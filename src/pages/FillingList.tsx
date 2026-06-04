import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { FILLING_STATUS_LABELS, FILLING_STATUS_COLORS, ROLE_LABELS } from '../types';
import type { FillingSchedule } from '../types';

export default function FillingList() {
  const { currentUser, refreshTrigger } = useContext(AppContext);
  const [schedules, setSchedules] = useState<FillingSchedule[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/filling-schedules').then(r => r.json()).then(setSchedules);
  }, [refreshTrigger]);

  const filteredSchedules = filter === 'all'
    ? schedules
    : schedules.filter(s => s.status === filter);

  const statusFilters = [
    { key: 'all', label: '全部' },
    { key: 'DRAFT', label: '草稿' },
    { key: 'SUBMITTED', label: '待复核' },
    { key: 'APPROVED', label: '已通过' },
    { key: 'IN_PRODUCTION', label: '生产中' },
    { key: 'REJECTED', label: '已驳回' },
    { key: 'COMPLETED', label: '已完成' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">灌装排产</h1>
          <p className="text-gray-500 mt-1">管理啤酒灌装生产计划</p>
        </div>
        <button onClick={() => navigate('/filling/new')} className="btn-primary">
          + 新建灌装排产
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm rounded-full transition-all ${
              filter === f.key
                ? 'bg-beer-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-beer-300'
            }`}
          >
            {f.label}
            <span className="ml-1 opacity-75">
              ({f.key === 'all' ? schedules.length : schedules.filter(s => s.status === f.key).length})
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">批次号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">规格</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">灌装日期</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前处理</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSchedules.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              filteredSchedules.map(schedule => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm font-medium text-gray-900">{schedule.batchNo}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{schedule.productName}</div>
                    <div className="text-sm text-gray-500">{schedule.beerType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {schedule.volume}L / {schedule.targetBottles}瓶
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(schedule.fillingDate).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`status-badge ${FILLING_STATUS_COLORS[schedule.status]}`}>
                      {FILLING_STATUS_LABELS[schedule.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      schedule.currentHandler === currentUser?.role
                        ? 'bg-beer-100 text-beer-700 font-medium'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {ROLE_LABELS[schedule.currentHandler]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => navigate(`/filling/${schedule.id}`)}
                      className="text-beer-600 hover:text-beer-700 font-medium"
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
