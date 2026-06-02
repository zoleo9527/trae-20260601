import { useState } from 'react';
import { AlertTriangle, Eye, Check, ChevronDown, Shield, ShieldAlert } from 'lucide-react';
import { useRiskStore } from '../store/useRiskStore';
import { useUserStore } from '../store/useUserStore';
import { StatusBadge } from '../components/StatusBadge';

export function RiskAlert() {
  const { currentUser } = useUserStore();
  const { riskCases, reviewCase, markActionTaken, getPendingReview, getReviewed } = useRiskStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const pendingCases = getPendingReview();
  const reviewedCases = getReviewed();
  const displayCases = activeTab === 'pending' ? pendingCases : reviewedCases;

  const anonymizeForSupervisor = (name: string) => {
    return name.replace(/\d+$/, '***');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">风险预警</h1>
        <p className="muted-text mt-0.5">
          {currentUser.role === 'supervisor'
            ? '审核高风险个案，信息已脱敏'
            : '查看上报的高风险个案'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card border-l-[3px] border-l-status-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xs text-text-tertiary">待审核</p>
              <p className="text-xl font-semibold text-status-warning mt-0.5">{pendingCases.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle size={20} className="text-status-warning" />
            </div>
          </div>
        </div>
        <div className="stat-card border-l-[3px] border-l-primary-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xs text-text-tertiary">已审核</p>
              <p className="text-xl font-semibold text-primary-600 mt-0.5">{reviewedCases.filter(c => c.status === 'reviewed').length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Eye size={20} className="text-primary-600" />
            </div>
          </div>
        </div>
        <div className="stat-card border-l-[3px] border-l-status-normal">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xs text-text-tertiary">已处理</p>
              <p className="text-xl font-semibold text-status-normal mt-0.5">{reviewedCases.filter(c => c.status === 'action_taken').length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Check size={20} className="text-status-normal" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-surface-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
            activeTab === 'pending'
              ? 'bg-white text-text-primary shadow-sm font-medium'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          待审核 {pendingCases.length > 0 && `(${pendingCases.length})`}
        </button>
        <button
          onClick={() => setActiveTab('reviewed')}
          className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
            activeTab === 'reviewed'
              ? 'bg-white text-text-primary shadow-sm font-medium'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          已处理 {reviewedCases.length > 0 && `(${reviewedCases.length})`}
        </button>
      </div>

      <div className="space-y-3">
        {displayCases.length === 0 ? (
          <div className="card p-16 text-center">
            <Shield size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-text-tertiary">
              {activeTab === 'pending' ? '暂无待审核个案' : '暂无已处理记录'}
            </p>
          </div>
        ) : (
          displayCases.map((caseItem) => {
            const isExpanded = expandedId === caseItem.id;
            const isCritical = caseItem.riskLevel === 'critical';
            const displayName = currentUser.role === 'supervisor'
              ? anonymizeForSupervisor(caseItem.clientName)
              : caseItem.clientName;

            return (
              <div
                key={caseItem.id}
                className={`card p-0 overflow-hidden ${isCritical ? 'border-l-[3px] border-l-red-500' : 'border-l-[3px] border-l-amber-400'}`}
              >
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface-hover transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : caseItem.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      isCritical ? 'bg-red-50' : 'bg-amber-50'
                    }`}>
                      {isCritical ? (
                        <ShieldAlert size={18} className="text-red-600" />
                      ) : (
                        <AlertTriangle size={18} className="text-amber-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary">{displayName}</p>
                        <span className={`badge ${isCritical ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                          {isCritical ? '极高' : '高'}
                        </span>
                      </div>
                      <p className="text-2xs text-text-tertiary mt-0.5">
                        {caseItem.counselorName} 上报 · {caseItem.reportedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge type="risk" status={caseItem.status} />
                    <ChevronDown
                      size={18}
                      className={`text-text-tertiary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                    <div className="mb-4">
                      <p className="subsection-title mb-2">风险指标</p>
                      <div className="flex flex-wrap gap-1.5">
                        {caseItem.riskIndicators.map((indicator) => (
                          <span
                            key={indicator}
                            className={`px-2.5 py-1 rounded text-2xs ${
                              isCritical ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {indicator}
                          </span>
                        ))}
                      </div>
                    </div>

                    {caseItem.supervisorNotes && (
                      <div className="mb-4">
                        <p className="subsection-title mb-2">督导意见</p>
                        <p className="detail-text bg-surface-muted p-4 rounded-md">
                          {caseItem.supervisorNotes}
                        </p>
                      </div>
                    )}

                    {caseItem.status === 'pending_review' && currentUser.role === 'supervisor' && (
                      <div className="mt-4">
                        <p className="subsection-title mb-2">审核意见</p>
                        <textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="请输入审核意见..."
                          className="w-full p-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400 resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => {
                              reviewCase(caseItem.id, reviewNotes);
                              setReviewNotes('');
                            }}
                            className="btn-primary"
                          >
                            确认审核
                          </button>
                          <button
                            onClick={() => markActionTaken(caseItem.id)}
                            className="btn-secondary"
                          >
                            标记已处理
                          </button>
                        </div>
                      </div>
                    )}

                    {caseItem.status === 'reviewed' && currentUser.role === 'supervisor' && (
                      <div className="mt-4">
                        <button
                          onClick={() => markActionTaken(caseItem.id)}
                          className="btn-primary"
                        >
                          标记已处理
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
