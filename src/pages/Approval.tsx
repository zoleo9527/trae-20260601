import { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, User } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { ReassessmentRecord, ApprovalRecord } from '@/types';

const conclusionColors: Record<string, string> = {
  '结案': 'bg-emerald-100 text-emerald-700',
  '续疗': 'bg-blue-100 text-blue-700',
  '转诊': 'bg-purple-100 text-purple-700',
  '换方案': 'bg-amber-100 text-amber-700',
};

export default function Approval() {
  const { patients, courses, reassessments, approveReassessment, rejectReassessment } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvalAction, setApprovalAction] = useState<'通过' | '退回'>('通过');
  const [suggestion, setSuggestion] = useState('');
  const [suggestedSessions, setSuggestedSessions] = useState('');
  const [notes, setNotes] = useState('');

  const pendingReassessments = reassessments.filter(r => r.status === '已提交');

  const handleApprove = (reassessment: ReassessmentRecord) => {
    const approval: ApprovalRecord = {
      id: `a-${Date.now()}`,
      reassessmentId: reassessment.id,
      directorId: 'd1',
      directorName: '赵德明',
      action: approvalAction,
      suggestion,
      suggestedSessions: suggestedSessions ? parseInt(suggestedSessions) : null,
      notes,
      approvedAt: new Date().toLocaleString('zh-CN'),
    };
    if (approvalAction === '通过') {
      approveReassessment(reassessment.id, approval);
    } else {
      rejectReassessment(reassessment.id, approval);
    }
    setExpandedId(null);
    setSuggestion('');
    setSuggestedSessions('');
    setNotes('');
    setApprovalAction('通过');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">审批工作台</h2>
        <p className="text-sm text-slate-500 mt-0.5">待审批复评记录 · {pendingReassessments.length} 条</p>
      </div>

      {pendingReassessments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">暂无待审批记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingReassessments.map((reassessment) => {
            const patient = patients.find(p => p.id === reassessment.patientId)!;
            const course = courses.find(c => c.id === reassessment.courseId)!;
            const isExpanded = expandedId === reassessment.id;

            return (
              <div key={reassessment.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all">
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : reassessment.id);
                    if (!isExpanded) {
                      setApprovalAction('通过');
                      setSuggestion('');
                      setSuggestedSessions('');
                      setNotes('');
                    }
                  }}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold shrink-0">
                      {patient.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">{patient.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${conclusionColors[reassessment.conclusion]}`}>
                          {reassessment.conclusion}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{patient.diagnosis} · 治疗师: {reassessment.therapistName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{reassessment.submittedAt}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 space-y-4">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">训练进度</p>
                        <p className="text-lg font-bold font-mono text-slate-800">{course.completedSessions}/{course.totalSessions}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">功能评分</p>
                        <p className="text-lg font-bold font-mono text-slate-800">{reassessment.functionalScore}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">疼痛VAS</p>
                        <p className="text-lg font-bold font-mono text-slate-800">{reassessment.painVAS}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">未完成项</p>
                        <p className="text-lg font-bold font-mono text-slate-800">{course.unfinishedItems.length}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 mb-1">复评结论依据</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{reassessment.conclusionReason}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 mb-1">主观评价</p>
                      <p className="text-sm text-slate-600">{reassessment.subjectiveEvaluation}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <p className="text-sm font-medium text-slate-700">审批操作</p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setApprovalAction('通过')}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                            approvalAction === '通过'
                              ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                              : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" /> 通过
                        </button>
                        <button
                          onClick={() => setApprovalAction('退回')}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                            approvalAction === '退回'
                              ? 'bg-red-100 text-red-700 border-2 border-red-300'
                              : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100'
                          }`}
                        >
                          <XCircle className="w-4 h-4" /> 退回
                        </button>
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">
                          {approvalAction === '通过' ? '续疗建议' : '退回原因'}
                        </label>
                        <textarea
                          value={suggestion}
                          onChange={(e) => setSuggestion(e.target.value)}
                          rows={3}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-colors"
                          placeholder={approvalAction === '通过' ? '请填写续疗建议...' : '请填写退回原因...'}
                        />
                      </div>

                      {approvalAction === '通过' && (
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">建议疗程数</label>
                          <input
                            type="number"
                            value={suggestedSessions}
                            onChange={(e) => setSuggestedSessions(e.target.value)}
                            className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-colors font-mono"
                            placeholder="次"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">备注</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-colors"
                          placeholder="备注信息..."
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setExpandedId(null)}
                          className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleApprove(reassessment)}
                          className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm ${
                            approvalAction === '通过'
                              ? 'bg-teal-600 text-white hover:bg-teal-700'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          }`}
                        >
                          确认{approvalAction}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-700">已审批记录</h3>
        </div>
        {reassessments.filter(r => r.status === '已审批').length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">暂无已审批记录</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reassessments.filter(r => r.status === '已审批').map((reassessment) => {
              const patient = patients.find(p => p.id === reassessment.patientId)!;
              return (
                <div key={reassessment.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">
                      {patient.avatar}
                    </div>
                    <div>
                      <p className="text-sm text-slate-700">{patient.name}</p>
                      <p className="text-xs text-slate-400">{reassessment.therapistName} · {reassessment.submittedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${conclusionColors[reassessment.conclusion]}`}>
                      {reassessment.conclusion}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">已审批</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
