import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrRenderClass } from 'vue/server-renderer';
import { ArrowLeft } from 'lucide-vue-next';
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
      { value: "low", label: "\u4F4E", activeClass: "bg-sky-500/20 border-sky-500/50 text-sky-400" },
      { value: "medium", label: "\u4E2D", activeClass: "bg-amber-500/20 border-amber-500/50 text-amber-400" },
      { value: "high", label: "\u9AD8", activeClass: "bg-orange-500/20 border-orange-500/50 text-orange-400" },
      { value: "critical", label: "\u4E25\u91CD", activeClass: "bg-red-500/20 border-red-500/50 text-red-400" }
    ];
    const urgencies = [
      { value: "normal", label: "\u5E38\u89C4", activeClass: "bg-slate-600 border-slate-500 text-white" },
      { value: "urgent", label: "\u7D27\u6025", activeClass: "bg-amber-500/20 border-amber-500/50 text-amber-400" },
      { value: "immediate", label: "\u7ACB\u5373", activeClass: "bg-red-500/20 border-red-500/50 text-red-400" }
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
      _push(`</button><div><h1 class="text-2xl font-bold text-white">\u65B0\u5EFA\u98CE\u9669\u4E0A\u62A5</h1><p class="text-slate-400 text-sm">\u5173\u8054\u5DE1\u67E5\u5355\u5E76\u4E0A\u62A5\u98CE\u9669</p></div></div><div class="max-w-lg"><div class="card"><div class="space-y-5"><div><label class="label-text">\u5173\u8054\u5DE1\u67E5\u5355</label><select class="input-field w-full"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).patrolId) ? ssrLooseContain(unref(form).patrolId, "") : ssrLooseEqual(unref(form).patrolId, "")) ? " selected" : ""}>\u8BF7\u9009\u62E9\u5DE1\u67E5\u5355</option><!--[-->`);
      ssrRenderList(unref(eligiblePatrols), (p) => {
        _push(`<option${ssrRenderAttr("value", p.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).patrolId) ? ssrLooseContain(unref(form).patrolId, p.id) : ssrLooseEqual(unref(form).patrolId, p.id)) ? " selected" : ""}> #${ssrInterpolate(p.id)} ${ssrInterpolate(p.trailName)} - ${ssrInterpolate(p.type === "daily" ? "\u65E5\u5E38" : "\u4E13\u9879")}</option>`);
      });
      _push(`<!--]--></select></div><div><label class="label-text">\u98CE\u9669\u7B49\u7EA7</label><div class="grid grid-cols-4 gap-2"><!--[-->`);
      ssrRenderList(levels, (lv) => {
        _push(`<button class="${ssrRenderClass([unref(form).level === lv.value ? lv.activeClass : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500", "py-3 rounded-lg border text-sm font-medium transition-all"])}">${ssrInterpolate(lv.label)}</button>`);
      });
      _push(`<!--]--></div></div><div><label class="label-text">\u7D27\u6025\u7A0B\u5EA6</label><div class="flex gap-3"><!--[-->`);
      ssrRenderList(urgencies, (ug) => {
        _push(`<button class="${ssrRenderClass([unref(form).urgency === ug.value ? ug.activeClass : "bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500", "flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all"])}">${ssrInterpolate(ug.label)}</button>`);
      });
      _push(`<!--]--></div></div><div><label class="label-text">\u98CE\u9669\u63CF\u8FF0</label><textarea rows="4" class="input-field w-full" placeholder="\u8BF7\u8BE6\u7EC6\u63CF\u8FF0\u53D1\u73B0\u7684\u98CE\u9669\u60C5\u51B5...">${ssrInterpolate(unref(form).description)}</textarea></div><button${ssrIncludeBooleanAttr(unref(submitting) || !unref(form).patrolId || !unref(form).level || !unref(form).description) ? " disabled" : ""} class="btn-danger w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">${ssrInterpolate(unref(submitting) ? "\u63D0\u4EA4\u4E2D..." : "\u4E0A\u62A5\u98CE\u9669")}</button></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/risks/new.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=new-ZDPexSeV.mjs.map
