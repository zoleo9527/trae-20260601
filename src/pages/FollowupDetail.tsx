import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, CreditCard, MessageSquare, Plus, ArrowRight, Phone } from 'lucide-react';
import { useStore, getLatestApproval } from '@/store/useStore';
import type { CommunicationResult } from '@/types';

const resultConfig: Record<CommunicationResult, { bg: string; text: string; icon: typeof Phone }> = {
  '已同意': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Phone },
  '已暂停': { bg: 'bg-amber-100', text: 'text-amber-700', icon: Phone },
  '已拒绝': { bg: 'bg-red-100', text: 'text-red-700', icon: Phone },
  '待沟通': { bg: 'bg-slate-100', text: 'text-slate-600', icon: Phone },
};

const conclusionColors: Record<string, string> = {
  '结案': 'bg-emerald-100 text-emerald-700',
  '续疗': 'bg-blue-100 text-blue-700',
  '转诊': 'bg-purple-100 text-purple-700',
  '换方案': 'bg-amber-100 text-amber-700',
};

export default function FollowupDetail() {
  const { id } = useParams<{ id: string }>();
  const { patients, reassessments, approvals, followupPlans, addCommunication } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [communicator, setCommunicator] = useState('');
  const [result, setResult] = useState<CommunicationResult>('已同意');
  const [reason, setReason] = useState('');

  const reassessment = reassessments.find(r => r.id === id);
  if (!reassessment) return <div className="text-center py-12 text-slate-400">未找到复评记录</div>;

  const patient = patients.find(p => p.id === reassessment.patientId)!;
  const approval = getLatestApproval(approvals, reassessment.id);
  const plan = followupPlans.find(f => f.reassessmentId === reassessment.id);

  const handleAddCommunication = () => {
    if (!plan || !communicator || !reason) return;
    addCommunication(plan.id, { communicator, result, reason });
    setCommunicator('');
    setResult('已同意');
    setReason('');
    setShowForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">续疗计划与沟通</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-slate-500">{patient.name} · {patient.diagnosis}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${conclusionColors[reassessment.conclusion] || 'bg-slate-100 text-slate-600'}`}>
              {reassessment.conclusion}
            </span>
          </div>
        </div>
        <Link to="/" className="text-sm text-slate-500 hover:text-teal-600 transition-colors">
          返回总览
        </Link>
      </div>

      {plan && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-semibold text-slate-700">续疗方案</h3>
              <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700">{plan.planType}</span>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-700 leading-relaxed">{plan.planDetails}</p>
              {approval && approval.suggestedSessions && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-slate-500">建议疗程：</span>
                  <span className="text-sm font-bold font-mono text-teal-700">{approval.suggestedSessions}次</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-slate-700">费用信息</h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">总费用</span>
                  <span className="text-xl font-bold font-mono text-slate-800">
                    {plan.totalFee > 0 ? `¥${plan.totalFee.toLocaleString()}` : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">缴费状态</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    plan.paymentStatus === '无需缴费' ? 'bg-slate-100 text-slate-600' :
                    plan.paymentStatus === '已缴费' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {plan.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-slate-700">排期安排</h3>
              </div>
              <div className="p-5 max-h-52 overflow-y-auto">
                {plan.scheduleItems.length > 0 ? (
                  <div className="space-y-2">
                    {plan.scheduleItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                        <span className="font-mono text-slate-600 shrink-0">{item.date}</span>
                        <span className="text-slate-500">{item.session}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">无需排期</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-slate-700">沟通记录</h3>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                添加记录
              </button>
            </div>

            <div className="p-5">
              {showForm && (
                <div className="mb-5 bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">沟通人</label>
                      <input
                        type="text"
                        value={communicator}
                        onChange={(e) => setCommunicator(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-colors"
                        placeholder="如：前台-张小燕"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">沟通结果</label>
                      <select
                        value={result}
                        onChange={(e) => setResult(e.target.value as CommunicationResult)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-colors"
                      >
                        <option value="已同意">已同意</option>
                        <option value="已暂停">已暂停</option>
                        <option value="已拒绝">已拒绝</option>
                        <option value="待沟通">待沟通</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">沟通内容/原因</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-colors"
                      placeholder="请填写沟通内容..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">取消</button>
                    <button
                      onClick={handleAddCommunication}
                      disabled={!communicator || !reason}
                      className="px-4 py-1.5 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      确认添加
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-0">
                {plan.communicationRecords.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">暂无沟通记录</p>
                ) : (
                  plan.communicationRecords.map((record, i) => {
                    const config = resultConfig[record.result];
                    const Icon = config.icon;
                    const isLast = i === plan.communicationRecords.length - 1;
                    return (
                      <div key={record.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full ${config.bg} ${config.text} flex items-center justify-center shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {!isLast && <div className="w-px flex-1 bg-slate-200 my-1" />}
                        </div>
                        <div className={`pb-5 ${isLast ? '' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
                              {record.result}
                            </span>
                            <span className="text-xs text-slate-400">{record.communicatedAt}</span>
                          </div>
                          <p className="text-sm text-slate-600">{record.reason}</p>
                          <p className="text-xs text-slate-400 mt-0.5">沟通人：{record.communicator}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
