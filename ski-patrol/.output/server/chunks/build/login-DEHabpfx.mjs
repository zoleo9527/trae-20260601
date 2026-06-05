import { defineComponent, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrIncludeBooleanAttr, ssrRenderClass, ssrInterpolate } from 'vue/server-renderer';
import { MountainSnow, ChevronRight, Loader2 } from 'lucide-vue-next';
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
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    useAuthStore();
    const loading = ref(false);
    const accounts = ref([
      { role: "rental", name: "\u5F20\u79DF\u8D41", description: "\u79DF\u8D41\u67DC\u53F0 \xB7 \u521B\u5EFA\u5DE1\u67E5\u5355 \xB7 \u67E5\u770B\u5F85\u529E" },
      { role: "coach", name: "\u674E\u6559\u7EC3", description: "\u6559\u7EC3\u4E3B\u7BA1 \xB7 \u5BA1\u6279\u98CE\u9669 \xB7 \u6539\u671F\u9A73\u56DE" },
      { role: "patrol", name: "\u738B\u5DE1\u903B", description: "\u5B89\u5168\u5DE1\u903B \xB7 \u6267\u884C\u5DE1\u67E5 \xB7 \u4E0A\u62A5\u98CE\u9669" }
    ]);
    function accountCardClass(role) {
      const map = {
        rental: "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/10",
        coach: "bg-purple-500/5 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10",
        patrol: "bg-sky-500/5 border-sky-500/20 hover:border-sky-500/50 hover:bg-sky-500/10"
      };
      return map[role] || "";
    }
    function accountAvatarClass(role) {
      const map = {
        rental: "bg-emerald-500/20 text-emerald-400",
        coach: "bg-purple-500/20 text-purple-400",
        patrol: "bg-sky-500/20 text-sky-400"
      };
      return map[role] || "";
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-slate-900 flex items-center justify-center p-6" }, _attrs))}><div class="absolute inset-0 overflow-hidden pointer-events-none"><div class="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl"></div><div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-400/5 rounded-full blur-3xl"></div></div><div class="w-full max-w-md relative z-10"><div class="text-center mb-10"><div class="w-16 h-16 rounded-2xl bg-sky-500/20 flex items-center justify-center mx-auto mb-4">`);
      _push(ssrRenderComponent(unref(MountainSnow), { class: "w-8 h-8 text-sky-400" }, null, _parent));
      _push(`</div><h1 class="text-2xl font-bold text-white mb-2">\u96EA\u9053\u5DE1\u67E5\u4E0E\u98CE\u9669\u4E0A\u62A5</h1><p class="text-slate-400 text-sm">\u9009\u62E9\u6F14\u793A\u8D26\u53F7\u767B\u5F55\u7CFB\u7EDF</p></div><div class="space-y-3"><!--[-->`);
      ssrRenderList(unref(accounts), (account) => {
        _push(`<button${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="${ssrRenderClass([accountCardClass(account.role), "w-full p-5 rounded-xl border transition-all duration-300 text-left group"])}"><div class="flex items-center gap-4"><div class="${ssrRenderClass([accountAvatarClass(account.role), "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"])}">${ssrInterpolate(account.name.charAt(0))}</div><div class="flex-1"><h3 class="font-semibold text-white mb-0.5">${ssrInterpolate(account.name)}</h3><p class="text-xs text-slate-400">${ssrInterpolate(account.description)}</p></div>`);
        _push(ssrRenderComponent(unref(ChevronRight), { class: "w-5 h-5 text-slate-500 group-hover:text-white transition-colors" }, null, _parent));
        _push(`</div></button>`);
      });
      _push(`<!--]--></div>`);
      if (unref(loading)) {
        _push(`<div class="mt-6 text-center"><div class="inline-flex items-center gap-2 text-sky-400 text-sm">`);
        _push(ssrRenderComponent(unref(Loader2), { class: "w-4 h-4 animate-spin" }, null, _parent));
        _push(` \u767B\u5F55\u4E2D... </div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=login-DEHabpfx.mjs.map
