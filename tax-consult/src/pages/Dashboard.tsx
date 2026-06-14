import { useMemo } from 'react';
import { useConsultationStore } from '../stores/consultationStore';
import { useDocumentStore } from '../stores/documentStore';
import { useStaffStore } from '../stores/staffStore';
import type { ConsultationStatus } from '../types';
import {
  CONSULTATION_STATUS_LABELS,
  CONSULTATION_STATUS_COLORS,
  ROLE_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_COLORS,
  MAIN_FLOW_STATUSES,
} from '../types';
import StatusBadge from '../components/StatusBadge';
import { ClipboardList, FileText, AlertTriangle, Clock, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/format';

export default function Dashboard() {
  const records = useConsultationStore((s) => s.records);
  const docItems = useDocumentStore((s) => s.items);
  const staffList = useStaffStore((s) => s.staff);
  const getById = useStaffStore((s) => s.getById);

  const staffName = (id: string) => getById(id)?.name ?? '-';

  const stats = useMemo(() => {
    const total = records.length;
    const processing = records.filter((r) => r.status === 'processing').length;
    const returned = records.filter((r) => r.status === 'returned').length;
    const allDocs = docItems.length;
    const confirmedDocs = docItems.filter((d) => d.status === 'confirmed').length;
    const completionRate = allDocs === 0 ? 0 : Math.round((confirmedDocs / allDocs) * 100);
    return { total, processing, returned, completionRate };
  }, [records, docItems]);

  const statusDistribution = useMemo(() => {
    const counts: Partial<Record<ConsultationStatus, number>> = {};
    for (const s of MAIN_FLOW_STATUSES) {
      counts[s] = records.filter((r) => r.status === s).length;
    }
    return counts;
  }, [records]);

  const bottleneckRecords = useMemo(() => {
    return records
      .filter((r) => r.status === 'returned' || r.status === 'supplementary')
      .map((r) => {
        const lastChange = r.status_history[r.status_history.length - 1];
        const stuckMs = Date.now() - new Date(lastChange.changed_at).getTime();
        const stuckDays = Math.floor(stuckMs / (1000 * 60 * 60 * 24));
        return { ...r, stuckDays };
      })
      .sort((a, b) => b.stuckDays - a.stuckDays);
  }, [records]);

  const incompleteDocs = useMemo(() => {
    return docItems
      .filter((d) => d.status === 'not_submitted' || d.status === 'returned')
      .map((d) => {
        const consultation = records.find((r) => r.id === d.consultation_id);
        return { ...d, consultation };
      });
  }, [docItems, records]);

  const staffWorkload = useMemo(() => {
    return staffList.map((s) => {
      const involved = records.filter(
        (r) =>
          r.consultant_id === s.id ||
          r.project_manager_id === s.id ||
          r.client_finance_id === s.id
      );
      const byStatus: Partial<Record<ConsultationStatus, number>> = {};
      for (const r of involved) {
        byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      }
      return { staff: s, total: involved.length, byStatus };
    });
  }, [staffList, records]);

  const totalDist = MAIN_FLOW_STATUSES.reduce(
    (sum, s) => sum + (statusDistribution[s] ?? 0),
    0
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">工作台</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<ClipboardList className="w-5 h-5 text-blue-600" />}
          label="咨询总量"
          value={stats.total}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-yellow-600" />}
          label="处理中"
          value={stats.processing}
          bg="bg-yellow-50"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          label="已退回"
          value={stats.returned}
          bg="bg-red-50"
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-green-600" />}
          label="资料完成率"
          value={`${stats.completionRate}%`}
          bg="bg-green-50"
        />
      </div>

      <section className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">状态分布</h2>
        <div className="flex h-6 rounded-full overflow-hidden bg-gray-100">
          {MAIN_FLOW_STATUSES.map((s) => {
            const count = statusDistribution[s] ?? 0;
            if (count === 0) return null;
            const pct = totalDist === 0 ? 0 : (count / totalDist) * 100;
            const colorClass = CONSULTATION_STATUS_COLORS[s];
            const bgColor = colorClass.split(' ')[0];
            return (
              <div
                key={s}
                className={`${bgColor} flex items-center justify-center text-xs font-medium transition-all`}
                style={{ width: `${pct}%` }}
                title={`${CONSULTATION_STATUS_LABELS[s]}: ${count}`}
              >
                {pct > 8 ? `${count}` : ''}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {MAIN_FLOW_STATUSES.map((s) => (
            <div key={s} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className={`w-2.5 h-2.5 rounded-full ${CONSULTATION_STATUS_COLORS[s].split(' ')[0]}`} />
              {CONSULTATION_STATUS_LABELS[s]} ({statusDistribution[s] ?? 0})
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            咨询卡点分析
          </h2>
          <Link
            to="/consultations"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
          >
            查看全部 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {bottleneckRecords.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">暂无卡点咨询</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="text-left py-2 pr-3 font-medium">案号</th>
                  <th className="text-left py-2 pr-3 font-medium">客户</th>
                  <th className="text-left py-2 pr-3 font-medium">当前状态</th>
                  <th className="text-left py-2 pr-3 font-medium">税务顾问</th>
                  <th className="text-left py-2 pr-3 font-medium">项目经理</th>
                  <th className="text-left py-2 pr-3 font-medium">客户财务</th>
                  <th className="text-left py-2 font-medium">滞留天数</th>
                </tr>
              </thead>
              <tbody>
                {bottleneckRecords.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-3">
                      <Link
                        to={`/consultations/${r.id}`}
                        className="text-blue-600 hover:underline font-mono"
                      >
                        {r.case_number}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-gray-800">{r.client_name}</td>
                    <td className="py-2 pr-3">
                      <StatusBadge
                        status={r.status}
                        labels={CONSULTATION_STATUS_LABELS}
                        colors={CONSULTATION_STATUS_COLORS}
                      />
                    </td>
                    <td className="py-2 pr-3 text-gray-700">{staffName(r.consultant_id)}</td>
                    <td className="py-2 pr-3 text-gray-700">{staffName(r.project_manager_id)}</td>
                    <td className="py-2 pr-3 text-gray-700">{staffName(r.client_finance_id)}</td>
                    <td className="py-2">
                      <span
                        className={`font-medium ${
                          r.stuckDays >= 2 ? 'text-red-600' : 'text-yellow-600'
                        }`}
                      >
                        {r.stuckDays}天
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-orange-500" />
            资料未完成清单
          </h2>
          <Link
            to="/documents"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
          >
            查看全部 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {incompleteDocs.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">所有资料已完成</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="text-left py-2 pr-3 font-medium">关联案号</th>
                  <th className="text-left py-2 pr-3 font-medium">资料名称</th>
                  <th className="text-left py-2 pr-3 font-medium">状态</th>
                  <th className="text-left py-2 pr-3 font-medium">责任人</th>
                  <th className="text-left py-2 font-medium">截止日期</th>
                </tr>
              </thead>
              <tbody>
                {incompleteDocs.map((d) => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-3">
                      {d.consultation ? (
                        <Link
                          to={`/consultations/${d.consultation.id}`}
                          className="text-blue-600 hover:underline font-mono"
                        >
                          {d.consultation.case_number}
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-gray-800">{d.document_name}</td>
                    <td className="py-2 pr-3">
                      <StatusBadge
                        status={d.status}
                        labels={DOCUMENT_STATUS_LABELS}
                        colors={DOCUMENT_STATUS_COLORS}
                      />
                    </td>
                    <td className="py-2 pr-3 text-gray-700">
                      {ROLE_LABELS[d.responsible_role]}/{staffName(d.responsible_id)}
                    </td>
                    <td className="py-2">
                      <span
                        className={
                          new Date(d.due_date) < new Date()
                            ? 'text-red-600 font-medium'
                            : 'text-gray-600'
                        }
                      >
                        {formatDate(d.due_date)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
          <Users className="w-4 h-4 text-indigo-500" />
          人员处理概览
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="text-left py-2 pr-3 font-medium">姓名</th>
                <th className="text-left py-2 pr-3 font-medium">角色</th>
                <th className="text-left py-2 pr-3 font-medium">关联咨询</th>
                {MAIN_FLOW_STATUSES.map((s) => (
                  <th key={s} className="text-left py-2 pr-3 font-medium">
                    {CONSULTATION_STATUS_LABELS[s]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffWorkload.map(({ staff: s, total, byStatus }) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 pr-3 text-gray-800 font-medium">{s.name}</td>
                  <td className="py-2 pr-3 text-gray-600">{ROLE_LABELS[s.role]}</td>
                  <td className="py-2 pr-3 text-gray-700">{total}</td>
                  {MAIN_FLOW_STATUSES.map((st) => (
                    <td key={st} className="py-2 pr-3">
                      {(byStatus[st] ?? 0) > 0 ? (
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-medium ${CONSULTATION_STATUS_COLORS[st]}`}
                        >
                          {byStatus[st]}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-lg border border-gray-200 p-4 flex items-center gap-3`}>
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-lg font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}
