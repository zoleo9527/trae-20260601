import { useState } from 'react';
import { Search, Filter, Plus, MessageSquare, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useClaimStore } from '../store/claimStore';
import { ClaimCard } from '../components/ClaimCard';
import type { Claim } from '../types';

export function ClaimsPage() {
  const { claims, addRemark, updateClaimStatus, updateResponsibility, getClaimById, sidebarOpen } = useClaimStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [remarkText, setRemarkText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Claim['status']>('processing');
  const [selectedResponsibility, setSelectedResponsibility] = useState<Claim['responsibility']>('company');

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch = claim.customerName.includes(searchTerm) || 
                          claim.damageDescription.includes(searchTerm) ||
                          claim.id.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待处理' },
    { value: 'processing', label: '处理中' },
    { value: 'review', label: '审核中' },
    { value: 'exception', label: '异常' },
  ];

  const handleOpenActionModal = (claim: Claim) => {
    setSelectedClaim(claim);
    setSelectedStatus(claim.status);
    setSelectedResponsibility(claim.responsibility);
    setShowActionModal(true);
  };

  const handleSubmitAction = () => {
    if (!selectedClaim) return;

    if (remarkText.trim()) {
      addRemark(selectedClaim.id, {
        userId: 'u_admin',
        userName: '管理员',
        content: remarkText,
      });
    }

    if (selectedStatus !== selectedClaim.status) {
      updateClaimStatus(selectedClaim.id, selectedStatus);
    }

    if (selectedResponsibility !== selectedClaim.responsibility) {
      updateResponsibility(selectedClaim.id, selectedResponsibility);
    }

    setShowActionModal(false);
    setRemarkText('');
    setSelectedClaim(null);
  };

  const statusLabels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    review: '审核中',
    approved: '已批准',
    paid: '已赔付',
    archived: '已归档',
    exception: '异常',
  };

  const responsibilityLabels: Record<string, string> = {
    company: '我方责任',
    customer: '客户责任',
    third_party: '第三方责任',
    undetermined: '责任待定',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">物损申诉处理</h2>
          <p className="text-sm text-gray-500 mt-1">处理客户物损申诉，记录处理动作</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户名称、工单编号或物损描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredClaims.map((claim) => (
          <div key={claim.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-primary-600">{claim.id}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    claim.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    claim.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    claim.status === 'review' ? 'bg-purple-100 text-purple-800' :
                    claim.status === 'exception' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {statusLabels[claim.status]}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    claim.responsibility === 'company' ? 'text-red-600 bg-red-50' :
                    claim.responsibility === 'customer' ? 'text-gray-600 bg-gray-50' :
                    claim.responsibility === 'third_party' ? 'text-blue-600 bg-blue-50' : 'text-yellow-600 bg-yellow-50'
                  }`}>
                    {responsibilityLabels[claim.responsibility]}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 mb-1">{claim.customerName} - {claim.customerPhone}</h3>
                  <p className="text-sm text-gray-600">{claim.damageDescription}</p>
                </div>
              </div>

              {claim.damagePhotos.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {claim.damagePhotos.slice(0, 3).map((photo, index) => (
                    <div key={index} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      <img src={photo} alt={`照片${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {claim.damagePhotos.length > 3 && (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                      +{claim.damagePhotos.length - 3}
                    </div>
                  )}
                </div>
              )}

              {claim.remarks.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">处理备注 ({claim.remarks.length})</span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {claim.remarks.slice(-2).map((remark) => (
                      <div key={remark.id} className="flex items-start gap-2">
                        <span className="text-xs font-medium text-primary-600 flex-shrink-0">{remark.userName}</span>
                        <span className="text-xs text-gray-600">{remark.content}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                更新于 {new Date(claim.updatedAt).toLocaleString('zh-CN')}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenActionModal(claim)}
                  className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  处理
                </button>
                {claim.status === 'processing' && (
                  <button
                    onClick={() => {
                      updateClaimStatus(claim.id, 'review');
                      addRemark(claim.id, { userId: 'u_admin', userName: '管理员', content: '已提交审核' });
                    }}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    提交审核
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showActionModal && selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">处理工单: {selectedClaim.id}</h3>
              <button onClick={() => setShowActionModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">当前状态</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as Claim['status'])}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pending">待处理</option>
                  <option value="processing">处理中</option>
                  <option value="review">审核中</option>
                  <option value="exception">异常</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">责任判定</label>
                <select
                  value={selectedResponsibility}
                  onChange={(e) => setSelectedResponsibility(e.target.value as Claim['responsibility'])}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="company">我方责任</option>
                  <option value="customer">客户责任</option>
                  <option value="third_party">第三方责任</option>
                  <option value="undetermined">责任待定</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">处理备注</label>
                <textarea
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="请输入处理备注，备注将被后续赔付流程继承..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">备注信息将被赔付处理流程继承，确保信息完整</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitAction}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  确认处理
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40" onClick={() => getClaimById('')}></div>}
    </div>
  );
}
