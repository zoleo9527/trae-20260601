import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Clock, Loader, AlertCircle, CheckCircle, Search, Filter, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { StatusBadge } from '@/components/StatusBadge';
import { RiskTag } from '@/components/RiskTag';
import { CUSTOMS_STATUS_MAP } from '@/types';
import type { CustomsDocStatus } from '@/types';
import { hasPermission } from '@/utils/permission';
import { CustomsSupplementModal } from '@/components/CustomsSupplementModal';

const CustomsCenter: React.FC = () => {
  const navigate = useNavigate();
  const { customsDocs, currentRole, submitCustomsSupplement } = useStore();

  const [statusFilter, setStatusFilter] = useState<CustomsDocStatus | 'ALL'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showSupplementModal, setShowSupplementModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const stats = useMemo(() => {
    return {
      pendingDeclare: customsDocs.filter(d => d.status === 'PENDING_DECLARE').length,
      declaring: customsDocs.filter(d => d.status === 'DECLARING').length,
      pendingSupplement: customsDocs.filter(d => d.status === 'PENDING_SUPPLEMENT').length,
      cleared: customsDocs.filter(d => d.status === 'CLEARED').length,
    };
  }, [customsDocs]);

  const filteredDocs = useMemo(() => {
    return customsDocs.filter(doc => {
      if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        if (
          !doc.docNo.toLowerCase().includes(keyword) &&
          !doc.preparationOrderNo.toLowerCase().includes(keyword) &&
          !doc.customsName.toLowerCase().includes(keyword)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [customsDocs, statusFilter, searchKeyword]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">报关资料中心</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待申报</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingDeclare}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">申报中</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.declaring}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待补件</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pendingSupplement}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已通关</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.cleared}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">筛选：</span>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CustomsDocStatus | 'ALL')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">全部状态</option>
              {Object.entries(CUSTOMS_STATUS_MAP).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索报关单号、备货单号、海关..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">报关单号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联备货单</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">海关</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">补件要求</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDocs.map(doc => {
                const isPendingSupplement = doc.status === 'PENDING_SUPPLEMENT';
                return (
                  <tr
                    key={doc.id}
                    className={`hover:bg-gray-50 transition-colors ${isPendingSupplement ? 'bg-orange-50' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-blue-600 cursor-pointer hover:underline">
                      {doc.docNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <Link 
                        to={`/preparation/${doc.preparationId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {doc.preparationOrderNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status} type="customs" />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{doc.customsName}</td>
                    <td className="px-4 py-3">
                      {isPendingSupplement && doc.supplementItems && doc.supplementItems.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {doc.supplementItems.map((item, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isPendingSupplement && hasPermission('customs', 'upload', currentRole) ? (
                        <button
                          className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setShowSupplementModal(true);
                          }}
                        >
                          上传补件
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDocs.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">暂无数据</p>
          </div>
        )}
      </div>

      <CustomsSupplementModal
        visible={showSupplementModal}
        doc={selectedDoc}
        onClose={() => {
          setShowSupplementModal(false);
          setSelectedDoc(null);
        }}
        onSubmit={(docId, supplementItems, remark) => {
          submitCustomsSupplement(docId, supplementItems, remark);
          setShowSupplementModal(false);
          setSelectedDoc(null);
        }}
      />
    </div>
  );
};

export default CustomsCenter;
