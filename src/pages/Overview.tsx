import { Link } from 'react-router-dom';
import { FileText, Clock, MessageCircle, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/store/useStore';

const statusCards = [
  { key: '待复评', icon: FileText, color: 'bg-amber-50 border-amber-200', iconColor: 'text-amber-600', numColor: 'text-amber-700' },
  { key: '待审批', icon: Clock, color: 'bg-sky-50 border-sky-200', iconColor: 'text-sky-600', numColor: 'text-sky-700' },
  { key: '待沟通', icon: MessageCircle, color: 'bg-violet-50 border-violet-200', iconColor: 'text-violet-600', numColor: 'text-violet-700' },
  { key: '已结案', icon: CheckCircle2, color: 'bg-emerald-50 border-emerald-200', iconColor: 'text-emerald-600', numColor: 'text-emerald-700' },
] as const;

const conclusionColors: Record<string, string> = {
  '结案': 'bg-emerald-100 text-emerald-700',
  '续疗': 'bg-blue-100 text-blue-700',
  '转诊': 'bg-purple-100 text-purple-700',
  '换方案': 'bg-amber-100 text-amber-700',
};

const statusColors: Record<string, string> = {
  '草稿': 'bg-slate-100 text-slate-600',
  '已提交': 'bg-sky-100 text-sky-700',
  '已审批': 'bg-teal-100 text-teal-700',
  '已退回': 'bg-red-100 text-red-700',
};

export default function Overview() {
  const { patients, courses, reassessments, followupPlans } = useStore();

  const getStatusCounts = () => {
    const counts = { '待复评': 0, '待审批': 0, '待沟通': 0, '已结案': 0 };
    reassessments.forEach((r) => {
      if (r.status === '草稿' || r.status === '已退回') counts['待复评']++;
      else if (r.status === '已提交') counts['待审批']++;
      else if (r.status === '已审批') {
        if (r.conclusion === '结案') counts['已结案']++;
        else counts['待沟通']++;
      }
    });
    return counts;
  };

  const counts = getStatusCounts();

  const getProgressColor = (pct: number) => {
    if (pct > 90) return 'bg-emerald-500';
    if (pct > 70) return 'bg-teal-500';
    return 'bg-amber-500';
  };

  const getAction = (reassessment: typeof reassessments[0]) => {
    if (reassessment.status === '已审批' && reassessment.conclusion === '结案') {
      const plan = followupPlans.find(f => f.reassessmentId === reassessment.id);
      return plan ? (
        <Link to={`/followup/${reassessment.id}`} className="text-xs font-medium text-slate-500 hover:text-teal-600 transition-colors px-2 py-1 rounded hover:bg-teal-50">
          已结案
        </Link>
      ) : <span className="text-xs text-slate-400 px-2 py-1">已结案</span>;
    }
    if (reassessment.status === '已审批') {
      return (
        <Link to={`/followup/${reassessment.id}`} className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors px-2.5 py-1 rounded-md hover:bg-teal-50 border border-teal-200">
          跟进
        </Link>
      );
    }
    if (reassessment.status === '已提交') {
      return <span className="text-xs text-slate-400 px-2 py-1">待审批</span>;
    }
    return (
      <Link to={`/reassessment/${reassessment.id}`} className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors px-2.5 py-1 rounded-md hover:bg-teal-50 border border-teal-200">
        填写复评
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">复评总览</h2>
        <p className="text-sm text-slate-500 mt-0.5">疗程复评与续疗判断工作台</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statusCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className={`${card.color} border rounded-xl p-4 transition-shadow hover:shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">{card.key}</p>
                  <p className={`text-2xl font-bold font-mono ${card.numColor}`}>{counts[card.key as keyof typeof counts]}</p>
                </div>
                <Icon className={`w-8 h-8 ${card.iconColor} opacity-60`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">患者列表</h3>
          <span className="text-xs text-slate-400">共 {patients.length} 位患者</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5">患者信息</th>
              <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5">诊断</th>
              <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5">疗程进度</th>
              <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5">疼痛变化</th>
              <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5">复评结论</th>
              <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5">状态</th>
              <th className="text-right text-xs font-medium text-slate-500 px-5 py-2.5">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((patient) => {
              const course = courses.find(c => c.patientId === patient.id)!;
              const reassessment = reassessments.find(r => r.patientId === patient.id)!;
              const pct = Math.round((course.completedSessions / course.totalSessions) * 100);
              return (
                <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {patient.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{patient.name}</p>
                        <p className="text-xs text-slate-400">{patient.gender} · {patient.age}岁</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{patient.diagnosis}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getProgressColor(pct)} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono text-slate-600">{course.completedSessions}/{course.totalSessions}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-mono">
                      <span className="text-amber-600">{course.painScoreAdmission}</span>
                      <span className="text-slate-400 mx-1">→</span>
                      <span className="text-teal-600">{course.painScoreCurrent}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${conclusionColors[reassessment.conclusion] || 'bg-slate-100 text-slate-600'}`}>
                      {reassessment.conclusion}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[reassessment.status] || 'bg-slate-100 text-slate-600'}`}>
                      {reassessment.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">{getAction(reassessment)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
