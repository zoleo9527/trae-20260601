import { _ as __nuxt_component_0 } from './nuxt-link-COjNzfAG.mjs';
import { defineComponent, ref, mergeProps, unref, withCtx, createVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { ArrowLeft, Loader2, Clock, CheckCircle2 } from 'lucide-vue-next';
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
    const patrol = ref({});
    const loading = ref(true);
    const submitting = ref(false);
    const conclusion = ref("");
    const result = ref("");
    function difficultyLabel(d) {
      const map = { beginner: "\u521D\u7EA7", intermediate: "\u4E2D\u7EA7", advanced: "\u9AD8\u7EA7", expert: "\u4E13\u5BB6" };
      return map[d] || d;
    }
    function difficultyColor(d) {
      const map = { beginner: "text-emerald-400", intermediate: "text-sky-400", advanced: "text-amber-400", expert: "text-red-400" };
      return map[d] || "";
    }
    function statusLabel(s) {
      const map = { pending: "\u5F85\u5DE1\u67E5", in_progress: "\u8FDB\u884C\u4E2D", completed: "\u5DF2\u5B8C\u6210", archived: "\u5DF2\u5F52\u6863" };
      return map[s] || s;
    }
    function statusBadgeClass(s) {
      const map = { pending: "badge-pending", in_progress: "badge-progress", completed: "badge-completed", archived: "badge-archived" };
      return map[s] || "badge";
    }
    function levelLabel(l) {
      const map = { low: "\u4F4E", medium: "\u4E2D", high: "\u9AD8", critical: "\u4E25\u91CD" };
      return map[l] || l;
    }
    function levelBadgeClass(l) {
      const map = { low: "bg-sky-500/20 text-sky-400", medium: "bg-amber-500/20 text-amber-400", high: "bg-orange-500/20 text-orange-400", critical: "bg-red-500/20 text-red-400" };
      return map[l] || "";
    }
    function riskStatusLabel(s) {
      const map = { reported: "\u5DF2\u4E0A\u62A5", approved: "\u5DF2\u5BA1\u6279", rejected: "\u5DF2\u9000\u56DE", resubmitted: "\u5DF2\u91CD\u63D0", archived: "\u5DF2\u5F52\u6863" };
      return map[s] || s;
    }
    function riskStatusBadgeClass(s) {
      const map = { reported: "badge-reported", approved: "badge-approved", rejected: "badge-rejected", resubmitted: "badge-resubmitted", archived: "badge-archived" };
      return map[s] || "badge";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-8" }, _attrs))}><div class="flex items-center gap-3 mb-6"><button class="text-slate-400 hover:text-white transition-colors">`);
      _push(ssrRenderComponent(unref(ArrowLeft), { class: "w-5 h-5" }, null, _parent));
      _push(`</button><div><h1 class="text-2xl font-bold text-white">\u5DE1\u67E5\u8BE6\u60C5</h1><p class="text-slate-400 text-sm">${ssrInterpolate(unref(patrol).trailName)} \xB7 ${ssrInterpolate(unref(patrol).type === "daily" ? "\u65E5\u5E38\u5DE1\u67E5" : "\u4E13\u9879\u5DE1\u67E5")}</p></div><div class="ml-auto flex items-center gap-2"><span class="${ssrRenderClass(statusBadgeClass(unref(patrol).status))}">${ssrInterpolate(statusLabel(unref(patrol).status))}</span>`);
      if (unref(patrol).result === "normal") {
        _push(`<span class="badge-approved">\u6B63\u5E38</span>`);
      } else if (unref(patrol).result === "issue") {
        _push(`<span class="badge-reported">\u6709\u95EE\u9898</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      if (unref(loading)) {
        _push(`<div class="text-center py-12">`);
        _push(ssrRenderComponent(unref(Loader2), { class: "w-8 h-8 text-sky-400 animate-spin mx-auto" }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!--[--><div class="grid grid-cols-2 gap-6 mb-6"><div class="card"><h3 class="text-sm font-semibold text-slate-300 mb-3">\u57FA\u672C\u4FE1\u606F</h3><div class="space-y-2 text-sm"><div class="flex justify-between"><span class="text-slate-400">\u96EA\u9053</span><span class="text-white">${ssrInterpolate(unref(patrol).trailName)}</span></div><div class="flex justify-between"><span class="text-slate-400">\u96BE\u5EA6</span><span class="${ssrRenderClass(difficultyColor(unref(patrol).trailDifficulty))}">${ssrInterpolate(difficultyLabel(unref(patrol).trailDifficulty))}</span></div><div class="flex justify-between"><span class="text-slate-400">\u7C7B\u578B</span><span class="text-white">${ssrInterpolate(unref(patrol).type === "daily" ? "\u65E5\u5E38\u5DE1\u67E5" : "\u4E13\u9879\u5DE1\u67E5")}</span></div><div class="flex justify-between"><span class="text-slate-400">\u521B\u5EFA\u4EBA</span><span class="text-white">${ssrInterpolate(unref(patrol).creatorName)}</span></div><div class="flex justify-between"><span class="text-slate-400">\u521B\u5EFA\u65F6\u95F4</span><span class="text-white">${ssrInterpolate(unref(patrol).createdAt)}</span></div>`);
        if (unref(patrol).completedAt) {
          _push(`<div class="flex justify-between"><span class="text-slate-400">\u5B8C\u6210\u65F6\u95F4</span><span class="text-white">${ssrInterpolate(unref(patrol).completedAt)}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(patrol).conclusion) {
          _push(`<div class="flex justify-between"><span class="text-slate-400">\u5DE1\u67E5\u7ED3\u8BBA</span><span class="text-white">${ssrInterpolate(unref(patrol).conclusion)}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="card"><h3 class="text-sm font-semibold text-slate-300 mb-3">\u5173\u8054\u98CE\u9669</h3>`);
        if (unref(patrol).risks && unref(patrol).risks.length > 0) {
          _push(`<div class="space-y-2"><!--[-->`);
          ssrRenderList(unref(patrol).risks, (risk) => {
            _push(ssrRenderComponent(_component_NuxtLink, {
              key: risk.id,
              to: `/risks/${risk.id}`,
              class: "flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<span class="${ssrRenderClass([levelBadgeClass(risk.level), "badge"])}"${_scopeId}>${ssrInterpolate(levelLabel(risk.level))}</span><span class="text-sm text-white flex-1 truncate"${_scopeId}>${ssrInterpolate(risk.description)}</span><span class="${ssrRenderClass(riskStatusBadgeClass(risk.status))}"${_scopeId}>${ssrInterpolate(riskStatusLabel(risk.status))}</span>`);
                } else {
                  return [
                    createVNode("span", {
                      class: ["badge", levelBadgeClass(risk.level)]
                    }, toDisplayString(levelLabel(risk.level)), 3),
                    createVNode("span", { class: "text-sm text-white flex-1 truncate" }, toDisplayString(risk.description), 1),
                    createVNode("span", {
                      class: riskStatusBadgeClass(risk.status)
                    }, toDisplayString(riskStatusLabel(risk.status)), 3)
                  ];
                }
              }),
              _: 2
            }, _parent));
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<p class="text-slate-500 text-sm">\u6682\u65E0\u5173\u8054\u98CE\u9669</p>`);
        }
        _push(`</div></div>`);
        if (unref(patrol).status === "pending") {
          _push(`<div class="card mb-6"><div class="flex items-center justify-between"><div class="flex items-center gap-3">`);
          _push(ssrRenderComponent(unref(Clock), { class: "w-5 h-5 text-amber-400" }, null, _parent));
          _push(`<span class="text-white font-medium">\u5F85\u5F00\u59CB\u5DE1\u67E5</span></div><button${ssrIncludeBooleanAttr(unref(submitting)) ? " disabled" : ""} class="btn-primary">${ssrInterpolate(unref(submitting) ? "\u5904\u7406\u4E2D..." : "\u5F00\u59CB\u5DE1\u67E5")}</button></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(patrol).status === "in_progress") {
          _push(`<div class="card mb-6"><h3 class="text-sm font-semibold text-slate-300 mb-4">\u5904\u7406\u5DE1\u67E5</h3><div class="space-y-4"><div><label class="label-text">\u5DE1\u67E5\u7ED3\u8BBA</label><textarea rows="3" class="input-field w-full" placeholder="\u8BF7\u8F93\u5165\u5DE1\u67E5\u7ED3\u8BBA...">${ssrInterpolate(unref(conclusion))}</textarea></div><div><label class="label-text">\u5DE1\u67E5\u7ED3\u679C</label><div class="flex gap-3"><button class="${ssrRenderClass([unref(result) === "normal" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500", "flex-1 py-3 rounded-lg border text-sm font-medium transition-all"])}"> \u2713 \u6B63\u5E38 </button><button class="${ssrRenderClass([unref(result) === "issue" ? "bg-orange-500/20 border-orange-500/50 text-orange-400" : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500", "flex-1 py-3 rounded-lg border text-sm font-medium transition-all"])}"> \u26A0 \u6709\u95EE\u9898 </button></div></div><div class="flex gap-3"><button${ssrIncludeBooleanAttr(unref(submitting) || !unref(conclusion) || !unref(result)) ? " disabled" : ""} class="btn-primary flex-1 disabled:opacity-50">${ssrInterpolate(unref(submitting) ? "\u63D0\u4EA4\u4E2D..." : "\u63D0\u4EA4\u5DE1\u67E5\u7ED3\u679C")}</button>`);
          if (unref(result) === "issue") {
            _push(`<button${ssrIncludeBooleanAttr(unref(submitting) || !unref(conclusion)) ? " disabled" : ""} class="btn-danger flex-1 disabled:opacity-50"> \u63D0\u4EA4\u5E76\u4E0A\u62A5\u98CE\u9669 </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(patrol).status === "completed") {
          _push(`<div class="card mb-6"><div class="flex items-center justify-between"><div class="flex items-center gap-3">`);
          _push(ssrRenderComponent(unref(CheckCircle2), { class: "w-5 h-5 text-emerald-400" }, null, _parent));
          _push(`<span class="text-white font-medium">\u5DE1\u67E5\u5DF2\u5B8C\u6210</span></div><div class="flex gap-3">`);
          if (unref(patrol).result === "issue" && (!unref(patrol).risks || unref(patrol).risks.length === 0)) {
            _push(`<button class="btn-danger"> \u4E0A\u62A5\u98CE\u9669 </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<button class="btn-secondary">\u5F52\u6863</button></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="card"><h3 class="text-sm font-semibold text-slate-300 mb-4">\u64CD\u4F5C\u65E5\u5FD7</h3><div class="relative pl-6 space-y-4"><!--[-->`);
        ssrRenderList(unref(patrol).auditLogs, (log, i) => {
          _push(`<div class="relative"><div class="${ssrRenderClass([i === unref(patrol).auditLogs.length - 1 ? "bg-sky-400 border-sky-400" : "bg-slate-600 border-slate-600", "absolute -left-6 top-1 w-3 h-3 rounded-full border-2"])}"></div><div class="ml-4"><p class="text-sm text-white">${ssrInterpolate(log.action === "create" ? "\u521B\u5EFA\u5DE1\u67E5\u5355" : log.action === "start" ? "\u5F00\u59CB\u5DE1\u67E5" : log.action === "complete" ? "\u5B8C\u6210\u5DE1\u67E5" : log.action === "archive" ? "\u5F52\u6863" : log.action === "risk_reported" ? "\u5173\u8054\u98CE\u9669\u4E0A\u62A5" : log.action)}</p><p class="text-xs text-slate-400 mt-0.5">${ssrInterpolate(log.operatorName)} \xB7 ${ssrInterpolate(log.createdAt)}</p>`);
          if (log.detail) {
            _push(`<p class="text-xs text-slate-500 mt-1">${ssrInterpolate(log.detail)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]-->`);
        if (unref(patrol).auditLogs && unref(patrol).auditLogs.length === 0) {
          _push(`<div class="text-slate-500 text-sm ml-4">\u6682\u65E0\u64CD\u4F5C\u65E5\u5FD7</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><!--]-->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/patrols/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-CLGyvOiD.mjs.map
