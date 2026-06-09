import { useParams, Link } from 'react-router-dom';
import { Activity, TrendingDown, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import PainChart from '@/components/PainChart';

const conclusionConfig: Record<string, { bg: string; text: string; border: string }> = {
  '结案': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  '续疗': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  '转诊': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  '换方案': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export default function ReassessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { patients, courses, reassessments, approvals, submitReassessment } = useStore();

  const reassessment = reassessments.find(r => r.id === id);
  if (!reassessment) return <div className="text-center py-12 text-slate-400">未找到复评记录</div>;

  const patient = patients.find(p => p.id === reassessment.patientId)!;
  const course = courses.find(c => c.id === reassessment.courseId)!;
  const approval = approvals.find(a => a.reassessmentId === reassessment.id);
  const config = conclusionConfig[reassessment.conclusion] || conclusionConfig['结案'];
  const completionRate = Math.round((course.completedSessions / course.totalSessions) * 100);

  const handleSubmit = () => {
    submitReassessment(reassessment.id);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">复评记录详情</h2>
          <p className="text-sm text-slate-500 mt-0.5">{patient.name} · {patient.diagnosis}</p>
        </div>
        <Link to="/" className="text-sm text-slate-500 hover:text-teal-600 transition-colors">
          返回总览
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-medium text-slate-500">训练次数</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono text-teal-700">{course.completedSessions}</span>
            <span className="text-sm text-slate-400">/ {course.totalSessions}次</span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>完成率</span>
              <span className="font-mono">{completionRate}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-medium text-slate-500">疼痛变化</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-amber-600">{course.painScoreAdmission}</span>
            <span className="text-slate-400 text-sm">→</span>
            <span className="text-xl font-bold font-mono text-teal-600">{course.painScoreCurrent}</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">VAS评分 (0-10)</div>
          <div className="mt-2">
            <PainChart data={course.painHistory} width={240} height={64} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-slate-500">未完成项目</span>
          </div>
          {course.unfinishedItems.length > 0 ? (
            <ul className="space-y-1.5">
              {course.unfinishedItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              全部完成
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-700">复评数据</h3>
        </div>
        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-5">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">功能评分</label>
            <div className="text-lg font-bold font-mono text-slate-800">{reassessment.functionalScore}<span className="text-sm font-normal text-slate-400 ml-1">分</span></div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">疼痛VAS评分</label>
            <div className="text-lg font-bold font-mono text-slate-800">{reassessment.painVAS}<span className="text-sm font-normal text-slate-400 ml-1">分</span></div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">关节活动度 (ROM)</label>
            <p className="text-sm text-slate-700">{reassessment.romMeasurement}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">主观评价</label>
            <p className="text-sm text-slate-700">{reassessment.subjectiveEvaluation}</p>
          </div>
        </div>
      </div>

      <div className={`${config.bg} border ${config.border} rounded-xl p-5`}>
        <div className="flex items-center gap-3 mb-3">
          <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${config.text} bg-white/60`}>
            {reassessment.conclusion}
          </span>
          <span className="text-xs text-slate-400">复评结论</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{reassessment.conclusionReason}</p>
      </div>

      {approval && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">主任审批意见</h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${approval.action === '通过' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {approval.action}
              </span>
              <span className="text-xs text-slate-400">{approval.approvedAt}</span>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">续疗建议</label>
              <p className="text-sm text-slate-700 leading-relaxed">{approval.suggestion}</p>
            </div>
            {approval.suggestedSessions && (
              <div>
                <label className="text-xs text-slate-500 mb-1 block">建议疗程数</label>
                <span className="text-lg font-bold font-mono text-teal-700">{approval.suggestedSessions}<span className="text-sm font-normal text-slate-400 ml-1">次</span></span>
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">备注</label>
              <p className="text-sm text-slate-600">{approval.notes}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        {(reassessment.status === '草稿' || reassessment.status === '已退回') && (
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
          >
            提交复评
          </button>
        )}
        {reassessment.status === '已审批' && reassessment.conclusion === '结案' && (
          <Link
            to={`/followup/${reassessment.id}`}
            className="px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-sm inline-flex items-center gap-2"
          >
            查看结案详情 <ArrowRight className="w-4 h-4" />
          </Link>
        )}
        {reassessment.status === '已审批' && reassessment.conclusion !== '结案' && (
          <Link
            to={`/followup/${reassessment.id}`}
            className="px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-sm inline-flex items-center gap-2"
          >
            查看续疗计划 <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
