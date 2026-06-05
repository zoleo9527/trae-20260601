import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrRenderClass } from "vue/server-renderer";
import { ArrowLeft } from "lucide-vue-next";
import { a as useRoute } from "../server.mjs";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/hookable/dist/index.mjs";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/unctx/dist/index.mjs";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/h3/dist/index.mjs";
import "pinia";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/defu/dist/defu.mjs";
import "vue-router";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/ufo/dist/index.mjs";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/klona/dist/index.mjs";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "new",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const patrols = ref([]);
    const submitting = ref(false);
    const form = ref({
      patrolId: route.query.patrolId ? String(route.query.patrolId) : "",
      level: "",
      urgency: "normal",
      description: ""
    });
    const levels = [
      { value: "low", label: "低", activeClass: "bg-sky-500/20 border-sky-500/50 text-sky-400" },
      { value: "medium", label: "中", activeClass: "bg-amber-500/20 border-amber-500/50 text-amber-400" },
      { value: "high", label: "高", activeClass: "bg-orange-500/20 border-orange-500/50 text-orange-400" },
      { value: "critical", label: "严重", activeClass: "bg-red-500/20 border-red-500/50 text-red-400" }
    ];
    const urgencies = [
      { value: "normal", label: "常规", activeClass: "bg-slate-600 border-slate-500 text-white" },
      { value: "urgent", label: "紧急", activeClass: "bg-amber-500/20 border-amber-500/50 text-amber-400" },
      { value: "immediate", label: "立即", activeClass: "bg-red-500/20 border-red-500/50 text-red-400" }
    ];
    const eligiblePatrols = computed(() => {
      return patrols.value.filter((p) => {
        if (p.status === "completed" && p.result === "issue") return true;
        if (form.value.patrolId && String(p.id) === String(form.value.patrolId) && p.status === "completed") return true;
        return false;
      });
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-8" }, _attrs))}><div class="flex items-center gap-3 mb-6"><button class="text-slate-400 hover:text-white transition-colors">`);
      _push(ssrRenderComponent(unref(ArrowLeft), { class: "w-5 h-5" }, null, _parent));
      _push(`</button><div><h1 class="text-2xl font-bold text-white">新建风险上报</h1><p class="text-slate-400 text-sm">关联巡查单并上报风险</p></div></div><div class="max-w-lg"><div class="card"><div class="space-y-5"><div><label class="label-text">关联巡查单</label><select class="input-field w-full"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).patrolId) ? ssrLooseContain(unref(form).patrolId, "") : ssrLooseEqual(unref(form).patrolId, "")) ? " selected" : ""}>请选择巡查单</option><!--[-->`);
      ssrRenderList(unref(eligiblePatrols), (p) => {
        _push(`<option${ssrRenderAttr("value", p.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).patrolId) ? ssrLooseContain(unref(form).patrolId, p.id) : ssrLooseEqual(unref(form).patrolId, p.id)) ? " selected" : ""}> #${ssrInterpolate(p.id)} ${ssrInterpolate(p.trailName)} - ${ssrInterpolate(p.type === "daily" ? "日常" : "专项")}</option>`);
      });
      _push(`<!--]--></select></div><div><label class="label-text">风险等级</label><div class="grid grid-cols-4 gap-2"><!--[-->`);
      ssrRenderList(levels, (lv) => {
        _push(`<button class="${ssrRenderClass([unref(form).level === lv.value ? lv.activeClass : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500", "py-3 rounded-lg border text-sm font-medium transition-all"])}">${ssrInterpolate(lv.label)}</button>`);
      });
      _push(`<!--]--></div></div><div><label class="label-text">紧急程度</label><div class="flex gap-3"><!--[-->`);
      ssrRenderList(urgencies, (ug) => {
        _push(`<button class="${ssrRenderClass([unref(form).urgency === ug.value ? ug.activeClass : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500", "flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all"])}">${ssrInterpolate(ug.label)}</button>`);
      });
      _push(`<!--]--></div></div><div><label class="label-text">风险描述</label><textarea rows="4" class="input-field w-full" placeholder="请详细描述发现的风险情况...">${ssrInterpolate(unref(form).description)}</textarea></div><button${ssrIncludeBooleanAttr(unref(submitting) || !unref(form).patrolId || !unref(form).level || !unref(form).description) ? " disabled" : ""} class="btn-danger w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">${ssrInterpolate(unref(submitting) ? "提交中..." : "上报风险")}</button></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/risks/new.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=new-ZDPexSeV.js.map
