import { _ as __nuxt_component_0 } from "./nuxt-link-COjNzfAG.js";
import { defineComponent, ref, mergeProps, unref, withCtx, createVNode, toDisplayString, openBlock, createBlock, createCommentVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderClass } from "vue/server-renderer";
import { Shield, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-vue-next";
import { u as useAuthStore } from "../server.mjs";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/hookable/dist/index.mjs";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/ufo/dist/index.mjs";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/defu/dist/defu.mjs";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/unctx/dist/index.mjs";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/h3/dist/index.mjs";
import "pinia";
import "vue-router";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/klona/dist/index.mjs";
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
      const map = { low: "低", medium: "中", high: "高", critical: "严重" };
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
        pending: "待巡查",
        in_progress: "进行中",
        completed: "已完成",
        archived: "已归档",
        reported: "已上报",
        approved: "已审批",
        rejected: "已退回",
        resubmitted: "已重提"
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
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-8" }, _attrs))}><div class="mb-8"><h1 class="text-2xl font-bold text-white mb-1">工作台</h1><p class="text-slate-400 text-sm">${ssrInterpolate(unref(authStore).roleName)} · ${ssrInterpolate(unref(authStore).user?.name)}</p></div><div class="grid grid-cols-3 gap-4 mb-8"><div class="card"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">`);
      _push(ssrRenderComponent(unref(Shield), { class: "w-5 h-5 text-sky-400" }, null, _parent));
      _push(`</div><div><p class="text-xs text-slate-400">待处理巡查</p><p class="text-2xl font-bold text-white tabular-nums">${ssrInterpolate(unref(stats).pendingPatrols)}</p></div></div></div><div class="card"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">`);
      _push(ssrRenderComponent(unref(AlertTriangle), { class: "w-5 h-5 text-orange-400" }, null, _parent));
      _push(`</div><div><p class="text-xs text-slate-400">待处理风险</p><p class="text-2xl font-bold text-white tabular-nums">${ssrInterpolate(unref(stats).pendingRisks)}</p></div></div></div><div class="card"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">`);
      _push(ssrRenderComponent(unref(CheckCircle2), { class: "w-5 h-5 text-emerald-400" }, null, _parent));
      _push(`</div><div><p class="text-xs text-slate-400">已完成今日</p><p class="text-2xl font-bold text-white tabular-nums">${ssrInterpolate(unref(stats).completedToday)}</p></div></div></div></div><div class="card"><div class="flex items-center justify-between mb-4"><h2 class="text-lg font-semibold text-white">待办事项</h2><span class="badge-progress">${ssrInterpolate(unref(todos).length)} 项</span></div>`);
      if (unref(todos).length === 0) {
        _push(`<div class="text-center py-12">`);
        _push(ssrRenderComponent(unref(CheckCircle2), { class: "w-12 h-12 text-emerald-500/30 mx-auto mb-3" }, null, _parent));
        _push(`<p class="text-slate-400">暂无待办事项</p></div>`);
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
export {
  _sfc_main as default
};
//# sourceMappingURL=dashboard-CBORKOLw.js.map
