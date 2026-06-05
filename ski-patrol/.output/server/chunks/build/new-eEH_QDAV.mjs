import { defineComponent, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrRenderClass } from 'vue/server-renderer';
import { ArrowLeft } from 'lucide-vue-next';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "new",
  __ssrInlineRender: true,
  setup(__props) {
    const trails = ref([]);
    const submitting = ref(false);
    const form = ref({ trailId: "", type: "daily" });
    function difficultyLabel(d) {
      const map = { beginner: "\u521D\u7EA7", intermediate: "\u4E2D\u7EA7", advanced: "\u9AD8\u7EA7", expert: "\u4E13\u5BB6" };
      return map[d] || d;
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-8" }, _attrs))}><div class="flex items-center gap-3 mb-6"><button class="text-slate-400 hover:text-white transition-colors">`);
      _push(ssrRenderComponent(unref(ArrowLeft), { class: "w-5 h-5" }, null, _parent));
      _push(`</button><div><h1 class="text-2xl font-bold text-white">\u65B0\u5EFA\u5DE1\u67E5</h1><p class="text-slate-400 text-sm">\u9009\u62E9\u96EA\u9053\u5E76\u521B\u5EFA\u5DE1\u67E5\u5355</p></div></div><div class="max-w-lg"><div class="card"><div class="space-y-5"><div><label class="label-text">\u9009\u62E9\u96EA\u9053</label><select class="input-field w-full"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).trailId) ? ssrLooseContain(unref(form).trailId, "") : ssrLooseEqual(unref(form).trailId, "")) ? " selected" : ""}>\u8BF7\u9009\u62E9\u96EA\u9053</option><!--[-->`);
      ssrRenderList(unref(trails), (trail) => {
        _push(`<option${ssrRenderAttr("value", trail.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).trailId) ? ssrLooseContain(unref(form).trailId, trail.id) : ssrLooseEqual(unref(form).trailId, trail.id)) ? " selected" : ""}>${ssrInterpolate(trail.name)} (${ssrInterpolate(difficultyLabel(trail.difficulty))}) </option>`);
      });
      _push(`<!--]--></select></div><div><label class="label-text">\u5DE1\u67E5\u7C7B\u578B</label><div class="flex gap-3"><button class="${ssrRenderClass([unref(form).type === "daily" ? "bg-sky-500/20 border-sky-500/50 text-sky-400" : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500", "flex-1 py-3 rounded-lg border text-sm font-medium transition-all"])}"> \u65E5\u5E38\u5DE1\u67E5 </button><button class="${ssrRenderClass([unref(form).type === "special" ? "bg-orange-500/20 border-orange-500/50 text-orange-400" : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500", "flex-1 py-3 rounded-lg border text-sm font-medium transition-all"])}"> \u4E13\u9879\u5DE1\u67E5 </button></div></div><button${ssrIncludeBooleanAttr(unref(submitting) || !unref(form).trailId) ? " disabled" : ""} class="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">${ssrInterpolate(unref(submitting) ? "\u521B\u5EFA\u4E2D..." : "\u521B\u5EFA\u5DE1\u67E5\u5355")}</button></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/patrols/new.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=new-eEH_QDAV.mjs.map
