import type { MetaFunction, LoaderFunction } from "@remix-run/node";
import { json, Link, useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import { db } from "~/data/store.server";
import { useRoleStore } from "~/store/roleStore";
import type { MaintenanceContract, Role } from "~/types";
import {
  RENEWAL_STATUS,
  RISK_LEVELS,
  INSPECTION_RATINGS,
  daysUntil,
  formatMoney,
  formatDate,
} from "~/types";
import { getRoleFromRequest, sanitizeContractsForRole } from "~/utils/role.server";

export const meta: MetaFunction = () => {
  return [
    { title: "续约分析 · 消防维保到期提醒" },
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
  const currentRole = getRoleFromRequest(request);
  const rawContracts = db.all();
  const contracts = sanitizeContractsForRole(rawContracts, currentRole);
  return json({ contracts, currentRole });
};

type S = keyof typeof RENEWAL_STATUS;

export default function AnalysisPage() {
  const { contracts, currentRole: serverRole } = useLoaderData<typeof loader>() as {
    contracts: MaintenanceContract[];
    currentRole: Role;
  };
  const { currentRole, setCurrentRole } = useRoleStore();

  useEffect(() => {
    if (serverRole && serverRole !== currentRole) {
      setCurrentRole(serverRole as Role);
    }
  }, [serverRole, currentRole, setCurrentRole]);

  const total = contracts.length;
  const byStatus = contracts.reduce<Record<string, MaintenanceContract[]>>((acc, c) => {
    const s = c.renewal.status;
    if (!acc[s]) acc[s] = [];
    acc[s].push(c);
    return acc;
  }, {});

  const totalRevenue = contracts.reduce((s, c) => s + c.contract.contractAmount, 0);
  const renewedRevenue = (byStatus.renewed || []).reduce(
    (s, c) => s + (c.renewal.renewalOffer ?? c.contract.contractAmount),
    0
  );
  const pipelineRevenue =
    (byStatus.expiring_soon || []).reduce((s, c) => s + (c.renewal.renewalOffer ?? c.contract.contractAmount), 0) +
    (byStatus.hesitating || []).reduce((s, c) => s + (c.renewal.renewalOffer ?? c.contract.contractAmount), 0) +
    (byStatus.open_risks || []).reduce((s, c) => s + (c.renewal.renewalOffer ?? c.contract.contractAmount), 0);

  const avgDays = Math.round(
    contracts.reduce((s, c) => s + daysUntil(c.contract.endDate), 0) / Math.max(total, 1)
  );

  const totalDangers = contracts.reduce((s, c) => s + c.hiddenDangers.filter((d) => d.status !== "closed").length, 0);
  const criticalDangers = contracts.reduce(
    (s, c) =>
      s + c.hiddenDangers.filter((d) => d.status !== "closed" && d.riskLevel === "critical").length,
    0
  );

  const expiringIn30 = contracts.filter((c) => daysUntil(c.contract.endDate) <= 30).length;
  const avgCustomerRating = (() => {
    const ratings = contracts
      .map((c) => c.latestInspection?.customerRating)
      .filter(Boolean) as (keyof typeof INSPECTION_RATINGS)[];
    if (ratings.length === 0) return 0;
    return (
      ratings.reduce((s, r) => s + INSPECTION_RATINGS[r].score, 0) / ratings.length
    ).toFixed(1);
  })();

  const statusOrder: S[] = ["expiring_soon", "hesitating", "open_risks", "renewed", "new"];
  const maxCount = Math.max(...statusOrder.map((s) => (byStatus[s] || []).length), 1);

  const buildingTypeMap = contracts.reduce<Record<string, number>>((acc, c) => {
    acc[c.contract.buildingType] = (acc[c.contract.buildingType] || 0) + 1;
    return acc;
  }, {});
  const buildingTypes = Object.entries(buildingTypeMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* 总览指标 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-xs text-slate-500 mb-1">合同总数</div>
          <div className="text-3xl font-bold text-slate-800 font-serif">{total}</div>
          <div className="text-xs text-slate-400 mt-1">总金额 {formatMoney(totalRevenue)}</div>
        </div>
        <div className="card p-5 border-l-4 border-l-moss-400">
          <div className="text-xs text-moss-600 mb-1">✅ 已续约金额</div>
          <div className="text-3xl font-bold text-moss-600 font-serif">
            {formatMoney(renewedRevenue)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            占总金额 {((renewedRevenue / totalRevenue) * 100).toFixed(0)}%
          </div>
        </div>
        <div className="card p-5 border-l-4 border-l-amber-400">
          <div className="text-xs text-amber-600 mb-1">📦 续约漏斗金额</div>
          <div className="text-3xl font-bold text-amber-600 font-serif">
            {formatMoney(pipelineRevenue)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            漏斗转已续约 {((renewedRevenue / (renewedRevenue + pipelineRevenue || 1)) * 100).toFixed(0)}%
          </div>
        </div>
        <div className="card p-5 border-l-4 border-l-brand-400">
          <div className="text-xs text-brand-600 mb-1">⚠️ 未闭环隐患</div>
          <div className="text-3xl font-bold text-brand-600 font-serif">
            {totalDangers}
            <span className="text-base ml-1 text-rose-500">({criticalDangers} 严重)</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            平均距离到期 {avgDays} 天，30 天内到期 {expiringIn30} 份
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 续约状态分布 */}
        <div className="card p-6 col-span-2">
          <div className="section-title">
            <span>📊</span>
            <span>续约状态分布</span>
            <span className="ml-auto text-xs font-normal text-slate-400">
              平均客户评分 {avgCustomerRating || "-"} / 5 ⭐
            </span>
          </div>
          <div className="space-y-3 mt-5">
            {statusOrder.map((s) => {
              const list = byStatus[s] || [];
              const count = list.length;
              const cfg = RENEWAL_STATUS[s];
              const widthPct = (count / maxCount) * 100;
              const rev = list.reduce(
                (x, c) => x + (c.renewal.renewalOffer ?? c.contract.contractAmount),
                0
              );
              return (
                <div key={s}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className={`tag ${cfg.bg} ${cfg.color} ${cfg.border} !w-28 justify-center`}>
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </span>
                    <div className="flex-1 h-7 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                      <div
                        className={`h-full ${cfg.bg} flex items-center px-3 transition-all`}
                        style={{ width: `${Math.max(widthPct, count > 0 ? 8 : 0)}%` }}
                      >
                        <span className={`text-xs font-semibold ${cfg.color}`}>
                          {count} 份 · {formatMoney(rev)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 w-16 text-right">
                      {((count / total) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 建筑类型分布 */}
        <div className="card p-6">
          <div className="section-title">
            <span>🏗️</span>
            <span>业态分布</span>
          </div>
          <div className="space-y-3 mt-4">
            {buildingTypes.map(([type, count], idx) => {
              const colors = ["bg-brand-400", "bg-moss-400", "bg-amber-400", "bg-sky-400", "bg-rose-400"];
              const pct = ((count / total) * 100).toFixed(0);
              return (
                <div key={type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{type}</span>
                    <span className="text-slate-400">
                      {count} 份 · {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[idx % colors.length]} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 风险 & 质量看板 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 风险等级分布 */}
        <div className="card p-6">
          <div className="section-title">
            <span>🚨</span>
            <span>未闭环隐患 · 风险等级</span>
          </div>
          <div className="space-y-4 mt-4">
            {(["critical", "high", "medium", "low"] as const).map((lv) => {
              const count = contracts.reduce(
                (s, c) =>
                  s +
                  c.hiddenDangers.filter((d) => d.status !== "closed" && d.riskLevel === lv).length,
                0
              );
              const cfg = RISK_LEVELS[lv];
              return (
                <div key={lv} className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${cfg.bg} flex items-center justify-center font-bold ${cfg.color}`}
                  >
                    {count}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-slate-400">
                        {totalDangers > 0 ? ((count / totalDangers) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full ${cfg.bg} rounded-full`}
                        style={{
                          width: `${totalDangers > 0 ? (count / totalDangers) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 巡检质量 */}
        <div className="card p-6">
          <div className="section-title">
            <span>🔍</span>
            <span>最近巡检评级</span>
          </div>
          <div className="space-y-4 mt-4">
            {(["excellent", "good", "fair", "poor"] as const).map((r) => {
              const count = contracts.filter((c) => c.latestInspection?.rating === r).length;
              const cfg = INSPECTION_RATINGS[r];
              return (
                <div key={r} className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${cfg.bg} flex items-center justify-center font-bold ${cfg.color}`}
                  >
                    {count}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-amber-400 text-xs">
                          {"★".repeat(cfg.score)}
                          <span className="text-slate-200">{"★".repeat(5 - cfg.score)}</span>
                        </span>
                      </span>
                      <span className="text-xs text-slate-400">
                        {((count / total) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full ${cfg.bg} rounded-full`}
                        style={{ width: `${(count / total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 下次联系排期 */}
        <div className="card p-6">
          <div className="section-title">
            <span>📞</span>
            <span>近期跟进排期</span>
          </div>
          <div className="space-y-2.5 mt-4 max-h-[260px] overflow-y-auto pr-1">
            {[...contracts]
              .sort((a, b) => a.renewal.nextContactAt.localeCompare(b.renewal.nextContactAt))
              .slice(0, 8)
              .map((c) => {
                const days = daysUntil(c.renewal.nextContactAt);
                const cfg = RENEWAL_STATUS[c.renewal.status];
                return (
                  <Link
                    key={c.contract.id}
                    to={`/evidence/${c.contract.id}`}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition group"
                  >
                    <div
                      className={`w-12 shrink-0 rounded-lg p-1.5 text-center ${cfg.bg} border ${cfg.border}`}
                    >
                      <div className="text-[10px] text-slate-500">
                        {c.renewal.nextContactAt.slice(5, 7)}月
                      </div>
                      <div className={`text-sm font-bold ${cfg.color}`}>
                        {c.renewal.nextContactAt.slice(8)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate group-hover:text-brand-600">
                        {c.contract.projectName}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span className={`tag ${cfg.bg} ${cfg.color} ${cfg.border} !py-0 !px-1.5`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                        <span>
                          {days > 0
                            ? `${days} 天后`
                            : days === 0
                            ? "今天"
                            : `已逾期 ${-days} 天`}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>

      {/* 续约跟进明细表 */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="section-title !mb-0">
            <span>📋</span>
            <span>续约跟进明细</span>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-left px-6 py-3 font-medium">项目 / 合同号</th>
              <th className="text-left px-4 py-3 font-medium">状态</th>
              <th className="text-left px-4 py-3 font-medium">到期时间</th>
              <th className="text-left px-4 py-3 font-medium">合同金额</th>
              <th className="text-left px-4 py-3 font-medium">续约报价</th>
              <th className="text-left px-4 py-3 font-medium">未闭环隐患</th>
              <th className="text-left px-4 py-3 font-medium">客户评分</th>
              <th className="text-left px-4 py-3 font-medium">下次联系</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contracts.map((c) => {
              const cfg = RENEWAL_STATUS[c.renewal.status];
              const d = daysUntil(c.contract.endDate);
              const openDangers = c.hiddenDangers.filter((x) => x.status !== "closed").length;
              const cr = c.latestInspection?.customerRating;
              return (
                <tr key={c.contract.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{c.contract.projectName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{c.contract.contractNo}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`tag ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-slate-700">{formatDate(c.contract.endDate)}</div>
                    <div
                      className={`text-xs mt-0.5 ${
                        d < 0 ? "text-rose-500" : d <= 30 ? "text-brand-500" : "text-slate-400"
                      }`}
                    >
                      {d < 0 ? `已过期 ${-d} 天` : d === 0 ? "今天到期" : `剩 ${d} 天`}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {formatMoney(c.contract.contractAmount)}
                  </td>
                  <td className="px-4 py-4">
                    {c.renewal.renewalOffer ? (
                      <div>
                        <span className="text-slate-800 font-medium">
                          {formatMoney(c.renewal.renewalOffer)}
                        </span>
                        {c.renewal.discountApplied ? (
                          <span className="text-xs text-brand-500 ml-2">
                            -{c.renewal.discountApplied}%
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {openDangers > 0 ? (
                      <span className="tag bg-rose-50 text-rose-700 border-rose-200">
                        ⚠️ {openDangers} 项
                      </span>
                    ) : (
                      <span className="tag bg-moss-50 text-moss-700 border-moss-200">
                        ✓ 无
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {cr ? (
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400 text-sm">
                          {"★".repeat(INSPECTION_RATINGS[cr].score)}
                        </span>
                        <span className={`text-xs ${INSPECTION_RATINGS[cr].color}`}>
                          {INSPECTION_RATINGS[cr].label}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-slate-700">{formatDate(c.renewal.nextContactAt)}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{c.renewal.assignedTo}</div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      to={`/evidence/${c.contract.id}`}
                      className="text-brand-600 hover:text-brand-700 text-sm font-medium"
                    >
                      查看详情 →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
