import { defineComponent, ref, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrRenderClass } from "vue/server-renderer";
import { ArrowLeft } from "lucide-vue-next";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/hookable/dist/index.mjs";
import "../server.mjs";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
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
    const trails = ref([]);
    const submitting = ref(false);
    const form = ref({ trailId: "", type: "daily" });
    function difficultyLabel(d) {
      const map = { beginner: "初级", intermediate: "中级", advanced: "高级", expert: "专家" };
      return map[d] || d;
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-8" }, _attrs))}><div class="flex items-center gap-3 mb-6"><button class="text-slate-400 hover:text-white transition-colors">`);
      _push(ssrRenderComponent(unref(ArrowLeft), { class: "w-5 h-5" }, null, _parent));
      _push(`</button><div><h1 class="text-2xl font-bold text-white">新建巡查</h1><p class="text-slate-400 text-sm">选择雪道并创建巡查单</p></div></div><div class="max-w-lg"><div class="card"><div class="space-y-5"><div><label class="label-text">选择雪道</label><select class="input-field w-full"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).trailId) ? ssrLooseContain(unref(form).trailId, "") : ssrLooseEqual(unref(form).trailId, "")) ? " selected" : ""}>请选择雪道</option><!--[-->`);
      ssrRenderList(unref(trails), (trail) => {
        _push(`<option${ssrRenderAttr("value", trail.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).trailId) ? ssrLooseContain(unref(form).trailId, trail.id) : ssrLooseEqual(unref(form).trailId, trail.id)) ? " selected" : ""}>${ssrInterpolate(trail.name)} (${ssrInterpolate(difficultyLabel(trail.difficulty))}) </option>`);
      });
      _push(`<!--]--></select></div><div><label class="label-text">巡查类型</label><div class="flex gap-3"><button class="${ssrRenderClass([unref(form).type === "daily" ? "bg-sky-500/20 border-sky-500/50 text-sky-400" : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500", "flex-1 py-3 rounded-lg border text-sm font-medium transition-all"])}"> 日常巡查 </button><button class="${ssrRenderClass([unref(form).type === "special" ? "bg-orange-500/20 border-orange-500/50 text-orange-400" : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500", "flex-1 py-3 rounded-lg border text-sm font-medium transition-all"])}"> 专项巡查 </button></div></div><button${ssrIncludeBooleanAttr(unref(submitting) || !unref(form).trailId) ? " disabled" : ""} class="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">${ssrInterpolate(unref(submitting) ? "创建中..." : "创建巡查单")}</button></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/patrols/new.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=new-eEH_QDAV.js.map
