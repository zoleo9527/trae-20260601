import { useState } from 'react';
import { AlertTriangle, Clock, MessageSquare, CheckCircle, ArrowRight, Search, Filter } from 'lucide-react';
import { useClaimStore } from '../store/claimStore';
import type { Claim } from '../types';

export function ExceptionsPage() {
  const { claims, addRemark, updateClaimStatus, updateResponsibility } = useClaimStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [remarkText, setRemarkText] = useState('');
  const [selectedResponsibility, setSelectedResponsibility] = useState<Claim['responsibility']>('company');

  const exceptionClaims = claims.filter((claim) => claim.status === 'exception');

  const filteredClaims = exceptionClaims.filter((claim) => {
    return claim.customerName.includes(searchTerm) || 
           claim.damageDescription.includes(searchTerm) ||
           claim.id.includes(searchTerm);
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenActionModal = (claim: Claim) => {
    setSelectedClaim(claim);
    setSelectedResponsibility(claim.responsibility);
    setRemarkText('');
    setShowActionModal(true);
  };

  const handleResolve = () => {
    if (!selectedClaim) return;

    if (remarkText.trim()) {
      addRemark(selectedClaim.id, {
        userId: 'u_admin',
        userName: '管理员',
        content: remarkText,
      });
    }

    updateResponsibility(selectedClaim.id, selectedResponsibility);
    updateClaimStatus(selectedClaim.id, 'processing');

    setShowActionModal(false);
    setSelectedClaim(null);
    setRemarkText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">异常提醒</h2>
          <p className="text-sm text-gray-500 mt-1">处理异常工单，解决责任争议</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">{exceptionClaims.length} 个异常工单</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户名称、工单编号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">{filteredClaims.length} 条记录</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredClaims.map((claim) => (
          <div key={claim.id} className="bg-white rounded-xl border-2 border-red-200 overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-800">异常工单</span>
                  <span className="font-mono text-sm text-primary-600">{claim.id}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <Clock className="w-4 h-4" />
                  <span>创建于 {formatDate(claim.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">{claim.customerName} - {claim.customerPhone}</h3>
                  <p className="text-sm text-gray-600">{claim.damageDescription}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  claim.responsibility === 'company' ? 'text-red-600 bg-red-50' :
                  claim.responsibility === 'customer' ? 'text-gray-600 bg-gray-50' :
                  claim.responsibility === 'third_party' ? 'text-blue-600 bg-blue-50' : 'text-yellow-600 bg-yellow-50'
                }`}>
                  {claim.responsibility === 'company' ? '我方责任' :
                   claim.responsibility === 'customer' ? '客户责任' :
                   claim.responsibility === 'third_party' ? '第三方责任' : '责任待定'}
                </span>
              </div>

              {claim.exceptionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-red-800 text-sm">异常原因</span>
                      <p className="text-sm text-red-700 mt-1">{claim.exceptionReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {claim.damagePhotos.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {claim.damagePhotos.slice(0, 3).map((photo, index) => (
                    <div key={index} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      <img src={photo} alt={`照片${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {claim.remarks.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">处理备注 ({claim.remarks.length})</span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {claim.remarks.map((remark) => (
                      <div key={remark.id} className="flex items-start gap-2">
                        <span className="text-xs font-medium text-primary-600 flex-shrink-0">{remark.userName}</span>
                        <span className="text-xs text-gray-600">{remark.content}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  最后更新: {formatDate(claim.updatedAt)}
                </span>
                <button
                  onClick={() => handleOpenActionModal(claim)}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  处理异常
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClaims.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">暂无异常工单</h3>
          <p className="text-sm text-gray-500">所有工单均正常处理中</p>
        </div>
      )}

      {showActionModal && selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">处理异常工单: {selectedClaim.id}</h3>
              <button onClick={() => setShowActionModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-red-800 text-sm">当前异常</span>
                    <p className="text-sm text-red-700 mt-1">{selectedClaim.exceptionReason}</p>
                  </div>
                </div>
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
                  placeholder="请输入处理备注，说明异常处理结果..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleResolve}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  解决并继续处理
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
