import { _ as __nuxt_component_0 } from "./nuxt-link-COjNzfAG.js";
import { defineComponent, ref, computed, mergeProps, unref, createVNode, resolveDynamicComponent, withCtx, openBlock, createBlock, toDisplayString, createCommentVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderVNode, ssrRenderComponent } from "vue/server-renderer";
import { Shield, AlertTriangle, CheckCircle2, FileWarning, MessageSquareOff, PlusCircle, ClipboardCheck, SendHorizonal, ChevronRight } from "lucide-vue-next";
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
    const role = computed(() => authStore.user?.role || "");
    const patrolTodos = computed(() => todos.value.filter((t) => t.type === "patrol"));
    const riskTodos = computed(() => todos.value.filter((t) => t.type === "risk"));
    const resubmitTodos = computed(() => todos.value.filter((t) => t.type === "risk_resubmit"));
    const roleStatCards = computed(() => {
      if (role.value === "rental") {
        return [
          { label: "待巡查", value: patrolTodos.value.length, icon: Shield, iconBg: "bg-sky-500/20", iconColor: "text-sky-400" },
          { label: "待审批风险", value: riskTodos.value.length, icon: AlertTriangle, iconBg: "bg-orange-500/20", iconColor: "text-orange-400" },
          { label: "今日已完成", value: completedToday.value, icon: CheckCircle2, iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" }
        ];
      } else if (role.value === "coach") {
        return [
          { label: "待审批", value: riskTodos.value.length, icon: AlertTriangle, iconBg: "bg-orange-500/20", iconColor: "text-orange-400" },
          { label: "其中紧急", value: riskTodos.value.filter((t) => t.urgency === "urgent" || t.urgency === "immediate").length, icon: FileWarning, iconBg: "bg-red-500/20", iconColor: "text-red-400" },
          { label: "今日已审批", value: completedToday.value, icon: CheckCircle2, iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" }
        ];
      } else {
        return [
          { label: "待巡查", value: patrolTodos.value.length, icon: Shield, iconBg: "bg-sky-500/20", iconColor: "text-sky-400" },
          { label: "待补充", value: resubmitTodos.value.length, icon: MessageSquareOff, iconBg: "bg-red-500/20", iconColor: "text-red-400" },
          { label: "今日已完成", value: completedToday.value, icon: CheckCircle2, iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" }
        ];
      }
    });
    const completedToday = ref(0);
    const quickActions = computed(() => {
      if (role.value === "rental") {
        return [
          { to: "/patrols/new", label: "创建巡查单", description: "为雪道创建新的巡查任务", icon: PlusCircle, iconColor: "text-sky-400", cardClass: "bg-sky-500/5 border-sky-500/20 hover:border-sky-500/50 hover:bg-sky-500/10" },
          { to: "/patrols", label: "巡查管理", description: "查看所有巡查记录", icon: ClipboardCheck, iconColor: "text-emerald-400", cardClass: "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/10" },
          { to: "/risks", label: "风险记录", description: "查看所有风险上报", icon: AlertTriangle, iconColor: "text-orange-400", cardClass: "bg-orange-500/5 border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/10" }
        ];
      } else if (role.value === "coach") {
        return [
          { to: "/risks", label: "风险审批", description: "审批待处理的风险上报", icon: AlertTriangle, iconColor: "text-orange-400", cardClass: "bg-orange-500/5 border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/10" },
          { to: "/patrols", label: "巡查记录", description: "查看巡查执行情况", icon: ClipboardCheck, iconColor: "text-sky-400", cardClass: "bg-sky-500/5 border-sky-500/20 hover:border-sky-500/50 hover:bg-sky-500/10" },
          { to: "/settings", label: "系统管理", description: "数据重置与账号管理", icon: CheckCircle2, iconColor: "text-slate-400", cardClass: "bg-slate-500/5 border-slate-500/20 hover:border-slate-500/50 hover:bg-slate-500/10" }
        ];
      } else {
        return [
          { to: "/patrols", label: "执行巡查", description: "查看并执行巡查任务", icon: Shield, iconColor: "text-sky-400", cardClass: "bg-sky-500/5 border-sky-500/20 hover:border-sky-500/50 hover:bg-sky-500/10" },
          { to: "/risks", label: "风险上报", description: "上报雪道风险问题", icon: AlertTriangle, iconColor: "text-orange-400", cardClass: "bg-orange-500/5 border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/10" },
          { to: "/risks", label: "补充备注", description: "处理被退回的风险上报", icon: SendHorizonal, iconColor: "text-purple-400", cardClass: "bg-purple-500/5 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10" }
        ];
      }
    });
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
    function urgencyLabel(u) {
      const map = { urgent: "紧急", immediate: "立即" };
      return map[u] || u;
    }
    function urgencyBadgeClass(u) {
      const map = { urgent: "bg-amber-500/20 text-amber-400", immediate: "bg-red-500/20 text-red-400" };
      return map[u] || "";
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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-8" }, _attrs))}><div class="mb-8"><h1 class="text-2xl font-bold text-white mb-1">工作台</h1><p class="text-slate-400 text-sm">${ssrInterpolate(unref(authStore).roleName)} · ${ssrInterpolate(unref(authStore).user?.name)}</p></div><div class="grid grid-cols-3 gap-4 mb-6"><!--[-->`);
      ssrRenderList(unref(roleStatCards), (card) => {
        _push(`<div class="card"><div class="flex items-center gap-3 mb-3"><div class="${ssrRenderClass([card.iconBg, "w-10 h-10 rounded-lg flex items-center justify-center"])}">`);
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(card.icon), {
          class: ["w-5 h-5", card.iconColor]
        }, null), _parent);
        _push(`</div><div><p class="text-xs text-slate-400">${ssrInterpolate(card.label)}</p><p class="text-2xl font-bold text-white tabular-nums">${ssrInterpolate(card.value)}</p></div></div></div>`);
      });
      _push(`<!--]--></div><div class="card mb-6"><h3 class="text-sm font-semibold text-slate-300 mb-4">快捷操作</h3><div class="grid grid-cols-3 gap-3"><!--[-->`);
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
      _push(`<!--]--></div></div><div class="card"><div class="flex items-center justify-between mb-4"><h2 class="text-lg font-semibold text-white">待办事项</h2><span class="badge-progress">${ssrInterpolate(unref(todos).length)} 项</span></div>`);
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
                  _push2(`<p class="text-xs text-red-400/70 truncate mb-1"${_scopeId}> 退回原因：${ssrInterpolate(todo.rejectReason)}</p>`);
                } else {
                  _push2(`<!---->`);
                }
                if (todo.type === "risk" && todo.supplementNote) {
                  _push2(`<p class="text-xs text-purple-400/70 truncate mb-1"${_scopeId}> 补充：${ssrInterpolate(todo.supplementNote)}</p>`);
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
                    }, " 退回原因：" + toDisplayString(todo.rejectReason), 1)) : createCommentVNode("", true),
                    todo.type === "risk" && todo.supplementNote ? (openBlock(), createBlock("p", {
                      key: 2,
                      class: "text-xs text-purple-400/70 truncate mb-1"
                    }, " 补充：" + toDisplayString(todo.supplementNote), 1)) : createCommentVNode("", true),
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
export {
  _sfc_main as default
};
//# sourceMappingURL=dashboard-B_eBEYoJ.js.map
