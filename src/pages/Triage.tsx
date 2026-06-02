import { useState } from 'react';
import { UserCheck, ChevronDown, UserCircle } from 'lucide-react';
import { useTriageStore } from '../store/useTriageStore';
import { useCounselorStore } from '../store/useCounselorStore';
import { StatusBadge } from '../components/StatusBadge';

export function Triage() {
  const { triageItems, assignCounselor, getPendingTriage, getAssignedTriage } = useTriageStore();
  const { getCounselorById } = useCounselorStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'assigned'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pendingItems = getPendingTriage();
  const assignedItems = getAssignedTriage();
  const displayItems = activeTab === 'pending' ? pendingItems : assignedItems;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">分诊管理</h1>
        <p className="muted-text mt-0.5">为初访来访者匹配合适的咨询师</p>
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
          待分诊 {pendingItems.length > 0 && `(${pendingItems.length})`}
        </button>
        <button
          onClick={() => setActiveTab('assigned')}
          className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
            activeTab === 'assigned'
              ? 'bg-white text-text-primary shadow-sm font-medium'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          已分配 {assignedItems.length > 0 && `(${assignedItems.length})`}
        </button>
      </div>

      <div className="space-y-3">
        {displayItems.length === 0 ? (
          <div className="card p-16 text-center">
            <UserCheck size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-text-tertiary">
              {activeTab === 'pending' ? '暂无待分诊断' : '暂无已分配记录'}
            </p>
          </div>
        ) : (
          displayItems.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div key={item.id} className="card p-0">
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface-hover transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center">
                      <UserCircle size={18} className="text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary">{item.clientName}</p>
                        <StatusBadge type="triage" status={item.status} />
                      </div>
                      <p className="text-2xs text-text-tertiary mt-0.5">{item.createdAt} 提交</p>
                    </div>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-text-tertiary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                    <div className="mb-5">
                      <p className="subsection-title mb-2">初访记录</p>
                      <p className="detail-text bg-surface-muted p-4 rounded-md">{item.intakeNotes}</p>
                    </div>

                    {item.status === 'pending' && (
                      <div>
                        <p className="subsection-title mb-3">推荐咨询师</p>
                        <div className="grid grid-cols-2 gap-3">
                          {item.suggestedCounselors.map((cid) => {
                            const counselor = getCounselorById(cid);
                            if (!counselor) return null;
                            return (
                              <div
                                key={cid}
                                className="p-4 border border-gray-100 rounded-lg hover:border-primary-200 hover:bg-primary-50/30 transition-colors cursor-pointer group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  assignCounselor(item.id, cid);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-text-primary">{counselor.name}</p>
                                  <span className="text-2xs text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">点击分配</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {counselor.specialty.map((s) => (
                                    <span key={s} className="text-2xs px-2 py-0.5 bg-surface-muted text-text-secondary rounded">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {item.status === 'assigned' && item.assignedCounselorId && (() => {
                      const counselor = getCounselorById(item.assignedCounselorId);
                      return counselor ? (
                        <div>
                          <p className="subsection-title mb-2">已分配</p>
                          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                            <p className="text-sm font-medium text-text-primary">{counselor.name}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {counselor.specialty.map((s) => (
                                <span key={s} className="text-2xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
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
