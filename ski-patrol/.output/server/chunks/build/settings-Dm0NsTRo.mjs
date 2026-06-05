import { defineComponent, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { RotateCcw, Users } from 'lucide-vue-next';
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
  __name: "settings",
  __ssrInlineRender: true,
  setup(__props) {
    useAuthStore();
    const demoAccounts = ref([]);
    const showResetModal = ref(false);
    const resetting = ref(false);
    function accountAvatarClass(role) {
      const map = {
        rental: "bg-emerald-500/20 text-emerald-400",
        coach: "bg-purple-500/20 text-purple-400",
        patrol: "bg-sky-500/20 text-sky-400"
      };
      return map[role] || "";
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-8" }, _attrs))}><div class="mb-6"><h1 class="text-2xl font-bold text-white mb-1">\u7CFB\u7EDF\u7BA1\u7406</h1><p class="text-slate-400 text-sm">\u6570\u636E\u91CD\u7F6E\u4E0E\u6F14\u793A\u8D26\u53F7\u7BA1\u7406</p></div><div class="grid grid-cols-2 gap-6"><div class="card"><div class="flex items-center gap-3 mb-4"><div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">`);
      _push(ssrRenderComponent(unref(RotateCcw), { class: "w-5 h-5 text-red-400" }, null, _parent));
      _push(`</div><div><h3 class="font-semibold text-white">\u6570\u636E\u91CD\u7F6E</h3><p class="text-xs text-slate-400">\u5C06\u6240\u6709\u6570\u636E\u6062\u590D\u81F3\u521D\u59CB\u6F14\u793A\u72B6\u6001</p></div></div><p class="text-sm text-slate-400 mb-4">\u6B64\u64CD\u4F5C\u5C06\u6E05\u9664\u6240\u6709\u5DE1\u67E5\u8BB0\u5F55\u3001\u98CE\u9669\u4E0A\u62A5\u548C\u64CD\u4F5C\u65E5\u5FD7\uFF0C\u4EC5\u4FDD\u7559\u521D\u59CB\u6F14\u793A\u8D26\u53F7\u548C\u96EA\u9053\u6570\u636E\u3002\u64CD\u4F5C\u4E0D\u53EF\u9006\u3002</p><button class="btn-danger">\u91CD\u7F6E\u6570\u636E</button></div><div class="card"><div class="flex items-center gap-3 mb-4"><div class="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">`);
      _push(ssrRenderComponent(unref(Users), { class: "w-5 h-5 text-sky-400" }, null, _parent));
      _push(`</div><div><h3 class="font-semibold text-white">\u6F14\u793A\u8D26\u53F7</h3><p class="text-xs text-slate-400">\u7CFB\u7EDF\u9884\u8BBE\u7684\u4E09\u4E2A\u6F14\u793A\u8D26\u53F7</p></div></div><div class="space-y-3"><!--[-->`);
      ssrRenderList(unref(demoAccounts), (account) => {
        _push(`<div class="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30"><div class="${ssrRenderClass([accountAvatarClass(account.role), "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"])}">${ssrInterpolate(account.name.charAt(0))}</div><div class="flex-1"><p class="text-sm font-medium text-white">${ssrInterpolate(account.name)}</p><p class="text-xs text-slate-400">${ssrInterpolate(account.description)}</p></div><span class="${ssrRenderClass([account.role === "rental" ? "bg-emerald-500/20 text-emerald-400" : account.role === "coach" ? "bg-purple-500/20 text-purple-400" : "bg-sky-500/20 text-sky-400", "badge"])}">${ssrInterpolate(account.role === "rental" ? "\u79DF\u8D41\u5458" : account.role === "coach" ? "\u6559\u7EC3\u4E3B\u7BA1" : "\u5B89\u5168\u5DE1\u903B\u5458")}</span></div>`);
      });
      _push(`<!--]--></div></div></div>`);
      if (unref(showResetModal)) {
        _push(`<div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><div class="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-red-500/30"><h3 class="text-lg font-semibold text-white mb-2">\u786E\u8BA4\u91CD\u7F6E\u6570\u636E\uFF1F</h3><p class="text-sm text-slate-400 mb-6">\u6B64\u64CD\u4F5C\u5C06\u6E05\u9664\u6240\u6709\u5DE1\u67E5\u8BB0\u5F55\u3001\u98CE\u9669\u4E0A\u62A5\u548C\u64CD\u4F5C\u65E5\u5FD7\uFF0C\u4EC5\u4FDD\u7559\u521D\u59CB\u6F14\u793A\u6570\u636E\u3002\u6B64\u64CD\u4F5C\u4E0D\u53EF\u9006\u3002</p><div class="flex gap-3"><button class="btn-secondary flex-1">\u53D6\u6D88</button><button${ssrIncludeBooleanAttr(unref(resetting)) ? " disabled" : ""} class="btn-danger flex-1 disabled:opacity-50">${ssrInterpolate(unref(resetting) ? "\u91CD\u7F6E\u4E2D..." : "\u786E\u8BA4\u91CD\u7F6E")}</button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/settings.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=settings-Dm0NsTRo.mjs.map
