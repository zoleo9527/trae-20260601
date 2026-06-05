import { _ as __nuxt_component_0 } from "./nuxt-link-COjNzfAG.js";
import { defineComponent, ref, mergeProps, unref, withCtx, createTextVNode, createVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrIncludeBooleanAttr, ssrRenderList } from "vue/server-renderer";
import { ArrowLeft, Loader2, ChevronRight, CheckCircle2 } from "lucide-vue-next";
import { a as useRoute } from "../server.mjs";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/ufo/dist/index.mjs";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/defu/dist/defu.mjs";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/hookable/dist/index.mjs";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/unctx/dist/index.mjs";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/h3/dist/index.mjs";
import "pinia";
import "vue-router";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/klona/dist/index.mjs";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    useRoute();
    const risk = ref({});
    const loading = ref(true);
    const approving = ref(false);
    const resubmitting = ref(false);
    const approveAction = ref("");
    const approveNote = ref("");
    const supplementNote = ref("");
    const showRejectModal = ref(false);
    const rejectReason = ref("");
    function actionLabel(action) {
      const map = {
        create: "创建巡查单",
        start: "开始巡查",
        complete: "完成巡查",
        archive: "归档",
        risk_reported: "关联风险上报",
        report: "上报风险",
        approve: "审批通过",
        reject: "退回",
        resubmit: "重新提交"
      };
      return map[action] || action;
    }
    function levelLabel(l) {
      const map = { low: "低", medium: "中", high: "高", critical: "严重" };
      return map[l] || l;
    }
    function levelBadgeClass(l) {
      const map = { low: "bg-sky-500/20 text-sky-400", medium: "bg-amber-500/20 text-amber-400", high: "bg-orange-500/20 text-orange-400", critical: "bg-red-500/20 text-red-400" };
      return map[l] || "";
    }
    function levelTextColor(l) {
      const map = { low: "text-sky-400", medium: "text-amber-400", high: "text-orange-400", critical: "text-red-400" };
      return map[l] || "";
    }
    function urgencyLabel(u) {
      const map = { normal: "常规", urgent: "紧急", immediate: "立即" };
      return map[u] || u;
    }
    function statusLabel(s) {
      const map = { reported: "已上报", approved: "已审批", rejected: "已退回", resubmitted: "已重提", archived: "已归档" };
      return map[s] || s;
    }
    function statusBadgeClass(s) {
      const map = { reported: "badge-reported", approved: "badge-approved", rejected: "badge-rejected", resubmitted: "badge-resubmitted", archived: "badge-archived" };
      return map[s] || "badge";
    }
    function difficultyLabel(d) {
      const map = { beginner: "初级", intermediate: "中级", advanced: "高级", expert: "专家" };
      return map[d] || d;
    }
    function difficultyColor(d) {
      const map = { beginner: "text-emerald-400", intermediate: "text-sky-400", advanced: "text-amber-400", expert: "text-red-400" };
      return map[d] || "";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-8" }, _attrs))}><div class="flex items-center gap-3 mb-6"><button class="text-slate-400 hover:text-white transition-colors">`);
      _push(ssrRenderComponent(unref(ArrowLeft), { class: "w-5 h-5" }, null, _parent));
      _push(`</button><div><h1 class="text-2xl font-bold text-white">风险详情</h1><p class="text-slate-400 text-sm">${ssrInterpolate(unref(risk).trailName)} · ${ssrInterpolate(unref(risk).createdAt)}</p></div><div class="ml-auto flex items-center gap-2"><span class="${ssrRenderClass([levelBadgeClass(unref(risk).level), "badge"])}">${ssrInterpolate(levelLabel(unref(risk).level))}</span><span class="${ssrRenderClass(statusBadgeClass(unref(risk).status))}">${ssrInterpolate(statusLabel(unref(risk).status))}</span></div></div>`);
      if (unref(loading)) {
        _push(`<div class="text-center py-12">`);
        _push(ssrRenderComponent(unref(Loader2), { class: "w-8 h-8 text-orange-400 animate-spin mx-auto" }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!--[--><div class="grid grid-cols-2 gap-6 mb-6"><div class="card"><h3 class="text-sm font-semibold text-slate-300 mb-3">风险信息</h3><div class="space-y-2 text-sm"><div class="flex justify-between"><span class="text-slate-400">风险等级</span><span class="${ssrRenderClass(levelTextColor(unref(risk).level))}">${ssrInterpolate(levelLabel(unref(risk).level))}</span></div><div class="flex justify-between"><span class="text-slate-400">紧急程度</span><span class="text-white">${ssrInterpolate(urgencyLabel(unref(risk).urgency))}</span></div><div class="flex justify-between"><span class="text-slate-400">上报人</span><span class="text-white">${ssrInterpolate(unref(risk).creatorName)}</span></div><div class="flex justify-between"><span class="text-slate-400">上报时间</span><span class="text-white">${ssrInterpolate(unref(risk).createdAt)}</span></div>`);
        if (unref(risk).resolvedAt) {
          _push(`<div class="flex justify-between"><span class="text-slate-400">处理时间</span><span class="text-white">${ssrInterpolate(unref(risk).resolvedAt)}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="mt-3 pt-3 border-t border-slate-700"><p class="text-slate-400 mb-1">风险描述</p><p class="text-white text-sm leading-relaxed">${ssrInterpolate(unref(risk).description)}</p></div></div></div><div class="card"><h3 class="text-sm font-semibold text-slate-300 mb-3">关联巡查</h3><div class="space-y-2 text-sm"><div class="flex justify-between"><span class="text-slate-400">雪道</span><span class="text-white">${ssrInterpolate(unref(risk).trailName)}</span></div><div class="flex justify-between"><span class="text-slate-400">难度</span><span class="${ssrRenderClass(difficultyColor(unref(risk).trailDifficulty))}">${ssrInterpolate(difficultyLabel(unref(risk).trailDifficulty))}</span></div><div class="flex justify-between"><span class="text-slate-400">巡查结果</span>`);
        if (unref(risk).patrolResult === "normal") {
          _push(`<span class="text-emerald-400">正常</span>`);
        } else if (unref(risk).patrolResult === "issue") {
          _push(`<span class="text-orange-400">有问题</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (unref(risk).patrolConclusion) {
          _push(`<div class="mt-3 pt-3 border-t border-slate-700"><p class="text-slate-400 mb-1">巡查结论</p><p class="text-white text-sm">${ssrInterpolate(unref(risk).patrolConclusion)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/patrols/${unref(risk).patrolId}`,
          class: "inline-flex items-center gap-1 text-sky-400 text-sm mt-4 hover:text-sky-300 transition-colors"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` 查看巡查详情 `);
              _push2(ssrRenderComponent(unref(ChevronRight), { class: "w-3 h-3" }, null, _parent2, _scopeId));
            } else {
              return [
                createTextVNode(" 查看巡查详情 "),
                createVNode(unref(ChevronRight), { class: "w-3 h-3" })
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div>`);
        if (unref(risk).approveAction) {
          _push(`<div class="card mb-6"><h3 class="text-sm font-semibold text-emerald-400 mb-3">审批结果</h3><div class="space-y-2 text-sm"><div class="flex justify-between"><span class="text-slate-400">处理方式</span><span class="text-white">${ssrInterpolate(unref(risk).approveAction === "reschedule" ? "改期" : "补录")}</span></div>`);
          if (unref(risk).approveNote) {
            _push(`<div class="flex justify-between"><span class="text-slate-400">审批备注</span><span class="text-white">${ssrInterpolate(unref(risk).approveNote)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(risk).rejectReason) {
          _push(`<div class="card mb-6 border-red-500/20"><h3 class="text-sm font-semibold text-red-400 mb-3">退回原因</h3><p class="text-white text-sm">${ssrInterpolate(unref(risk).rejectReason)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(risk).supplementNote) {
          _push(`<div class="card mb-6 border-purple-500/20"><h3 class="text-sm font-semibold text-purple-400 mb-3">补充备注</h3><p class="text-white text-sm">${ssrInterpolate(unref(risk).supplementNote)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(risk).status === "reported" || unref(risk).status === "resubmitted") {
          _push(`<div class="card mb-6"><h3 class="text-sm font-semibold text-slate-300 mb-4">审批操作</h3><div class="space-y-4"><div><label class="label-text">审批方式</label><div class="flex gap-3"><button class="${ssrRenderClass([unref(approveAction) === "reschedule" ? "bg-sky-500/20 border-sky-500/50 text-sky-400" : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500", "flex-1 py-3 rounded-lg border text-sm font-medium transition-all"])}"> 改期 </button><button class="${ssrRenderClass([unref(approveAction) === "supplement" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500", "flex-1 py-3 rounded-lg border text-sm font-medium transition-all"])}"> 补录 </button></div></div><div><label class="label-text">审批备注</label><textarea rows="2" class="input-field w-full" placeholder="可选填写审批备注...">${ssrInterpolate(unref(approveNote))}</textarea></div><div class="flex gap-3"><button${ssrIncludeBooleanAttr(unref(approving) || !unref(approveAction)) ? " disabled" : ""} class="btn-success flex-1 disabled:opacity-50">${ssrInterpolate(unref(approving) ? "处理中..." : "通过")}</button><button class="btn-danger flex-1"> 退回 </button></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(risk).status === "rejected") {
          _push(`<div class="card mb-6 border-red-500/20"><h3 class="text-sm font-semibold text-red-400 mb-4">重新提交</h3><div class="space-y-4"><div><label class="label-text">补充备注</label><textarea rows="3" class="input-field w-full" placeholder="请填写补充说明...">${ssrInterpolate(unref(supplementNote))}</textarea></div><button${ssrIncludeBooleanAttr(unref(resubmitting) || !unref(supplementNote)) ? " disabled" : ""} class="btn-primary w-full disabled:opacity-50">${ssrInterpolate(unref(resubmitting) ? "提交中..." : "补充备注并重新提交")}</button></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(risk).status === "approved") {
          _push(`<div class="card mb-6"><div class="flex items-center justify-between"><div class="flex items-center gap-3">`);
          _push(ssrRenderComponent(unref(CheckCircle2), { class: "w-5 h-5 text-emerald-400" }, null, _parent));
          _push(`<span class="text-white font-medium">风险已审批</span></div><button class="btn-secondary">归档</button></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="card"><h3 class="text-sm font-semibold text-slate-300 mb-4">完整操作日志</h3><div class="relative pl-6 space-y-4">`);
        if (unref(risk).patrolAuditLogs && unref(risk).patrolAuditLogs.length > 0) {
          _push(`<!--[--><p class="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">巡查阶段</p><!--[-->`);
          ssrRenderList(unref(risk).patrolAuditLogs, (log) => {
            _push(`<div class="relative"><div class="absolute -left-6 top-1 w-3 h-3 rounded-full bg-sky-400/50 border-2 border-sky-400/50"></div><div class="ml-4"><p class="text-sm text-white">${ssrInterpolate(actionLabel(log.action))}</p><p class="text-xs text-slate-400 mt-0.5">${ssrInterpolate(log.operatorName)} · ${ssrInterpolate(log.createdAt)}</p>`);
            if (log.detail) {
              _push(`<p class="text-xs text-slate-500 mt-1">${ssrInterpolate(log.detail)}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--><!--]-->`);
        } else {
          _push(`<!---->`);
        }
        if (unref(risk).auditLogs && unref(risk).auditLogs.length > 0) {
          _push(`<!--[--><p class="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2 mt-4">风险阶段</p><!--[-->`);
          ssrRenderList(unref(risk).auditLogs, (log, i) => {
            _push(`<div class="relative"><div class="${ssrRenderClass([i === unref(risk).auditLogs.length - 1 ? "bg-orange-400 border-orange-400" : "bg-orange-400/50 border-orange-400/50", "absolute -left-6 top-1 w-3 h-3 rounded-full"])}"></div><div class="ml-4"><p class="text-sm text-white">${ssrInterpolate(actionLabel(log.action))}</p><p class="text-xs text-slate-400 mt-0.5">${ssrInterpolate(log.operatorName)} · ${ssrInterpolate(log.createdAt)}</p>`);
            if (log.detail) {
              _push(`<p class="text-xs text-slate-500 mt-1">${ssrInterpolate(log.detail)}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--><!--]-->`);
        } else {
          _push(`<!---->`);
        }
        if ((!unref(risk).auditLogs || unref(risk).auditLogs.length === 0) && (!unref(risk).patrolAuditLogs || unref(risk).patrolAuditLogs.length === 0)) {
          _push(`<div class="text-slate-500 text-sm ml-4">暂无操作日志</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><!--]-->`);
      }
      if (unref(showRejectModal)) {
        _push(`<div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><div class="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700"><h3 class="text-lg font-semibold text-white mb-4">退回风险上报</h3><div class="mb-4"><label class="label-text">退回原因</label><textarea rows="3" class="input-field w-full" placeholder="请填写退回原因...">${ssrInterpolate(unref(rejectReason))}</textarea></div><div class="flex gap-3"><button class="btn-secondary flex-1">取消</button><button${ssrIncludeBooleanAttr(!unref(rejectReason)) ? " disabled" : ""} class="btn-danger flex-1 disabled:opacity-50">确认退回</button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/risks/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=_id_-BmuFGYuy.js.map
