import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { TYPE_LABELS, STATUS_LABELS, SOURCE_LABELS } from '../../shared/types';
import { Search, Filter, Plus } from 'lucide-react';

export default function ComplaintList() {
  const { complaints, fetchComplaints, loading } = useStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchComplaints({ status: statusFilter || undefined, type: typeFilter || undefined });
  }, [statusFilter, typeFilter]);

  const filtered = complaints.filter(
    (c) =>
      !search ||
      c.title.includes(search) ||
      c.customerName.includes(search) ||
      c.complaintNo.includes(search)
  );

  function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleDateString('zh-CN');
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">投诉记录</h1>
          <p className="text-gray-500">查看所有投诉处理记录</p>
        </div>
        <Link to="/complaints/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          新建投诉
        </Link>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索单号、标题、客户名..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500"
            >
              <option value="">全部状态</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500"
            >
              <option value="">全部类型</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-navy-900 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  投诉单号
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  标题
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  客户
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  来源
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  优先级
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((complaint) => (
                <tr
                  key={complaint.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => (window.location.href = `/complaints/${complaint.id}`)}
                >
                  <td className="px-6 py-4 text-sm font-medium text-navy-900">
                    {complaint.complaintNo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{complaint.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{complaint.customerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{TYPE_LABELS[complaint.type]}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {SOURCE_LABELS[complaint.source]}
                  </td>
                  <td className="px-6 py-4">
                    <PriorityBadge priority={complaint.priority} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={complaint.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatTime(complaint.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-gray-500">暂无记录</div>
          )}
        </div>
      )}
    </div>
  );
}
