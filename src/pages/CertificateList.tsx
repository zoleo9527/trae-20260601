import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { StatusTag } from '@/components/common/StatusTag';
import { Certificate } from '@/types';
import { Link } from 'react-router-dom';
import { Search, Filter, Award, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const CertificateList: React.FC = () => {
  const certificates = useStore((state) => state.certificates);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);

  const filteredCertificates = certificates.filter((c) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && c.status === 'pending') ||
      (filter === 'ready' && c.status === 'ready') ||
      (filter === 'issued' && c.status === 'issued');

    const matchesSearch =
      c.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.activityName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const filterOptions = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待制作' },
    { value: 'ready', label: '待发放' },
    { value: 'issued', label: '已发放' },
  ];

  const statusLabels = {
    pending: '待制作',
    ready: '待发放',
    issued: '已发放',
    archived: '已归档',
  };

  const statusTypes = {
    pending: 'pending' as const,
    ready: 'in_progress' as const,
    issued: 'completed' as const,
    archived: 'completed' as const,
  };

  const toggleSelect = (id: string) => {
    setSelectedCerts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedCerts.length === filteredCertificates.length) {
      setSelectedCerts([]);
    } else {
      setSelectedCerts(filteredCertificates.map((c) => c.id));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main mb-2">证书管理</h1>
        <p className="text-text-muted">查看和管理活动证书发放</p>
      </div>

      <div className="bg-white rounded-xl p-4 border border-border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="搜索学员姓名或活动名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-text-muted" />
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text-main hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedCerts.length > 0 && (
        <div className="bg-primary rounded-xl p-4 text-white flex items-center justify-between">
          <span>已选择 {selectedCerts.length} 项</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white text-primary rounded-lg font-medium hover:bg-gray-100 transition-colors">
              批量发放
            </button>
            <button
              onClick={() => setSelectedCerts([])}
              className="px-4 py-2 bg-white/20 rounded-lg font-medium hover:bg-white/30 transition-colors"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCerts.length === filteredCertificates.length && filteredCertificates.length > 0}
                    onChange={selectAll}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-main">
                  学员姓名
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-main">
                  活动名称
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-main">
                  联系方式
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-main">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-main">
                  发放方式
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-main">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCertificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCerts.includes(cert.id)}
                      onChange={() => toggleSelect(cert.id)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-primary" />
                      <span className="font-medium text-text-main">
                        {cert.recipientName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-main">
                    {cert.activityName}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted">
                    {cert.recipientPhone || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusTag
                      status={statusTypes[cert.status]}
                      label={statusLabels[cert.status]}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-text-main">
                    {cert.issueMethod === 'onsite'
                      ? '现场领取'
                      : cert.issueMethod === 'mail'
                      ? '邮寄'
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/certificate/${cert.id}`}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCertificates.length === 0 && (
          <div className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
            <p className="text-text-muted">没有找到匹配的证书</p>
          </div>
        )}
      </div>
    </div>
  );
};
