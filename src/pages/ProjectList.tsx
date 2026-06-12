import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProjectStore } from '../stores';
import { ProjectStatusLabels, ProjectStatus } from '../types';
import clsx from 'clsx';

export default function ProjectList() {
  const navigate = useNavigate();
  const { projects, pagination, loading, fetchProjects, setFilters } = useProjectStore();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects({ page: 1, pageSize: 10 });
  }, []);

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setFilters({ status: status || undefined });
  };

  const handlePageChange = (page: number) => {
    fetchProjects({ page, pageSize: 10, status: statusFilter || undefined });
  };

  const statusColors: Record<ProjectStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    initial_review: 'bg-yellow-100 text-yellow-700',
    re_review: 'bg-orange-100 text-orange-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">项目立项</h1>
          <p className="text-gray-500 mt-1">管理所有招标项目立项</p>
        </div>
        <button
          onClick={() => navigate('/projects/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建立项
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索项目名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">状态筛选:</span>
            {['全部', ...Object.keys(ProjectStatusLabels)].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status === '全部' ? '' : status)}
                className={clsx(
                  'px-3 py-1 rounded-full text-sm transition-colors',
                  (status === '全部' && !statusFilter) || statusFilter === status
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {status === '全部' ? '全部' : ProjectStatusLabels[status as ProjectStatus]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">委托单位</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">预算金额</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">招标方式</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">立项负责人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">文件编制负责人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/projects/${project.id}`} className="font-medium text-primary-600 hover:underline">
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{project.client}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      ¥{project.budget.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{project.biddingType}</td>
                    <td className="px-6 py-4">
                      <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', statusColors[project.status])}>
                        {ProjectStatusLabels[project.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{project.handler}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{project.documentHandler}</td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        查看详情
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              共 {pagination.total} 条记录，第 {pagination.page} / {pagination.totalPages} 页
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
