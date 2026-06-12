import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../lib/utils';

interface Clarification {
  id: string;
  registrationId: string;
  question: string;
  answer?: string;
  status: string;
  createdById: string;
  reviewedById?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  registration?: {
    projectName: string;
  };
  createdBy?: {
    name: string;
    role: string;
  };
  reviewedBy?: {
    name: string;
    role: string;
  };
}

export default function Clarifications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    registrationId: searchParams.get('registrationId') || ''
  });

  useEffect(() => {
    fetchClarifications();
  }, [page, filters]);

  const fetchClarifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', '10');
      if (filters.status) params.set('status', filters.status);
      if (filters.registrationId) params.set('registrationId', filters.registrationId);

      const response = await fetch(`/api/clarifications?${params}`);
      const data = await response.json();
      if (data.success) {
        setClarifications(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch clarifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    setSearchParams(searchParams);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索报名记录ID..."
                  value={filters.registrationId}
                  onChange={(e) => handleFilterChange('registrationId', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部状态</option>
                <option value="draft">草稿</option>
                <option value="pending_review">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已退回</option>
                <option value="published">已发布</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  项目名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  问题内容
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  版本
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : clarifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                clarifications.map((clar) => (
                  <tr key={clar.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {clar.registration?.projectName || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/clarifications/${clar.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {clar.question.substring(0, 50)}...
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={clar.status} type="clarification" />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {clar.createdBy?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      v{clar.version}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(clar.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/clarifications/${clar.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        查看
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {!loading && total > 10 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                共 {total} 条记录
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-600">第 {page} 页</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * 10 >= total}
                  className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}