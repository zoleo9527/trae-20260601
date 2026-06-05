import { _ as __nuxt_component_0 } from './nuxt-link-COjNzfAG.mjs';
import { defineComponent, ref, mergeProps, unref, withCtx, createTextVNode, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrIncludeBooleanAttr, ssrRenderList } from 'vue/server-renderer';
import { ArrowLeft, Loader2, ChevronRight, CheckCircle2 } from 'lucide-vue-next';
import { a as useRoute } from './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'better-sqlite3';
import 'path';
import 'fs';
import 'url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';
import 'pinia';
import 'vue-router';

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
        create: "\u521B\u5EFA\u5DE1\u67E5\u5355",
        start: "\u5F00\u59CB\u5DE1\u67E5",
        complete: "\u5B8C\u6210\u5DE1\u67E5",
        archive: "\u5F52\u6863",
        risk_reported: "\u5173\u8054\u98CE\u9669\u4E0A\u62A5",
        report: "\u4E0A\u62A5\u98CE\u9669",
        approve: "\u5BA1\u6279\u901A\u8FC7",
        reject: "\u9000\u56DE",
        resubmit: "\u91CD\u65B0\u63D0\u4EA4"
      };
      return map[action] || action;
    }
    function levelLabel(l) {
      const map = { low: "\u4F4E", medium: "\u4E2D", high: "\u9AD8", critical: "\u4E25\u91CD" };
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
      const map = { normal: "\u5E38\u89C4", urgent: "\u7D27\u6025", immediate: "\u7ACB\u5373" };
      return map[u] || u;
    }
    function statusLabel(s) {
      const map = { reported: "\u5DF2\u4E0A\u62A5", approved: "\u5DF2\u5BA1\u6279", rejected: "\u5DF2\u9000\u56DE", resubmitted: "\u5DF2\u91CD\u63D0", archived: "\u5DF2\u5F52\u6863" };
      return map[s] || s;
    }
    function statusBadgeClass(s) {
      const map = { reported: "badge-reported", approved: "badge-approved", rejected: "badge-rejected", resubmitted: "badge-resubmitted", archived: "badge-archived" };
      return map[s] || "badge";
    }
    function difficultyLabel(d) {
      const map = { beginner: "\u521D\u7EA7", intermediate: "\u4E2D\u7EA7", advanced: "\u9AD8\u7EA7", expert: "\u4E13\u5BB6" };
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
      _push(`</button><div><h1 class="text-2xl font-bold text-white">\u98CE\u9669\u8BE6\u60C5</h1><p class="text-slate-400 text-sm">${ssrInterpolate(unref(risk).trailName)} \xB7 ${ssrInterpolate(unref(risk).createdAt)}</p></div><div class="ml-auto flex items-center gap-2"><span class="${ssrRenderClass([levelBadgeClass(unref(risk).level), "badge"])}">${ssrInterpolate(levelLabel(unref(risk).level))}</span><span class="${ssrRenderClass(statusBadgeClass(unref(risk).status))}">${ssrInterpolate(statusLabel(unref(risk).status))}</span></div></div>`);
      if (unref(loading)) {
        _push(`<div class="text-center py-12">`);
        _push(ssrRenderComponent(unref(Loader2), { class: "w-8 h-8 text-orange-400 animate-spin mx-auto" }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!--[--><div class="grid grid-cols-2 gap-6 mb-6"><div class="card"><h3 class="text-sm font-semibold text-slate-300 mb-3">\u98CE\u9669\u4FE1\u606F</h3><div class="space-y-2 text-sm"><div class="flex justify-between"><span class="text-slate-400">\u98CE\u9669\u7B49\u7EA7</span><span class="${ssrRenderClass(levelTextColor(unref(risk).level))}">${ssrInterpolate(levelLabel(unref(risk).level))}</span></div><div class="flex justify-between"><span class="text-slate-400">\u7D27\u6025\u7A0B\u5EA6</span><span class="text-white">${ssrInterpolate(urgencyLabel(unref(risk).urgency))}</span></div><div class="flex justify-between"><span class="text-slate-400">\u4E0A\u62A5\u4EBA</span><span class="text-white">${ssrInterpolate(unref(risk).creatorName)}</span></div><div class="flex justify-between"><span class="text-slate-400">\u4E0A\u62A5\u65F6\u95F4</span><span class="text-white">${ssrInterpolate(unref(risk).createdAt)}</span></div>`);
        if (unref(risk).resolvedAt) {
          _push(`<div class="flex justify-between"><span class="text-slate-400">\u5904\u7406\u65F6\u95F4</span><span class="text-white">${ssrInterpolate(unref(risk).resolvedAt)}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="mt-3 pt-3 border-t border-slate-700"><p class="text-slate-400 mb-1">\u98CE\u9669\u63CF\u8FF0</p><p class="text-white text-sm leading-relaxed">${ssrInterpolate(unref(risk).description)}</p></div></div></div><div class="card"><h3 class="text-sm font-semibold text-slate-300 mb-3">\u5173\u8054\u5DE1\u67E5</h3><div class="space-y-2 text-sm"><div class="flex justify-between"><span class="text-slate-400">\u96EA\u9053</span><span class="text-white">${ssrInterpolate(unref(risk).trailName)}</span></div><div class="flex justify-between"><span class="text-slate-400">\u96BE\u5EA6</span><span class="${ssrRenderClass(difficultyColor(unref(risk).trailDifficulty))}">${ssrInterpolate(difficultyLabel(unref(risk).trailDifficulty))}</span></div><div class="flex justify-between"><span class="text-slate-400">\u5DE1\u67E5\u7ED3\u679C</span>`);
        if (unref(risk).patrolResult === "normal") {
          _push(`<span class="text-emerald-400">\u6B63\u5E38</span>`);
        } else if (unref(risk).patrolResult === "issue") {
          _push(`<span class="text-orange-400">\u6709\u95EE\u9898</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (unref(risk).patrolConclusion) {
          _push(`<div class="mt-3 pt-3 border-t border-slate-700"><p class="text-slate-400 mb-1">\u5DE1\u67E5\u7ED3\u8BBA</p><p class="text-white text-sm">${ssrInterpolate(unref(risk).patrolConclusion)}</p></div>`);
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
              _push2(` \u67E5\u770B\u5DE1\u67E5\u8BE6\u60C5 `);
              _push2(ssrRenderComponent(unref(ChevronRight), { class: "w-3 h-3" }, null, _parent2, _scopeId));
            } else {
              return [
                createTextVNode(" \u67E5\u770B\u5DE1\u67E5\u8BE6\u60C5 "),
                createVNode(unref(ChevronRight), { class: "w-3 h-3" })
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div>`);
        if (unref(risk).approveAction) {
          _push(`<div class="card mb-6"><h3 class="text-sm font-semibold text-emerald-400 mb-3">\u5BA1\u6279\u7ED3\u679C</h3><div class="space-y-2 text-sm"><div class="flex justify-between"><span class="text-slate-400">\u5904\u7406\u65B9\u5F0F</span><span class="text-white">${ssrInterpolate(unref(risk).approveAction === "reschedule" ? "\u6539\u671F" : "\u8865\u5F55")}</span></div>`);
          if (unref(risk).approveNote) {
            _push(`<div class="flex justify-between"><span class="text-slate-400">\u5BA1\u6279\u5907\u6CE8</span><span class="text-white">${ssrInterpolate(unref(risk).approveNote)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(risk).rejectReason) {
          _push(`<div class="card mb-6 border-red-500/20"><h3 class="text-sm font-semibold text-red-400 mb-3">\u9000\u56DE\u539F\u56E0</h3><p class="text-white text-sm">${ssrInterpolate(unref(risk).rejectReason)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(risk).supplementNote) {
          _push(`<div class="card mb-6 border-purple-500/20"><h3 class="text-sm font-semibold text-purple-400 mb-3">\u8865\u5145\u5907\u6CE8</h3><p class="text-white text-sm">${ssrInterpolate(unref(risk).supplementNote)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(risk).status === "reported" || unref(risk).status === "resubmitted") {
          _push(`<div class="card mb-6"><h3 class="text-sm font-semibold text-slate-300 mb-4">\u5BA1\u6279\u64CD\u4F5C</h3><div class="space-y-4"><div><label class="label-text">\u5BA1\u6279\u65B9\u5F0F</label><div class="flex gap-3"><button class="${ssrRenderClass([unref(approveAction) === "reschedule" ? "bg-sky-500/20 border-sky-500/50 text-sky-400" : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500", "flex-1 py-3 rounded-lg border text-sm font-medium transition-all"])}"> \u6539\u671F </button><button class="${ssrRenderClass([unref(approveAction) === "supplement" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500", "flex-1 py-3 rounded-lg border text-sm font-medium transition-all"])}"> \u8865\u5F55 </button></div></div><div><label class="label-text">\u5BA1\u6279\u5907\u6CE8</label><textarea rows="2" class="input-field w-full" placeholder="\u53EF\u9009\u586B\u5199\u5BA1\u6279\u5907\u6CE8...">${ssrInterpolate(unref(approveNote))}</textarea></div><div class="flex gap-3"><button${ssrIncludeBooleanAttr(unref(approving) || !unref(approveAction)) ? " disabled" : ""} class="btn-success flex-1 disabled:opacity-50">${ssrInterpolate(unref(approving) ? "\u5904\u7406\u4E2D..." : "\u901A\u8FC7")}</button><button class="btn-danger flex-1"> \u9000\u56DE </button></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(risk).status === "rejected") {
          _push(`<div class="card mb-6 border-red-500/20"><h3 class="text-sm font-semibold text-red-400 mb-4">\u91CD\u65B0\u63D0\u4EA4</h3><div class="space-y-4"><div><label class="label-text">\u8865\u5145\u5907\u6CE8</label><textarea rows="3" class="input-field w-full" placeholder="\u8BF7\u586B\u5199\u8865\u5145\u8BF4\u660E...">${ssrInterpolate(unref(supplementNote))}</textarea></div><button${ssrIncludeBooleanAttr(unref(resubmitting) || !unref(supplementNote)) ? " disabled" : ""} class="btn-primary w-full disabled:opacity-50">${ssrInterpolate(unref(resubmitting) ? "\u63D0\u4EA4\u4E2D..." : "\u8865\u5145\u5907\u6CE8\u5E76\u91CD\u65B0\u63D0\u4EA4")}</button></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(risk).status === "approved") {
          _push(`<div class="card mb-6"><div class="flex items-center justify-between"><div class="flex items-center gap-3">`);
          _push(ssrRenderComponent(unref(CheckCircle2), { class: "w-5 h-5 text-emerald-400" }, null, _parent));
          _push(`<span class="text-white font-medium">\u98CE\u9669\u5DF2\u5BA1\u6279</span></div><button class="btn-secondary">\u5F52\u6863</button></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="card"><h3 class="text-sm font-semibold text-slate-300 mb-4">\u5B8C\u6574\u64CD\u4F5C\u65E5\u5FD7</h3><div class="relative pl-6 space-y-4">`);
        if (unref(risk).patrolAuditLogs && unref(risk).patrolAuditLogs.length > 0) {
          _push(`<!--[--><p class="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">\u5DE1\u67E5\u9636\u6BB5</p><!--[-->`);
          ssrRenderList(unref(risk).patrolAuditLogs, (log) => {
            _push(`<div class="relative"><div class="absolute -left-6 top-1 w-3 h-3 rounded-full bg-sky-400/50 border-2 border-sky-400/50"></div><div class="ml-4"><p class="text-sm text-white">${ssrInterpolate(actionLabel(log.action))}</p><p class="text-xs text-slate-400 mt-0.5">${ssrInterpolate(log.operatorName)} \xB7 ${ssrInterpolate(log.createdAt)}</p>`);
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
          _push(`<!--[--><p class="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2 mt-4">\u98CE\u9669\u9636\u6BB5</p><!--[-->`);
          ssrRenderList(unref(risk).auditLogs, (log, i) => {
            _push(`<div class="relative"><div class="${ssrRenderClass([i === unref(risk).auditLogs.length - 1 ? "bg-orange-400 border-orange-400" : "bg-orange-400/50 border-orange-400/50", "absolute -left-6 top-1 w-3 h-3 rounded-full"])}"></div><div class="ml-4"><p class="text-sm text-white">${ssrInterpolate(actionLabel(log.action))}</p><p class="text-xs text-slate-400 mt-0.5">${ssrInterpolate(log.operatorName)} \xB7 ${ssrInterpolate(log.createdAt)}</p>`);
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
          _push(`<div class="text-slate-500 text-sm ml-4">\u6682\u65E0\u64CD\u4F5C\u65E5\u5FD7</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><!--]-->`);
      }
      if (unref(showRejectModal)) {
        _push(`<div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><div class="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700"><h3 class="text-lg font-semibold text-white mb-4">\u9000\u56DE\u98CE\u9669\u4E0A\u62A5</h3><div class="mb-4"><label class="label-text">\u9000\u56DE\u539F\u56E0</label><textarea rows="3" class="input-field w-full" placeholder="\u8BF7\u586B\u5199\u9000\u56DE\u539F\u56E0...">${ssrInterpolate(unref(rejectReason))}</textarea></div><div class="flex gap-3"><button class="btn-secondary flex-1">\u53D6\u6D88</button><button${ssrIncludeBooleanAttr(!unref(rejectReason)) ? " disabled" : ""} class="btn-danger flex-1 disabled:opacity-50">\u786E\u8BA4\u9000\u56DE</button></div></div></div>`);
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

export { _sfc_main as default };
//# sourceMappingURL=_id_-BmuFGYuy.mjs.map
