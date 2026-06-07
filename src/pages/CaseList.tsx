import { ArrowRight, Eye, Filter, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReasonTag, StatusTag } from '../components/StatusTag';
import { useAppStore } from '../store/appStore';

export function CaseList() {
  const { cases } = useAppStore();

  const stats = {
    total: cases.length,
    processing: cases.filter((c) => c.status !== 'closed').length,
    recalling: cases.filter((c) => c.status === 'recalling').length,
    closed: cases.filter((c) => c.status === 'closed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">退货案件管理</h2>
          <p className="text-slate-500 mt-1">查看和管理所有客户退货案件</p>
        </div>
        <Link
          to="/return/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E3A5F] text-white rounded-md hover:bg-[#2a4d7a] transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>新增退货登记</span>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="案件总数" value={stats.total} color="slate" />
        <StatCard label="处理中" value={stats.processing} color="blue" />
        <StatCard label="召回中" value={stats.recalling} color="red" />
        <StatCard label="已关闭" value={stats.closed} color="green" />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索案件号、客户名称、批号..."
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-80"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-600 hover:bg-slate-50">
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>
          <span className="text-sm text-slate-500">共 {cases.length} 条记录</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  案件编号
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  客户名称
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  产品/批号
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  退货原因
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  数量
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  复检结论
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  登记时间
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm font-medium text-[#1E3A5F]">
                      {item.caseNo}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-800">{item.customerName}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{item.productName}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{item.batchNo}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <ReasonTag reason={item.returnReason} />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-700 font-medium">
                      {item.returnQuantity} {item.unit}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {item.conclusion ? (
                      <StatusTag type="conclusion" status={item.conclusion} />
                    ) : (
                      <span className="text-sm text-slate-400">待复检</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <StatusTag type="case" status={item.status} />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-600">{item.registeredAt}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/return/${item.id}`}
                        className="inline-flex items-center gap-1 text-sm text-[#1E3A5F] hover:text-[#2a4d7a] font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        详情
                      </Link>
                      <Link
                        to={`/return/${item.id}/trace`}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        溯源
                        <ArrowRight className="w-4 h-4" />
                      </Link>
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
}

interface StatCardProps {
  label: string;
  value: number;
  color: 'slate' | 'blue' | 'green' | 'red';
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className={`p-5 rounded-lg border ${colorClasses[color]} transition-all hover:shadow-sm`}>
      <div className="text-sm font-medium opacity-80">{label}</div>
      <div className="text-3xl font-bold mt-2">{value}</div>
    </div>
  );
}
