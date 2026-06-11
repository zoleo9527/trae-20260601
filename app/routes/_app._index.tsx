import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { useMemo } from "react";
import { db } from "~/data/store.server";
import type { MaintenanceContract, RenewalStatus } from "~/types";
import {
  RENEWAL_STATUS, INSPECTION_RATINGS, daysUntil, formatMoney, formatDate } from "~/types";

const FILTER_STATUS: (RenewalStatus | "all")[] = [
  "all",
  "expiring_soon",
  "hesitating",
  "open_risks",
  "renewed",
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") as RenewalStatus | "all" | null;
  const contracts = db.all();
  return json({ contracts, status: status ?? "all" });
}

function getLeftBarColor(days: number): string {
  if (days < 30) return "bg-brand-500";
  if (days < 60) return "bg-amber-500";
  return "bg-moss-500";
}

function renderStars(score: number) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-sm ${i < score ? "text-amber-400" : "text-slate-200"}`}>★</span>
      ))}
    </div>
  );
}

function countOpenRisks(c: MaintenanceContract): number {
  return c.hiddenDangers.filter((d) => d.status !== "closed").length;
}

function formatArea(n: number): string {
  return n.toLocaleString("zh-CN") + " ㎡";
}

function trimNote(s: string, max = 60): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + "…";
}

function StatCard({
  label, value, color, icon, count }: {
    label: string;
    value: number;
    color: string;
    icon: string;
    count?: number;
  }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-bold text-slate-800 font-serif">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${color}`}>
          {icon}
        </div>
      </div>
      {typeof count === "number" && count > 0 && (
        <div className="mt-3 text-xs text-slate-500">
          占比 {(((value / count) * 100).toFixed(0))}%
        </div>
      )}
    </div>
  );
}

function ContractCard({ contract }: { contract: MaintenanceContract }) {
  const { contract: c, renewal, latestInspection, followUps } = contract;
  const days = daysUntil(c.endDate);
  const openRisks = countOpenRisks(contract);
  const latestNote = followUps.length > 0 ? followUps[followUps.length - 1] : null;
  const statusCfg = RENEWAL_STATUS[renewal.status];
  const ratingScore = latestInspection ? INSPECTION_RATINGS[latestInspection.rating].score : 0;

  return (
    <Link
      to={`/evidence/${c.id}`}
      className="block group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
    >
      <div className="flex min-h-full">
        <div className={`w-1.5 shrink-0 ${getLeftBarColor(days)}`} />
        <div className="flex-1 p-5 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-800 font-serif truncate group-hover:text-brand-600 transition-colors">
                  {c.projectName}
                </h3>
                {openRisks > 0 && (
                    <span className="inline-flex items-center justify-center shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full bg-brand-500 text-white text-xs font-bold">
                      {openRisks}
                    </span>
                  )}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                <span>合同 {c.contractNo}</span>
                <span>·</span>
                <span>{c.buildingType} · {formatArea(c.buildingArea)}</span>
              </div>
            </div>
            <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
              <span>{statusCfg.icon}</span>
              <span>{statusCfg.label}</span>
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="text-slate-400">👤</span>
              <span className="truncate">{c.propertyContact}</span>
              <span className="text-slate-400 text-xs">{c.propertyPhone}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="text-slate-400">💰</span>
              <span className="font-medium text-slate-700">{formatMoney(c.contractAmount)}</span>
              <span className="text-slate-400 text-xs">/ {c.serviceFrequency}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="text-slate-400">📅</span>
                <span>到期 {formatDate(c.endDate)}</span>
                <span className={`font-semibold ${days < 30 ? "text-rose-600" : "text-slate-700"}`}>
                  （剩 {days} 天）
                </span>
              </div>
              {ratingScore > 0 && (
                <div className="flex items-center gap-1.5">
                  {renderStars(ratingScore)}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
            <div className="text-xs text-amber-700 font-medium">
              📞 下一次联系：{formatDate(renewal.nextContactAt)}
            </div>
          </div>

          {latestNote && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 mb-1">
                <span className="font-medium text-slate-600">{latestNote.author}</span>
                <span className="mx-1">·</span>
                <span>{latestNote.createdAt}</span>
                {latestNote.isInternal && (
                  <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">
                    内部
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 line-clamp-2">
                {trimNote(latestNote.content)}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Index() {
  const { contracts, status } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const stats = useMemo(() => {
    const total = contracts.length;
    const expiringSoon = contracts.filter((c) => c.renewal.status === "expiring_soon").length;
    const hesitating = contracts.filter((c) => c.renewal.status === "hesitating").length;
    const openRisks = contracts.filter((c) => c.renewal.status === "open_risks").length;
    const renewed = contracts.filter((c) => c.renewal.status === "renewed").length;
    return { total, expiringSoon, hesitating, openRisks, renewed };
  }, [contracts]);

  const filtered = useMemo(() => {
    if (status === "all") return contracts;
    return contracts.filter((c) => c.renewal.status === status);
  }, [contracts, status]);

  function handleFilterClick(s: RenewalStatus | "all") {
    const next = new URLSearchParams(searchParams);
    if (s === "all") {
      next.delete("status");
    } else {
      next.set("status", s);
    }
    setSearchParams(next, { preventScrollReset: true });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          label="合同总数"
          value={stats.total}
        color="bg-slate-100 text-slate-600"
          icon="📋"
        />
        <StatCard
          label="即将到期"
          value={stats.expiringSoon}
          color="bg-amber-50 text-amber-600"
          icon="⏰"
          count={stats.total}
        />
        <StatCard
          label="客户犹豫"
          value={stats.hesitating}
          color="bg-rose-50 text-rose-600"
          icon="🤔"
          count={stats.total}
        />
        <StatCard
          label="未闭环隐患"
          value={stats.openRisks}
          color="bg-brand-50 text-brand-600"
          icon="⚠️"
          count={stats.total}
        />
        <StatCard
          label="已续约"
          value={stats.renewed}
          color="bg-moss-50 text-moss-600"
          icon="✅"
          count={stats.total}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-2 inline-flex gap-1 shadow-sm">
        {FILTER_STATUS.map((s) => {
          const active = s === status;
          const cfg = s === "all" ? null : RENEWAL_STATUS[s as RenewalStatus];
          const label = s === "all" ? "全部" : cfg?.label;
          return (
            <button
              key={s}
              onClick={() => handleFilterClick(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-1.5 ${
                active
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cfg && <span>{cfg.icon}</span>}
              <span>{label}</span>
              <span className={`text-xs ml-1 ${active ? "text-white/70" : "text-slate-400"}`}>
                {s === "all"
                  ? `(${stats.total})`
                  : `(${
                    s === "expiring_soon" ? stats.expiringSoon :
                    s === "hesitating" ? stats.hesitating :
                    s === "open_risks" ? stats.openRisks :
                    stats.renewed
                  })`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length > 0 ? (
          filtered.map((c) => <ContractCard key={c.contract.id} contract={c} />)
        ) : (
          <div className="col-span-full py-20 text-center text-slate-400">
            暂无符合条件的合同
          </div>
        )}
      </div>
    </div>
  );
}
