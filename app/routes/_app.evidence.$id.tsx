import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import { useEffect } from "react";
import { db } from "~/data/store.server";
import { useRoleStore } from "~/store/roleStore";
import type { Role, DangerStatus, RenewalStatus } from "~/types";
import {
  RENEWAL_STATUS,
  RISK_LEVELS,
  INSPECTION_RATINGS,
  DANGER_STATUS,
  ROLE_COLORS,
  ROLE_ICONS,
  ROLE_LABELS,
  resolvePersonName,
  daysUntil,
  formatMoney,
  formatDate,
  filterFollowUpsByRole,
  canEditRenewal,
  canEditDanger,
  canMarkInternal,
} from "~/types";
import {
  getRoleFromRequest,
  sanitizeContractForRole,
  resolveServerPersonName,
} from "~/utils/role.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = params.id as string;
  const currentRole = getRoleFromRequest(request);
  const rawContract = db.getById(id);
  if (!rawContract) {
    throw new Response("Not Found", { status: 404 });
  }
  const contract = sanitizeContractForRole(rawContract, currentRole);
  return json({ contract, currentRole });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const contractId = formData.get("contractId") as string;
  const serverRole = getRoleFromRequest(request);

  if (intent === "addFollowUp") {
    const content = formData.get("content") as string;
    const isInternal = formData.get("isInternal") === "on";
    const author = formData.get("author") as string;
    if (!content.trim()) return json({ ok: false, error: "备注内容不能为空" });
    const safeIsInternal = canMarkInternal(serverRole) ? isInternal : false;
    const safeAuthor = author?.trim()
      ? author
      : resolveServerPersonName(db.getById(contractId)!, serverRole);
    db.addFollowUp(contractId, {
      content,
      isInternal: safeIsInternal,
      author: safeAuthor,
      authorRole: serverRole,
    });
    return json({ ok: true });
  }

  if (intent === "updateRenewal") {
    if (!canEditRenewal(serverRole)) {
      return json(
        { ok: false, error: "仅维保主管可修改续约信息" },
        { status: 403 }
      );
    }
    const status = formData.get("status") as RenewalStatus;
    const nextContactAt = formData.get("nextContactAt") as string;
    const renewalOfferStr = formData.get("renewalOffer") as string;
    const discountAppliedStr = formData.get("discountApplied") as string;
    const patch: Parameters<typeof db.updateRenewal>[1] = {};
    if (status) patch.status = status;
    if (nextContactAt) patch.nextContactAt = nextContactAt;
    if (renewalOfferStr) patch.renewalOffer = Number(renewalOfferStr);
    if (discountAppliedStr) patch.discountApplied = Number(discountAppliedStr);
    db.updateRenewal(contractId, patch);
    return json({ ok: true });
  }

  if (intent === "updateDanger") {
    if (!canEditDanger(serverRole)) {
      return json(
        { ok: false, error: "物业联系人不可修改隐患状态" },
        { status: 403 }
      );
    }
    const dangerId = formData.get("dangerId") as string;
    const status = formData.get("status") as DangerStatus;
    const author = formData.get("author") as string;
    if (status === "closed") {
      const safeAuthor = author?.trim()
        ? author
        : resolveServerPersonName(db.getById(contractId)!, serverRole);
      db.updateDanger(contractId, dangerId, {
        status,
        closedAt: new Date().toISOString().slice(0, 10),
        closedBy: safeAuthor,
      });
    } else {
      db.updateDanger(contractId, dangerId, { status });
    }
    return json({ ok: true });
  }

  return json({ ok: false, error: "未知操作" });
}

export default function EvidenceDetail() {
  const { contract, currentRole: serverRole } = useLoaderData<typeof loader>();
  const { currentRole, setCurrentRole } = useRoleStore();

  useEffect(() => {
    if (serverRole && serverRole !== currentRole) {
      setCurrentRole(serverRole as Role);
    }
  }, [serverRole, currentRole, setCurrentRole]);

  const displayRole = serverRole ?? currentRole;

  const personName = resolvePersonName(contract, displayRole);
  const renewalFetcher = useFetcher();
  const followUpFetcher = useFetcher();

  const renewStatus = RENEWAL_STATUS[contract.renewal.status];
  const daysLeft = daysUntil(contract.contract.endDate);
  const openDangerCount = contract.hiddenDangers.filter((d) => d.status !== "closed").length;
  const customerRating = contract.latestInspection?.customerRating
    ? INSPECTION_RATINGS[contract.latestInspection.customerRating]
    : null;

  const visibleFollowUps = filterFollowUpsByRole(contract.followUps, displayRole);
  const showEditRenewal = canEditRenewal(displayRole);
  const showEditDanger = canEditDanger(displayRole);
  const showMarkInternal = canMarkInternal(displayRole);

  const kpiCards = [
    {
      label: "到期天数",
      value: daysLeft >= 0 ? `${daysLeft} 天` : `已过期 ${Math.abs(daysLeft)} 天`,
      sub: formatDate(contract.contract.endDate),
      color: daysLeft <= 30 ? "bg-amber-50 text-amber-700" : daysLeft <= 60 ? "bg-brand-50 text-brand-700" : "bg-moss-50 text-moss-700",
      icon: "⏳",
    },
    {
      label: "合同金额",
      value: formatMoney(contract.contract.contractAmount),
      sub: contract.contract.serviceFrequency,
      color: "bg-slate-50 text-slate-700",
      icon: "💰",
    },
    {
      label: "未闭环隐患",
      value: `${openDangerCount} 项`,
      sub: `共 ${contract.hiddenDangers.length} 项`,
      color: openDangerCount > 0 ? "bg-rose-50 text-rose-700" : "bg-moss-50 text-moss-700",
      icon: "⚠️",
    },
    {
      label: "客户评分",
      value: customerRating ? "★".repeat(customerRating.score) : "—",
      sub: customerRating ? customerRating.label : "暂无评价",
      color: customerRating ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-500",
      icon: "⭐",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          ←
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 font-serif">
              {contract.contract.projectName}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${renewStatus.bg} ${renewStatus.color} ${renewStatus.border}`}
            >
              <span>{renewStatus.icon}</span>
              {renewStatus.label}
            </span>
          </div>
          <div className="text-sm text-slate-500 mt-1">
            合同编号：{contract.contract.contractNo} · 签署日期：{formatDate(contract.contract.signedAt)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => (
          <div key={idx} className={`rounded-xl p-4 border border-slate-200 bg-white`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-slate-500">{kpi.label}</div>
                <div className={`text-xl font-bold mt-1 ${kpi.color.split(" ")[1]}`}>
                  {kpi.value}
                </div>
                <div className="text-xs text-slate-400 mt-1">{kpi.sub}</div>
              </div>
              <div className={`w-9 h-9 rounded-lg ${kpi.color} flex items-center justify-center text-lg`}>
                {kpi.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-brand-500" />
                合同信息
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <InfoRow label="物业公司" value={contract.contract.propertyCompany} />
              <InfoRow
                label="联系人"
                value={
                  <span>
                    {contract.contract.propertyContact}
                    <span className="text-slate-400 ml-2">{contract.contract.propertyPhone}</span>
                  </span>
                }
              />
              <InfoRow label="建筑类型" value={contract.contract.buildingType} />
              <InfoRow label="建筑面积" value={`${contract.contract.buildingArea.toLocaleString()} ㎡`} />
              <InfoRow
                label="消防系统"
                value={
                  <div className="flex flex-wrap gap-1.5">
                    {contract.contract.fireSystemTypes.map((s) => (
                      <span
                        key={s}
                        className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                }
              />
              <InfoRow label="服务频次" value={contract.contract.serviceFrequency} />
              <InfoRow
                label="合同有效期"
                value={
                  <span>
                    {formatDate(contract.contract.startDate)} 至 {formatDate(contract.contract.endDate)}
                  </span>
                }
              />
              <InfoRow
                label="维保主管"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-xs ${ROLE_COLORS.supervisor}`}>
                      {ROLE_ICONS.supervisor} {contract.contract.supervisorName}
                    </span>
                  </span>
                }
              />
            </div>
          </section>

          {contract.latestInspection && (
            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-moss-500" />
                  巡检质量与客户评价
                </h2>
                <span className="text-xs text-slate-400">报告编号：{contract.latestInspection.reportNo}</span>
              </div>

              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    ROLE_COLORS[contract.latestInspection.inspectorRole]
                  }`}
                >
                  {ROLE_ICONS[contract.latestInspection.inspectorRole]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">
                      {contract.latestInspection.inspectorName}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${
                        ROLE_COLORS[contract.latestInspection.inspectorRole]
                      }`}
                    >
                      {ROLE_LABELS[contract.latestInspection.inspectorRole]}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    巡检日期：{formatDate(contract.latestInspection.inspectionDate)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-slate-500 mb-2">系统检查</div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {contract.latestInspection.systemChecked.map((s) => (
                      <span
                        key={s}
                        className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-slate-500 mb-2">检查通过率</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-moss-500 rounded-full transition-all"
                          style={{
                            width: `${Math.round(
                              (contract.latestInspection.itemsPassed /
                                contract.latestInspection.itemsChecked) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-moss-700 w-16 text-right">
                        {Math.round(
                          (contract.latestInspection.itemsPassed /
                            contract.latestInspection.itemsChecked) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-50 rounded-lg py-1.5">
                        <div className="font-bold text-slate-700">{contract.latestInspection.itemsChecked}</div>
                        <div className="text-slate-400">检查项</div>
                      </div>
                      <div className="bg-moss-50 rounded-lg py-1.5">
                        <div className="font-bold text-moss-700">{contract.latestInspection.itemsPassed}</div>
                        <div className="text-slate-400">通过</div>
                      </div>
                      <div className="bg-rose-50 rounded-lg py-1.5">
                        <div className="font-bold text-rose-700">{contract.latestInspection.itemsFailed}</div>
                        <div className="text-slate-400">不合格</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-2">巡检评级</div>
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4 ${
                      INSPECTION_RATINGS[contract.latestInspection.rating].bg
                    }`}
                  >
                    <span className="text-xl">
                      {INSPECTION_RATINGS[contract.latestInspection.rating].score >= 4
                        ? "🌟"
                        : INSPECTION_RATINGS[contract.latestInspection.rating].score >= 3
                        ? "👍"
                        : "⚠️"}
                    </span>
                    <div>
                      <div
                        className={`font-semibold ${
                          INSPECTION_RATINGS[contract.latestInspection.rating].color
                        }`}
                      >
                        {INSPECTION_RATINGS[contract.latestInspection.rating].label}
                      </div>
                      <div className="text-xs text-slate-500">
                        {"★".repeat(INSPECTION_RATINGS[contract.latestInspection.rating].score)}
                        {"☆".repeat(5 - INSPECTION_RATINGS[contract.latestInspection.rating].score)}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 mb-2">巡检总结</div>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 mb-4">
                    {contract.latestInspection.summary}
                  </p>

                  {contract.latestInspection.customerFeedback && (
                    <>
                      <div className="text-xs text-slate-500 mb-2">客户反馈</div>
                      <p className="text-sm text-slate-700 leading-relaxed bg-amber-50 rounded-lg p-3 border-l-4 border-amber-400">
                        "{contract.latestInspection.customerFeedback}"
                      </p>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-rose-500" />
                隐患清单
              </h2>
              <span className="text-sm text-slate-500">共 {contract.hiddenDangers.length} 项</span>
            </div>

            {contract.hiddenDangers.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-2">✅</div>
                <div>暂无隐患记录，状态良好</div>
              </div>
            ) : (
              <div className="space-y-3">
                {contract.hiddenDangers.map((danger) => (
                  <DangerCard
                    key={danger.id}
                    danger={danger}
                    contractId={contract.contract.id}
                    author={personName}
                    canEdit={showEditDanger}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-sky-500" />
                协作跟进
              </h2>
              <span className="text-sm text-slate-500">{visibleFollowUps.length} 条记录</span>
            </div>

            {visibleFollowUps.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">暂无跟进记录</div>
            ) : (
              <div className="relative pl-6">
                <div className="absolute left-[11px] top-1 bottom-1 w-px bg-slate-200" />
                <div className="space-y-5">
                  {[...visibleFollowUps].reverse().map((fu) => {
                    const role = fu.authorRole;
                    return (
                      <div key={fu.id} className="relative">
                        <div
                          className={`absolute -left-6 top-0 w-6 h-6 rounded-full border-2 border-white ${
                            ROLE_COLORS[role]
                          } flex items-center justify-center text-xs shadow-sm`}
                        >
                          {ROLE_ICONS[role]}
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 ml-2">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-medium text-slate-800">{fu.author}</span>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs ${ROLE_COLORS[role]}`}>
                              {ROLE_LABELS[role]}
                            </span>
                            {fu.isInternal && (
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-xs">
                                🔒 内部备注
                              </span>
                            )}
                            <span className="text-xs text-slate-400 ml-auto">{fu.createdAt}</span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {fu.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <div className="sticky top-6 space-y-6">
            {showEditRenewal ? (
              <section className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
                  <span className="w-1 h-5 rounded-full bg-brand-500" />
                  续约跟进
                </h2>
                <renewalFetcher.Form method="post" className="space-y-4">
                  <input type="hidden" name="intent" value="updateRenewal" />
                  <input type="hidden" name="contractId" value={contract.contract.id} />
                  <input type="hidden" name="assignedTo" value={contract.renewal.assignedTo} />

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">续约状态</label>
                    <select
                      name="status"
                      defaultValue={contract.renewal.status}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 bg-white"
                    >
                      {(Object.keys(RENEWAL_STATUS) as RenewalStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {RENEWAL_STATUS[s].icon} {RENEWAL_STATUS[s].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">下次联系日期</label>
                    <input
                      type="date"
                      name="nextContactAt"
                      defaultValue={contract.renewal.nextContactAt}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">续约报价（元）</label>
                      <input
                        type="number"
                        name="renewalOffer"
                        defaultValue={contract.renewal.renewalOffer ?? ""}
                        placeholder="0"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">折扣（%）</label>
                      <input
                        type="number"
                        name="discountApplied"
                        defaultValue={contract.renewal.discountApplied ?? ""}
                        placeholder="0"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                      />
                    </div>
                  </div>

                  {contract.renewal.renewalOffer !== undefined && (
                    <div className="p-3 rounded-lg bg-slate-50 text-xs space-y-1">
                      <div className="flex justify-between text-slate-500">
                        <span>原合同金额</span>
                        <span>{formatMoney(contract.contract.contractAmount)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>报价金额</span>
                        <span>{formatMoney(contract.renewal.renewalOffer)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>
                          折扣
                          {contract.renewal.discountApplied ? ` (${contract.renewal.discountApplied}%)` : ""}
                        </span>
                        <span>
                          {contract.renewal.discountApplied
                            ? formatMoney(
                                Math.round(
                                  contract.renewal.renewalOffer *
                                    (1 - contract.renewal.discountApplied / 100)
                                )
                              )
                            : formatMoney(contract.renewal.renewalOffer)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 mt-1 border-t border-slate-200 font-medium text-slate-700">
                        <span>涨幅</span>
                        <span
                          className={
                            contract.renewal.renewalOffer >= contract.contract.contractAmount
                              ? "text-brand-600"
                              : "text-moss-600"
                          }
                        >
                          {contract.renewal.renewalOffer >= contract.contract.contractAmount
                            ? "+"
                            : ""}
                          {Math.round(
                            ((contract.renewal.renewalOffer - contract.contract.contractAmount) /
                              contract.contract.contractAmount) *
                              100
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  )}

                  {contract.renewal.notes && (
                    <div className="p-3 rounded-lg bg-amber-50 border-l-4 border-amber-400 text-xs text-slate-700">
                      <span className="font-medium text-amber-700">📝 备注：</span>
                      {contract.renewal.notes}
                    </div>
                  )}

                  {contract.renewal.renewedAt && (
                    <div className="p-3 rounded-lg bg-moss-50 border border-moss-200 text-xs text-moss-700">
                      ✅ 已于 {formatDate(contract.renewal.renewedAt)} 完成续约
                      {contract.renewal.signedContractNo && (
                        <>
                          <br />
                          新合同编号：{contract.renewal.signedContractNo}
                        </>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
                  >
                    保存续约信息
                  </button>
                </renewalFetcher.Form>
              </section>
            ) : (
              <section className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
                  <span className="w-1 h-5 rounded-full bg-brand-500" />
                  续约信息
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">续约状态</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${renewStatus.bg} ${renewStatus.color} ${renewStatus.border}`}>
                      {renewStatus.icon} {renewStatus.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">下次联系</span>
                    <span className="font-medium text-slate-700">{formatDate(contract.renewal.nextContactAt)}</span>
                  </div>
                  {contract.renewal.renewalOffer !== undefined && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">续约报价</span>
                        <span className="font-medium text-slate-700">{formatMoney(contract.renewal.renewalOffer)}</span>
                      </div>
                      {contract.renewal.discountApplied ? (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">折扣</span>
                          <span className="font-medium text-brand-600">-{contract.renewal.discountApplied}%</span>
                        </div>
                      ) : null}
                    </>
                  )}
                  {contract.renewal.notes && (
                    <div className="mt-2 p-3 rounded-lg bg-amber-50 border-l-4 border-amber-400 text-xs text-slate-700">
                      <span className="font-medium text-amber-700">📝 备注：</span>
                      {contract.renewal.notes}
                    </div>
                  )}
                  {contract.renewal.renewedAt && (
                    <div className="mt-2 p-3 rounded-lg bg-moss-50 border border-moss-200 text-xs text-moss-700">
                      ✅ 已于 {formatDate(contract.renewal.renewedAt)} 完成续约
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 text-center">
                    {displayRole === "engineer"
                      ? "维保主管负责调整续约策略，请联系赵建国"
                      : "续约策略由维保主管维护，您可记录合作反馈"}
                  </div>
                </div>
              </section>
            )}

            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full bg-sky-500" />
                {displayRole === "property" ? "合作反馈" : "追加跟进备注"}
              </h2>
              <followUpFetcher.Form method="post" className="space-y-3">
                <input type="hidden" name="intent" value="addFollowUp" />
                <input type="hidden" name="contractId" value={contract.contract.id} />
                <input type="hidden" name="author" value={personName} />
                {!showMarkInternal && <input type="hidden" name="isInternal" />}

                <div>
                  <textarea
                    name="content"
                    rows={4}
                    placeholder={
                      displayRole === "property"
                        ? "请记录您的合作意向、服务评价或其他反馈…"
                        : "记录本次跟进内容、客户反馈、下一步计划…"
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 resize-none"
                  />
                </div>

                {showMarkInternal && (
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="isInternal"
                      className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span>🔒 标记为内部备注（客户不可见）</span>
                  </label>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs text-slate-400">
                    提交人：
                    <span className={`px-1.5 py-0.5 rounded text-xs ${ROLE_COLORS[displayRole]}`}>
                      {ROLE_ICONS[displayRole]} {personName}
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium transition-colors"
                  >
                    {displayRole === "property" ? "提交反馈" : "提交备注"}
                  </button>
                </div>
              </followUpFetcher.Form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function DangerCard({
  danger,
  contractId,
  author,
  canEdit,
}: {
  danger: ReturnType<typeof useLoaderData<typeof loader>>["contract"]["hiddenDangers"][number];
  contractId: string;
  author: string;
  canEdit: boolean;
}) {
  const dangerFetcher = useFetcher();
  const risk = RISK_LEVELS[danger.riskLevel];
  const dStatus = DANGER_STATUS[danger.status];
  const deadlineDays = daysUntil(danger.deadline);
  const overdue = deadlineDays < 0 && danger.status !== "closed";

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        danger.status === "closed"
          ? "bg-slate-50 border-slate-200"
          : "bg-white border-slate-200 hover:border-brand-200"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg ${risk.bg} flex flex-col items-center justify-center shrink-0`}>
          <span className="text-lg font-bold">{risk.label.charAt(0)}</span>
          <span className={`text-[10px] font-medium ${risk.color}`}>{risk.label}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${risk.bg} ${risk.color}`}>
              {risk.label}风险
            </span>
            <h3 className="font-medium text-slate-800">{danger.title}</h3>
          </div>
          <p className="text-sm text-slate-600 mb-2">{danger.description}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
            <span>📍 {danger.location}</span>
            <span>
              发现人：{danger.foundBy} · {formatDate(danger.foundAt)}
            </span>
            <span className={overdue ? "text-rose-600 font-medium" : ""}>
              📅 截止：{formatDate(danger.deadline)}
              {overdue && `（已超期 ${Math.abs(deadlineDays)} 天）`}
            </span>
          </div>
          {danger.rectificationPlan && (
            <div className="mt-2 p-2.5 bg-slate-50 rounded text-xs text-slate-600">
              <span className="font-medium text-slate-700">整改计划：</span>
              {danger.rectificationPlan}
            </div>
          )}
          {danger.status === "closed" && danger.closedBy && (
            <div className="mt-2 text-xs text-moss-600">
              ✅ 已于 {formatDate(danger.closedAt!)} 由 {danger.closedBy} 闭环
            </div>
          )}
        </div>
        <div className="shrink-0">
          {canEdit ? (
            <dangerFetcher.Form method="post" className="flex flex-col items-end gap-2">
              <input type="hidden" name="intent" value="updateDanger" />
              <input type="hidden" name="contractId" value={contractId} />
              <input type="hidden" name="dangerId" value={danger.id} />
              <input type="hidden" name="author" value={author} />
              <select
                name="status"
                defaultValue={danger.status}
                onChange={(e) => e.target.form?.requestSubmit()}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer ${dStatus.bg} ${dStatus.color}`}
              >
                {(Object.keys(DANGER_STATUS) as DangerStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {DANGER_STATUS[s].label}
                  </option>
                ))}
              </select>
            </dangerFetcher.Form>
          ) : (
            <span
              className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${dStatus.bg} ${dStatus.color}`}
            >
              {dStatus.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-20 shrink-0 text-slate-400">{label}</div>
      <div className="flex-1 text-slate-700 min-w-0">{value}</div>
    </div>
  );
}
