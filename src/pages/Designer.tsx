import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  User,
  FileText,
  LogOut,
  Search,
  Clock,
  Package,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import { Pagination } from '@/components/Pagination';
import { OrderStatus } from '@/types';

export default function Designer() {
  const navigate = useNavigate();
  const {
    initMockData,
    getScanFilesForDesigner,
    setCurrentRole,
    currentRole,
    currentUser,
    setCurrentUser,
  } = useAppStore();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');

  useEffect(() => {
    initMockData();
    if (!currentRole) {
      setCurrentRole('DESIGNER');
    }
    if (!currentUser) {
      setCurrentUser('设计师老李');
    }
  }, [initMockData, currentRole, currentUser, setCurrentRole, setCurrentUser]);

  const result = getScanFilesForDesigner({
    page,
    pageSize,
    keyword: keyword || undefined,
    status: statusFilter || undefined,
  });

  const handleLogout = () => {
    setCurrentRole(null);
    navigate('/');
  };

  const handleProcess = (scanFileId: string) => {
    navigate(`/designer/scan/${scanFileId}`);
  };

  const handleViewAssignments = () => {
    navigate('/designer/assignments');
  };

  const stats = [
    { label: '待处理扫描', value: result.total, color: 'text-primary-600', bg: 'bg-primary-50' },
    {
      label: '待处理',
      value: useAppStore.getState().scanFiles.filter((s) => s.status === 'UPLOADED').length,
      color: 'text-warning-600',
      bg: 'bg-warning-50',
    },
    {
      label: '处理中',
      value: useAppStore.getState().scanFiles.filter((s) => s.status === 'PROCESSED').length,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '已派单',
      value: useAppStore.getState().assignments.length,
      color: 'text-success-600',
      bg: 'bg-success-50',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <Wrench size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-700">数字设计师工作台</h1>
                <p className="text-xs text-neutral-500">扫描处理 · 智能派单</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleViewAssignments}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <Package size={16} />
                派单回看
              </button>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <User size={16} />
                <span>{currentUser || '未登录'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <FileText size={24} className={stat.color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200 bg-gradient-to-r from-primary-500 to-primary-600">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">待处理扫描列表</h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60"
                  />
                  <input
                    type="text"
                    placeholder="搜索订单号/客户/文件名"
                    value={keyword}
                    onChange={(e) => {
                      setKeyword(e.target.value);
                      setPage(1);
                    }}
                    className="w-64 pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    订单号
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    客户姓名
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    文件名
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    上传时间
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {result.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-neutral-500">
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={48} className="text-neutral-300" />
                        <p>暂无待处理扫描</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  result.data.map(({ scanFile, order }) => (
                    <tr
                      key={scanFile.id}
                      className="hover:bg-primary-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-primary-600">{order.orderNo}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <User size={14} className="text-primary-600" />
                          </div>
                          <span className="text-neutral-900">{order.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-neutral-700">{scanFile.fileName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-neutral-700">
                          <Clock size={14} className="text-neutral-400" />
                          {new Date(scanFile.uploadedAt).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleProcess(scanFile.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-sm font-medium hover:bg-primary-100 transition-colors"
                        >
                          <Wrench size={14} />
                          {scanFile.status === 'UPLOADED' ? '开始处理' : '继续处理'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={result.totalPages}
            pageSize={pageSize}
            totalItems={result.total}
            onPageChange={setPage}
          />
        </div>
      </main>
    </div>
  );
}
