'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ReportStatus, Role } from '@/lib/types';
import { statusLabels, statusColors, formatCurrency, formatDate, isAbnormal } from '@/lib/utils';

interface Material {
  id: number;
  name: string;
  type: string;
  received: boolean;
}

interface Report {
  id: number;
  reportNo: string;
  reportMonth: string;
  salesAmount: string | number;
  rentDeduction: string | number;
  netSettlement: string | number;
  status: ReportStatus;
  createdAt: string;
  submittedAt: string | null;
  deadline: string | null;
  brand: {
    id: number;
    name: string;
    storeName: string;
  };
  materials: Material[];
  _count: {
    materials: number;
  };
  missingMaterials?: string | null;
  rejectReason?: string | null;
  isOverdue?: boolean;
}

interface ListResponse {
  reports: Report[];
  stats: any[];
  abnormalCount: number;
  total: number;
  brands: { id: number; name: string }[];
}

interface Brand {
  id: number;
  name: string;
}

const roleTabs: Record<Role, { key: string; label: string }[]> = {
  [Role.LEASING_MANAGER]: [
    { key: 'all', label: '全部' },
    { key: 'abnormal', label: '异常单' },
    { key: 'MATERIALS_COMPLETE', label: '待复核' },
    { key: 'REVIEW_PASSED', label: '待结算' },
    { key: 'SETTLED', label: '已结算' },
  ],
  [Role.OPERATION_SUPERVISOR]: [
    { key: 'all', label: '全部' },
    { key: 'abnormal', label: '异常单' },
    { key: 'SUBMITTED', label: '待收材料' },
    { key: 'MATERIALS_MISSING', label: '材料缺失' },
    { key: 'MATERIALS_COMPLETE', label: '已提交复核' },
  ],
  [Role.BRAND_MANAGER]: [
    { key: 'all', label: '全部' },
    { key: 'DRAFT', label: '草稿' },
    { key: 'SUBMITTED', label: '审核中' },
    { key: 'MATERIALS_MISSING', label: '需补充' },
    { key: 'REVIEW_REJECTED', label: '被驳回' },
    { key: 'SETTLED', label: '已结算' },
  ],
};

const availableMonths = () => {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    );
  }
  return months;
};

export default function ReportsClient({ currentUser }: { currentUser: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ListResponse | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [brandFilter, setBrandFilter] = useState(searchParams.get('brandId') || '');
  const [monthFilter, setMonthFilter] = useState(searchParams.get('reportMonth') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  const activeTab = searchParams.get('tab') || 'all';
  const tabs = roleTabs[currentUser.role as Role] || roleTabs[Role.LEASING_MANAGER];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?${searchParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    if (currentUser.role === Role.BRAND_MANAGER) return;
    try {
      const res = await fetch('/api/brands');
      if (res.ok) {
        const json = await res.json();
        setBrands(json);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  useEffect(() => {
    fetchBrands();
  }, [currentUser.role]);

  const applyFilters = (updates: {
    keyword?: string;
    brandId?: string;
    reportMonth?: string;
    status?: string;
    tab?: string;
  }) => {
    const params = new URLSearchParams(searchParams);

    if (updates.tab !== undefined) {
      if (updates.tab === 'all') {
        params.delete('tab');
        params.delete('status');
      } else if (updates.tab === 'abnormal') {
        params.set('tab', 'abnormal');
        params.delete('status');
      } else {
        params.set('status', updates.tab);
        params.delete('tab');
      }
    }

    if (updates.keyword !== undefined) {
      if (updates.keyword) params.set('keyword', updates.keyword);
      else params.delete('keyword');
    }
    if (updates.brandId !== undefined) {
      if (updates.brandId) params.set('brandId', updates.brandId);
      else params.delete('brandId');
    }
    if (updates.reportMonth !== undefined) {
      if (updates.reportMonth) params.set('reportMonth', updates.reportMonth);
      else params.delete('reportMonth');
    }
    if (updates.status !== undefined) {
      if (updates.status) params.set('status', updates.status);
      else params.delete('status');
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleTabChange = (tab: string) => {
    applyFilters({ tab });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ keyword });
  };

  const clearFilters = () => {
    setKeyword('');
    setBrandFilter('');
    setMonthFilter('');
    setStatusFilter('');
    router.push(pathname);
  };

  const hasFilters =
    !!searchParams.get('keyword') ||
    !!searchParams.get('brandId') ||
    !!searchParams.get('reportMonth') ||
    (!!searchParams.get('status') && !searchParams.get('tab'));

  const canEditReport = (report: Report) => {
    if (currentUser.role !== Role.BRAND_MANAGER) return false;
    return [
      ReportStatus.DRAFT,
      ReportStatus.MATERIALS_MISSING,
      ReportStatus.REVIEW_REJECTED,
      ReportStatus.OVERDUE,
    ].includes(report.status);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">销售上报</h1>
          <p className="text-slate-500 mt-1">
            销售上报 · 材料审核 · 费用结算全流程跟踪
          </p>
        </div>
        {currentUser.role === Role.BRAND_MANAGER && (
          <Link href="/reports/new" className="btn-primary">
            + 新建上报
          </Link>
        )}
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-sm text-slate-500">全部单据</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{data.total}</p>
          </div>
          <div className="card p-4 border-l-4 border-l-red-500">
            <p className="text-sm text-slate-500">异常单</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{data.abnormalCount}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500">本月销售</p>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {formatCurrency(
                data.stats
                  ?.filter((s) => s.status !== ReportStatus.DRAFT)
                  .reduce((sum, s) => sum + (s._sum.salesAmount || 0), 0) || 0
              )}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500">待结算金额</p>
            <p className="text-lg font-bold text-brand-600 mt-1">
              {formatCurrency(
                data.stats
                  ?.filter((s) => s.status === ReportStatus.REVIEW_PASSED)
                  .reduce((sum, s) => sum + (s._sum.netSettlement || 0), 0) || 0
              )}
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 pt-4">
            <div className="flex space-x-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                    activeTab === tab.key ||
                    (tab.key === 'all' && !searchParams.get('status') && !searchParams.get('tab'))
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索单号、品牌、门店..."
                className="input w-64"
              />
              <button type="submit" className="btn-secondary">
                搜索
              </button>
            </form>
          </div>

          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {currentUser.role !== Role.BRAND_MANAGER && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600 whitespace-nowrap">品牌：</label>
                    <select
                      value={brandFilter}
                      onChange={(e) => {
                        setBrandFilter(e.target.value);
                        applyFilters({ brandId: e.target.value });
                      }}
                      className="input text-sm py-1.5"
                    >
                      <option value="">全部品牌</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600 whitespace-nowrap">月份：</label>
                  <select
                    value={monthFilter}
                    onChange={(e) => {
                      setMonthFilter(e.target.value);
                      applyFilters({ reportMonth: e.target.value });
                    }}
                    className="input text-sm py-1.5"
                  >
                    <option value="">全部月份</option>
                    {availableMonths().map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600 whitespace-nowrap">状态：</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      applyFilters({ status: e.target.value, tab: undefined });
                    }}
                    className="input text-sm py-1.5"
                  >
                    <option value="">全部状态</option>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-ghost text-sm text-slate-500"
                >
                  清除筛选
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  单号 / 品牌
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  月份
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  销售金额
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  净结算
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  提交时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    加载中...
                  </td>
                </tr>
              ) : data?.reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    暂无数据
                  </td>
                </tr>
              ) : (
                data?.reports.map((report) => (
                  <tr
                    key={report.id}
                    className={`hover:bg-slate-50 ${
                      isAbnormal(report.status) ? 'bg-red-50/30' : ''
                    } ${report.status === ReportStatus.DRAFT ? 'bg-slate-50/50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {report.status === ReportStatus.DRAFT && (
                          <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600">
                            草稿
                          </span>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{report.reportNo}</p>
                          <p className="text-sm text-slate-500">
                            {report.brand.name} · {report.brand.storeName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {report.reportMonth}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(report.salesAmount)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-brand-600">
                      {formatCurrency(report.netSettlement)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[report.status]}`}
                      >
                        {isAbnormal(report.status) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 mt-1"></span>
                        )}
                        {statusLabels[report.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {report.submittedAt
                        ? formatDate(report.submittedAt)
                        : report.status === ReportStatus.DRAFT
                        ? '未提交'
                        : formatDate(report.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex justify-end gap-3">
                        {canEditReport(report) && (
                          <Link
                            href={`/reports/new?edit=${report.id}`}
                            className="text-slate-600 hover:text-slate-900 font-medium"
                          >
                            编辑
                          </Link>
                        )}
                        <Link
                          href={`/reports/${report.id}`}
                          className="text-brand-600 hover:text-brand-700 font-medium"
                        >
                          查看详情 →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
