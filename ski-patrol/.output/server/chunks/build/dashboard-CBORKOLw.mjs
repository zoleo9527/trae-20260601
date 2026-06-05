import { _ as __nuxt_component_0 } from './nuxt-link-COjNzfAG.mjs';
import { defineComponent, ref, mergeProps, unref, withCtx, createVNode, toDisplayString, openBlock, createBlock, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';
import { Shield, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-vue-next';
import { u as useAuthStore } from './server.mjs';
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
  __name: "dashboard",
  __ssrInlineRender: true,
  setup(__props) {
    const authStore = useAuthStore();
    const todos = ref([]);
    const stats = ref({ pendingPatrols: 0, pendingRisks: 0, completedToday: 0 });
    function todoLink(todo) {
      if (todo.type === "patrol") return `/patrols/${todo.entityId}`;
      if (todo.type === "risk" || todo.type === "risk_resubmit") return `/risks/${todo.entityId}`;
      return "/dashboard";
    }
    function levelLabel(level) {
      const map = { low: "\u4F4E", medium: "\u4E2D", high: "\u9AD8", critical: "\u4E25\u91CD" };
      return map[level] || level;
    }
    function levelBadgeClass(level) {
      const map = {
        low: "bg-sky-500/20 text-sky-400",
        medium: "bg-amber-500/20 text-amber-400",
        high: "bg-orange-500/20 text-orange-400",
        critical: "bg-red-500/20 text-red-400"
      };
      return map[level] || "";
    }
    function statusLabel(status) {
      const map = {
        pending: "\u5F85\u5DE1\u67E5",
        in_progress: "\u8FDB\u884C\u4E2D",
        completed: "\u5DF2\u5B8C\u6210",
        archived: "\u5DF2\u5F52\u6863",
        reported: "\u5DF2\u4E0A\u62A5",
        approved: "\u5DF2\u5BA1\u6279",
        rejected: "\u5DF2\u9000\u56DE",
        resubmitted: "\u5DF2\u91CD\u63D0"
      };
      return map[status] || status;
    }
    function statusBadgeClass(status) {
      const map = {
        pending: "badge-pending",
        in_progress: "badge-progress",
        completed: "badge-completed",
        archived: "badge-archived",
        reported: "badge-reported",
        approved: "badge-approved",
        rejected: "badge-rejected",
        resubmitted: "badge-resubmitted"
      };
      return map[status] || "badge";
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-8" }, _attrs))}><div class="mb-8"><h1 class="text-2xl font-bold text-white mb-1">\u5DE5\u4F5C\u53F0</h1><p class="text-slate-400 text-sm">${ssrInterpolate(unref(authStore).roleName)} \xB7 ${ssrInterpolate((_a = unref(authStore).user) == null ? void 0 : _a.name)}</p></div><div class="grid grid-cols-3 gap-4 mb-8"><div class="card"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">`);
      _push(ssrRenderComponent(unref(Shield), { class: "w-5 h-5 text-sky-400" }, null, _parent));
      _push(`</div><div><p class="text-xs text-slate-400">\u5F85\u5904\u7406\u5DE1\u67E5</p><p class="text-2xl font-bold text-white tabular-nums">${ssrInterpolate(unref(stats).pendingPatrols)}</p></div></div></div><div class="card"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">`);
      _push(ssrRenderComponent(unref(AlertTriangle), { class: "w-5 h-5 text-orange-400" }, null, _parent));
      _push(`</div><div><p class="text-xs text-slate-400">\u5F85\u5904\u7406\u98CE\u9669</p><p class="text-2xl font-bold text-white tabular-nums">${ssrInterpolate(unref(stats).pendingRisks)}</p></div></div></div><div class="card"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">`);
      _push(ssrRenderComponent(unref(CheckCircle2), { class: "w-5 h-5 text-emerald-400" }, null, _parent));
      _push(`</div><div><p class="text-xs text-slate-400">\u5DF2\u5B8C\u6210\u4ECA\u65E5</p><p class="text-2xl font-bold text-white tabular-nums">${ssrInterpolate(unref(stats).completedToday)}</p></div></div></div></div><div class="card"><div class="flex items-center justify-between mb-4"><h2 class="text-lg font-semibold text-white">\u5F85\u529E\u4E8B\u9879</h2><span class="badge-progress">${ssrInterpolate(unref(todos).length)} \u9879</span></div>`);
      if (unref(todos).length === 0) {
        _push(`<div class="text-center py-12">`);
        _push(ssrRenderComponent(unref(CheckCircle2), { class: "w-12 h-12 text-emerald-500/30 mx-auto mb-3" }, null, _parent));
        _push(`<p class="text-slate-400">\u6682\u65E0\u5F85\u529E\u4E8B\u9879</p></div>`);
      } else {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(unref(todos), (todo) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: todo.id,
            to: todoLink(todo),
            class: "flex items-center gap-4 p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all duration-200 group"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="${ssrRenderClass([todo.type === "risk" || todo.type === "risk_resubmit" ? "bg-orange-400" : "bg-sky-400", "w-2 h-2 rounded-full shrink-0"])}"${_scopeId}></div><div class="flex-1 min-w-0"${_scopeId}><p class="text-sm font-medium text-white truncate"${_scopeId}>${ssrInterpolate(todo.title)}</p><p class="text-xs text-slate-400"${_scopeId}>${ssrInterpolate(todo.createdAt)}</p></div><div class="flex items-center gap-2"${_scopeId}>`);
                if (todo.level) {
                  _push2(`<span class="${ssrRenderClass([levelBadgeClass(todo.level), "badge"])}"${_scopeId}>${ssrInterpolate(levelLabel(todo.level))}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<span class="${ssrRenderClass(statusBadgeClass(todo.status))}"${_scopeId}>${ssrInterpolate(statusLabel(todo.status))}</span></div>`);
                _push2(ssrRenderComponent(unref(ChevronRight), { class: "w-4 h-4 text-slate-500 group-hover:text-white transition-colors" }, null, _parent2, _scopeId));
              } else {
                return [
                  createVNode("div", {
                    class: ["w-2 h-2 rounded-full shrink-0", todo.type === "risk" || todo.type === "risk_resubmit" ? "bg-orange-400" : "bg-sky-400"]
                  }, null, 2),
                  createVNode("div", { class: "flex-1 min-w-0" }, [
                    createVNode("p", { class: "text-sm font-medium text-white truncate" }, toDisplayString(todo.title), 1),
                    createVNode("p", { class: "text-xs text-slate-400" }, toDisplayString(todo.createdAt), 1)
                  ]),
                  createVNode("div", { class: "flex items-center gap-2" }, [
                    todo.level ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: ["badge", levelBadgeClass(todo.level)]
                    }, toDisplayString(levelLabel(todo.level)), 3)) : createCommentVNode("", true),
                    createVNode("span", {
                      class: statusBadgeClass(todo.status)
                    }, toDisplayString(statusLabel(todo.status)), 3)
                  ]),
                  createVNode(unref(ChevronRight), { class: "w-4 h-4 text-slate-500 group-hover:text-white transition-colors" })
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/dashboard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=dashboard-CBORKOLw.mjs.map
