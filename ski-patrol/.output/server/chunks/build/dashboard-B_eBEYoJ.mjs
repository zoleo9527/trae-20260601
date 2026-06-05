import { _ as __nuxt_component_0 } from './nuxt-link-COjNzfAG.mjs';
import { defineComponent, ref, computed, mergeProps, unref, createVNode, resolveDynamicComponent, withCtx, openBlock, createBlock, toDisplayString, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderVNode, ssrRenderComponent } from 'vue/server-renderer';
import { Shield, AlertTriangle, CheckCircle2, FileWarning, MessageSquareOff, PlusCircle, ClipboardCheck, SendHorizonal, ChevronRight } from 'lucide-vue-next';
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
    const role = computed(() => {
      var _a;
      return ((_a = authStore.user) == null ? void 0 : _a.role) || "";
    });
    const patrolTodos = computed(() => todos.value.filter((t) => t.type === "patrol"));
    const riskTodos = computed(() => todos.value.filter((t) => t.type === "risk"));
    const resubmitTodos = computed(() => todos.value.filter((t) => t.type === "risk_resubmit"));
    const roleStatCards = computed(() => {
      if (role.value === "rental") {
        return [
          { label: "\u5F85\u5DE1\u67E5", value: patrolTodos.value.length, icon: Shield, iconBg: "bg-sky-500/20", iconColor: "text-sky-400" },
          { label: "\u5F85\u5BA1\u6279\u98CE\u9669", value: riskTodos.value.length, icon: AlertTriangle, iconBg: "bg-orange-500/20", iconColor: "text-orange-400" },
          { label: "\u4ECA\u65E5\u5DF2\u5B8C\u6210", value: completedToday.value, icon: CheckCircle2, iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" }
        ];
      } else if (role.value === "coach") {
        return [
          { label: "\u5F85\u5BA1\u6279", value: riskTodos.value.length, icon: AlertTriangle, iconBg: "bg-orange-500/20", iconColor: "text-orange-400" },
          { label: "\u5176\u4E2D\u7D27\u6025", value: riskTodos.value.filter((t) => t.urgency === "urgent" || t.urgency === "immediate").length, icon: FileWarning, iconBg: "bg-red-500/20", iconColor: "text-red-400" },
          { label: "\u4ECA\u65E5\u5DF2\u5BA1\u6279", value: completedToday.value, icon: CheckCircle2, iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" }
        ];
      } else {
        return [
          { label: "\u5F85\u5DE1\u67E5", value: patrolTodos.value.length, icon: Shield, iconBg: "bg-sky-500/20", iconColor: "text-sky-400" },
          { label: "\u5F85\u8865\u5145", value: resubmitTodos.value.length, icon: MessageSquareOff, iconBg: "bg-red-500/20", iconColor: "text-red-400" },
          { label: "\u4ECA\u65E5\u5DF2\u5B8C\u6210", value: completedToday.value, icon: CheckCircle2, iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" }
        ];
      }
    });
    const completedToday = ref(0);
    const quickActions = computed(() => {
      if (role.value === "rental") {
        return [
          { to: "/patrols/new", label: "\u521B\u5EFA\u5DE1\u67E5\u5355", description: "\u4E3A\u96EA\u9053\u521B\u5EFA\u65B0\u7684\u5DE1\u67E5\u4EFB\u52A1", icon: PlusCircle, iconColor: "text-sky-400", cardClass: "bg-sky-500/5 border-sky-500/20 hover:border-sky-500/50 hover:bg-sky-500/10" },
          { to: "/patrols", label: "\u5DE1\u67E5\u7BA1\u7406", description: "\u67E5\u770B\u6240\u6709\u5DE1\u67E5\u8BB0\u5F55", icon: ClipboardCheck, iconColor: "text-emerald-400", cardClass: "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/10" },
          { to: "/risks", label: "\u98CE\u9669\u8BB0\u5F55", description: "\u67E5\u770B\u6240\u6709\u98CE\u9669\u4E0A\u62A5", icon: AlertTriangle, iconColor: "text-orange-400", cardClass: "bg-orange-500/5 border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/10" }
        ];
      } else if (role.value === "coach") {
        return [
          { to: "/risks", label: "\u98CE\u9669\u5BA1\u6279", description: "\u5BA1\u6279\u5F85\u5904\u7406\u7684\u98CE\u9669\u4E0A\u62A5", icon: AlertTriangle, iconColor: "text-orange-400", cardClass: "bg-orange-500/5 border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/10" },
          { to: "/patrols", label: "\u5DE1\u67E5\u8BB0\u5F55", description: "\u67E5\u770B\u5DE1\u67E5\u6267\u884C\u60C5\u51B5", icon: ClipboardCheck, iconColor: "text-sky-400", cardClass: "bg-sky-500/5 border-sky-500/20 hover:border-sky-500/50 hover:bg-sky-500/10" },
          { to: "/settings", label: "\u7CFB\u7EDF\u7BA1\u7406", description: "\u6570\u636E\u91CD\u7F6E\u4E0E\u8D26\u53F7\u7BA1\u7406", icon: CheckCircle2, iconColor: "text-slate-400", cardClass: "bg-slate-500/5 border-slate-500/20 hover:border-slate-500/50 hover:bg-slate-500/10" }
        ];
      } else {
        return [
          { to: "/patrols", label: "\u6267\u884C\u5DE1\u67E5", description: "\u67E5\u770B\u5E76\u6267\u884C\u5DE1\u67E5\u4EFB\u52A1", icon: Shield, iconColor: "text-sky-400", cardClass: "bg-sky-500/5 border-sky-500/20 hover:border-sky-500/50 hover:bg-sky-500/10" },
          { to: "/risks", label: "\u98CE\u9669\u4E0A\u62A5", description: "\u4E0A\u62A5\u96EA\u9053\u98CE\u9669\u95EE\u9898", icon: AlertTriangle, iconColor: "text-orange-400", cardClass: "bg-orange-500/5 border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/10" },
          { to: "/risks", label: "\u8865\u5145\u5907\u6CE8", description: "\u5904\u7406\u88AB\u9000\u56DE\u7684\u98CE\u9669\u4E0A\u62A5", icon: SendHorizonal, iconColor: "text-purple-400", cardClass: "bg-purple-500/5 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10" }
        ];
      }
    });
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
    function urgencyLabel(u) {
      const map = { urgent: "\u7D27\u6025", immediate: "\u7ACB\u5373" };
      return map[u] || u;
    }
    function urgencyBadgeClass(u) {
      const map = { urgent: "bg-amber-500/20 text-amber-400", immediate: "bg-red-500/20 text-red-400" };
      return map[u] || "";
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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-8" }, _attrs))}><div class="mb-8"><h1 class="text-2xl font-bold text-white mb-1">\u5DE5\u4F5C\u53F0</h1><p class="text-slate-400 text-sm">${ssrInterpolate(unref(authStore).roleName)} \xB7 ${ssrInterpolate((_a = unref(authStore).user) == null ? void 0 : _a.name)}</p></div><div class="grid grid-cols-3 gap-4 mb-6"><!--[-->`);
      ssrRenderList(unref(roleStatCards), (card) => {
        _push(`<div class="card"><div class="flex items-center gap-3 mb-3"><div class="${ssrRenderClass([card.iconBg, "w-10 h-10 rounded-lg flex items-center justify-center"])}">`);
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(card.icon), {
          class: ["w-5 h-5", card.iconColor]
        }, null), _parent);
        _push(`</div><div><p class="text-xs text-slate-400">${ssrInterpolate(card.label)}</p><p class="text-2xl font-bold text-white tabular-nums">${ssrInterpolate(card.value)}</p></div></div></div>`);
      });
      _push(`<!--]--></div><div class="card mb-6"><h3 class="text-sm font-semibold text-slate-300 mb-4">\u5FEB\u6377\u64CD\u4F5C</h3><div class="grid grid-cols-3 gap-3"><!--[-->`);
      ssrRenderList(unref(quickActions), (action) => {
        _push(ssrRenderComponent(_component_NuxtLink, {
          key: action.to,
          to: action.to,
          class: ["flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 group", action.cardClass]
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(action.icon), {
                class: ["w-5 h-5 shrink-0", action.iconColor]
              }, null), _parent2, _scopeId);
              _push2(`<div class="flex-1 min-w-0"${_scopeId}><p class="text-sm font-medium text-white"${_scopeId}>${ssrInterpolate(action.label)}</p><p class="text-xs text-slate-400 truncate"${_scopeId}>${ssrInterpolate(action.description)}</p></div>`);
              _push2(ssrRenderComponent(unref(ChevronRight), { class: "w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" }, null, _parent2, _scopeId));
            } else {
              return [
                (openBlock(), createBlock(resolveDynamicComponent(action.icon), {
                  class: ["w-5 h-5 shrink-0", action.iconColor]
                }, null, 8, ["class"])),
                createVNode("div", { class: "flex-1 min-w-0" }, [
                  createVNode("p", { class: "text-sm font-medium text-white" }, toDisplayString(action.label), 1),
                  createVNode("p", { class: "text-xs text-slate-400 truncate" }, toDisplayString(action.description), 1)
                ]),
                createVNode(unref(ChevronRight), { class: "w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" })
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></div></div><div class="card"><div class="flex items-center justify-between mb-4"><h2 class="text-lg font-semibold text-white">\u5F85\u529E\u4E8B\u9879</h2><span class="badge-progress">${ssrInterpolate(unref(todos).length)} \u9879</span></div>`);
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
            class: "flex items-start gap-4 p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all duration-200 group"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="${ssrRenderClass([todo.type === "risk" || todo.type === "risk_resubmit" ? "bg-orange-400" : "bg-sky-400", "w-2 h-2 rounded-full shrink-0 mt-1.5"])}"${_scopeId}></div><div class="flex-1 min-w-0"${_scopeId}><div class="flex items-center gap-2 mb-1"${_scopeId}><p class="text-sm font-medium text-white truncate"${_scopeId}>${ssrInterpolate(todo.title)}</p></div>`);
                if (todo.type === "risk" && todo.description) {
                  _push2(`<p class="text-xs text-slate-400 truncate mb-1"${_scopeId}>${ssrInterpolate(todo.description)}</p>`);
                } else {
                  _push2(`<!---->`);
                }
                if (todo.type === "risk_resubmit" && todo.rejectReason) {
                  _push2(`<p class="text-xs text-red-400/70 truncate mb-1"${_scopeId}> \u9000\u56DE\u539F\u56E0\uFF1A${ssrInterpolate(todo.rejectReason)}</p>`);
                } else {
                  _push2(`<!---->`);
                }
                if (todo.type === "risk" && todo.supplementNote) {
                  _push2(`<p class="text-xs text-purple-400/70 truncate mb-1"${_scopeId}> \u8865\u5145\uFF1A${ssrInterpolate(todo.supplementNote)}</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<p class="text-xs text-slate-500"${_scopeId}>${ssrInterpolate(todo.createdAt)}</p></div><div class="flex items-center gap-2 shrink-0 pt-0.5"${_scopeId}>`);
                if (todo.urgency && todo.urgency !== "normal") {
                  _push2(`<span class="${ssrRenderClass([urgencyBadgeClass(todo.urgency), "badge"])}"${_scopeId}>${ssrInterpolate(urgencyLabel(todo.urgency))}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                if (todo.level) {
                  _push2(`<span class="${ssrRenderClass([levelBadgeClass(todo.level), "badge"])}"${_scopeId}>${ssrInterpolate(levelLabel(todo.level))}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<span class="${ssrRenderClass(statusBadgeClass(todo.status))}"${_scopeId}>${ssrInterpolate(statusLabel(todo.status))}</span></div>`);
                _push2(ssrRenderComponent(unref(ChevronRight), { class: "w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0 mt-1" }, null, _parent2, _scopeId));
              } else {
                return [
                  createVNode("div", {
                    class: ["w-2 h-2 rounded-full shrink-0 mt-1.5", todo.type === "risk" || todo.type === "risk_resubmit" ? "bg-orange-400" : "bg-sky-400"]
                  }, null, 2),
                  createVNode("div", { class: "flex-1 min-w-0" }, [
                    createVNode("div", { class: "flex items-center gap-2 mb-1" }, [
                      createVNode("p", { class: "text-sm font-medium text-white truncate" }, toDisplayString(todo.title), 1)
                    ]),
                    todo.type === "risk" && todo.description ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "text-xs text-slate-400 truncate mb-1"
                    }, toDisplayString(todo.description), 1)) : createCommentVNode("", true),
                    todo.type === "risk_resubmit" && todo.rejectReason ? (openBlock(), createBlock("p", {
                      key: 1,
                      class: "text-xs text-red-400/70 truncate mb-1"
                    }, " \u9000\u56DE\u539F\u56E0\uFF1A" + toDisplayString(todo.rejectReason), 1)) : createCommentVNode("", true),
                    todo.type === "risk" && todo.supplementNote ? (openBlock(), createBlock("p", {
                      key: 2,
                      class: "text-xs text-purple-400/70 truncate mb-1"
                    }, " \u8865\u5145\uFF1A" + toDisplayString(todo.supplementNote), 1)) : createCommentVNode("", true),
                    createVNode("p", { class: "text-xs text-slate-500" }, toDisplayString(todo.createdAt), 1)
                  ]),
                  createVNode("div", { class: "flex items-center gap-2 shrink-0 pt-0.5" }, [
                    todo.urgency && todo.urgency !== "normal" ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: ["badge", urgencyBadgeClass(todo.urgency)]
                    }, toDisplayString(urgencyLabel(todo.urgency)), 3)) : createCommentVNode("", true),
                    todo.level ? (openBlock(), createBlock("span", {
                      key: 1,
                      class: ["badge", levelBadgeClass(todo.level)]
                    }, toDisplayString(levelLabel(todo.level)), 3)) : createCommentVNode("", true),
                    createVNode("span", {
                      class: statusBadgeClass(todo.status)
                    }, toDisplayString(statusLabel(todo.status)), 3)
                  ]),
                  createVNode(unref(ChevronRight), { class: "w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0 mt-1" })
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
//# sourceMappingURL=dashboard-B_eBEYoJ.mjs.map
