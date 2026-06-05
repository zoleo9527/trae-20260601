import { _ as __nuxt_component_0 } from "./nuxt-link-COjNzfAG.js";
import { defineComponent, ref, mergeProps, unref, withCtx, createVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrIncludeBooleanAttr } from "vue/server-renderer";
import { ArrowLeft, Loader2, Clock, CheckCircle2 } from "lucide-vue-next";
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
    const patrol = ref({});
    const loading = ref(true);
    const submitting = ref(false);
    const conclusion = ref("");
    const result = ref("");
    function difficultyLabel(d) {
      const map = { beginner: "初级", intermediate: "中级", advanced: "高级", expert: "专家" };
      return map[d] || d;
    }
    function difficultyColor(d) {
      const map = { beginner: "text-emerald-400", intermediate: "text-sky-400", advanced: "text-amber-400", expert: "text-red-400" };
      return map[d] || "";
    }
    function statusLabel(s) {
      const map = { pending: "待巡查", in_progress: "进行中", completed: "已完成", archived: "已归档" };
      return map[s] || s;
    }
    function statusBadgeClass(s) {
      const map = { pending: "badge-pending", in_progress: "badge-progress", completed: "badge-completed", archived: "badge-archived" };
      return map[s] || "badge";
    }
    function levelLabel(l) {
      const map = { low: "低", medium: "中", high: "高", critical: "严重" };
      return map[l] || l;
    }
    function levelBadgeClass(l) {
      const map = { low: "bg-sky-500/20 text-sky-400", medium: "bg-amber-500/20 text-amber-400", high: "bg-orange-500/20 text-orange-400", critical: "bg-red-500/20 text-red-400" };
      return map[l] || "";
    }
    function riskStatusLabel(s) {
      const map = { reported: "已上报", approved: "已审批", rejected: "已退回", resubmitted: "已重提", archived: "已归档" };
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
      _push(`</button><div><h1 class="text-2xl font-bold text-white">巡查详情</h1><p class="text-slate-400 text-sm">${ssrInterpolate(unref(patrol).trailName)} · ${ssrInterpolate(unref(patrol).type === "daily" ? "日常巡查" : "专项巡查")}</p></div><div class="ml-auto flex items-center gap-2"><span class="${ssrRenderClass(statusBadgeClass(unref(patrol).status))}">${ssrInterpolate(statusLabel(unref(patrol).status))}</span>`);
      if (unref(patrol).result === "normal") {
        _push(`<span class="badge-approved">正常</span>`);
      } else if (unref(patrol).result === "issue") {
        _push(`<span class="badge-reported">有问题</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      if (unref(loading)) {
        _push(`<div class="text-center py-12">`);
        _push(ssrRenderComponent(unref(Loader2), { class: "w-8 h-8 text-sky-400 animate-spin mx-auto" }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!--[--><div class="grid grid-cols-2 gap-6 mb-6"><div class="card"><h3 class="text-sm font-semibold text-slate-300 mb-3">基本信息</h3><div class="space-y-2 text-sm"><div class="flex justify-between"><span class="text-slate-400">雪道</span><span class="text-white">${ssrInterpolate(unref(patrol).trailName)}</span></div><div class="flex justify-between"><span class="text-slate-400">难度</span><span class="${ssrRenderClass(difficultyColor(unref(patrol).trailDifficulty))}">${ssrInterpolate(difficultyLabel(unref(patrol).trailDifficulty))}</span></div><div class="flex justify-between"><span class="text-slate-400">类型</span><span class="text-white">${ssrInterpolate(unref(patrol).type === "daily" ? "日常巡查" : "专项巡查")}</span></div><div class="flex justify-between"><span class="text-slate-400">创建人</span><span class="text-white">${ssrInterpolate(unref(patrol).creatorName)}</span></div><div class="flex justify-between"><span class="text-slate-400">创建时间</span><span class="text-white">${ssrInterpolate(unref(patrol).createdAt)}</span></div>`);
        if (unref(patrol).completedAt) {
          _push(`<div class="flex justify-between"><span class="text-slate-400">完成时间</span><span class="text-white">${ssrInterpolate(unref(patrol).completedAt)}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(patrol).conclusion) {
          _push(`<div class="flex justify-between"><span class="text-slate-400">巡查结论</span><span class="text-white">${ssrInterpolate(unref(patrol).conclusion)}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="card"><h3 class="text-sm font-semibold text-slate-300 mb-3">关联风险</h3>`);
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
          _push(`<p class="text-slate-500 text-sm">暂无关联风险</p>`);
        }
        _push(`</div></div>`);
        if (unref(patrol).status === "pending") {
          _push(`<div class="card mb-6"><div class="flex items-center justify-between"><div class="flex items-center gap-3">`);
          _push(ssrRenderComponent(unref(Clock), { class: "w-5 h-5 text-amber-400" }, null, _parent));
          _push(`<span class="text-white font-medium">待开始巡查</span></div><button${ssrIncludeBooleanAttr(unref(submitting)) ? " disabled" : ""} class="btn-primary">${ssrInterpolate(unref(submitting) ? "处理中..." : "开始巡查")}</button></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(patrol).status === "in_progress") {
          _push(`<div class="card mb-6"><h3 class="text-sm font-semibold text-slate-300 mb-4">处理巡查</h3><div class="space-y-4"><div><label class="label-text">巡查结论</label><textarea rows="3" class="input-field w-full" placeholder="请输入巡查结论...">${ssrInterpolate(unref(conclusion))}</textarea></div><div><label class="label-text">巡查结果</label><div class="flex gap-3"><button class="${ssrRenderClass([unref(result) === "normal" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500", "flex-1 py-3 rounded-lg border text-sm font-medium transition-all"])}"> ✓ 正常 </button><button class="${ssrRenderClass([unref(result) === "issue" ? "bg-orange-500/20 border-orange-500/50 text-orange-400" : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500", "flex-1 py-3 rounded-lg border text-sm font-medium transition-all"])}"> ⚠ 有问题 </button></div></div><div class="flex gap-3"><button${ssrIncludeBooleanAttr(unref(submitting) || !unref(conclusion) || !unref(result)) ? " disabled" : ""} class="btn-primary flex-1 disabled:opacity-50">${ssrInterpolate(unref(submitting) ? "提交中..." : "提交巡查结果")}</button>`);
          if (unref(result) === "issue") {
            _push(`<button${ssrIncludeBooleanAttr(unref(submitting) || !unref(conclusion)) ? " disabled" : ""} class="btn-danger flex-1 disabled:opacity-50"> 提交并上报风险 </button>`);
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
          _push(`<span class="text-white font-medium">巡查已完成</span></div><div class="flex gap-3">`);
          if (unref(patrol).result === "issue" && (!unref(patrol).risks || unref(patrol).risks.length === 0)) {
            _push(`<button class="btn-danger"> 上报风险 </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<button class="btn-secondary">归档</button></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="card"><h3 class="text-sm font-semibold text-slate-300 mb-4">操作日志</h3><div class="relative pl-6 space-y-4"><!--[-->`);
        ssrRenderList(unref(patrol).auditLogs, (log, i) => {
          _push(`<div class="relative"><div class="${ssrRenderClass([i === unref(patrol).auditLogs.length - 1 ? "bg-sky-400 border-sky-400" : "bg-slate-600 border-slate-600", "absolute -left-6 top-1 w-3 h-3 rounded-full border-2"])}"></div><div class="ml-4"><p class="text-sm text-white">${ssrInterpolate(log.action === "create" ? "创建巡查单" : log.action === "start" ? "开始巡查" : log.action === "complete" ? "完成巡查" : log.action === "archive" ? "归档" : log.action === "risk_reported" ? "关联风险上报" : log.action)}</p><p class="text-xs text-slate-400 mt-0.5">${ssrInterpolate(log.operatorName)} · ${ssrInterpolate(log.createdAt)}</p>`);
          if (log.detail) {
            _push(`<p class="text-xs text-slate-500 mt-1">${ssrInterpolate(log.detail)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]-->`);
        if (unref(patrol).auditLogs && unref(patrol).auditLogs.length === 0) {
          _push(`<div class="text-slate-500 text-sm ml-4">暂无操作日志</div>`);
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
export {
  _sfc_main as default
};
//# sourceMappingURL=_id_-CLGyvOiD.js.map
