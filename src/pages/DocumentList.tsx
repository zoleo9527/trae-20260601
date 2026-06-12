import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useDocumentStore } from '../stores';
import { DocumentStatusLabels, DocumentStatus } from '../types';
import clsx from 'clsx';

export default function DocumentList() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { documents, loading, fetchDocuments } = useDocumentStore();
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchDocuments({ projectId: projectId || undefined });
  }, [projectId]);

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    fetchDocuments({ projectId: projectId || undefined, status: status || undefined });
  };

  const statusColors: Record<DocumentStatus, string> = {
    pending: 'bg-gray-100 text-gray-700',
    drafting: 'bg-blue-100 text-blue-700',
    review: 'bg-yellow-100 text-yellow-700',
    published: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const statusIcons: Record<DocumentStatus, any> = {
    pending: Clock,
    drafting: FileText,
    review: Clock,
    published: CheckCircle,
    rejected: AlertCircle,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">文件编制</h1>
        <p className="text-gray-500 mt-1">管理所有招标文件编制任务</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索项目名称..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">状态筛选:</span>
            {['全部', ...Object.keys(DocumentStatusLabels)].map((status) => (
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
                {status === '全部' ? '全部' : DocumentStatusLabels[status as DocumentStatus]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">负责人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">答疑记录</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">评标安排</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">更新时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const StatusIcon = statusIcons[doc.status];
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/documents/${doc.id}`} className="font-medium text-primary-600 hover:underline">
                          {doc.projectName || `项目 ${doc.projectId.slice(0, 8)}`}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit', statusColors[doc.status])}>
                          <StatusIcon className="w-3 h-3" />
                          {DocumentStatusLabels[doc.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{doc.handler}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {doc.qaRecords.length > 0 ? `${doc.qaRecords.length} 条` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {doc.evaluation ? (
                          <span className="text-green-600">
                            {new Date(doc.evaluation.scheduledAt).toLocaleDateString('zh-CN')}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(doc.updatedAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="text-sm text-primary-600 hover:underline"
                        >
                          查看详情
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
