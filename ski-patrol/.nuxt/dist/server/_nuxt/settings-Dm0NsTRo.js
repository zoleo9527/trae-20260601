import { defineComponent, ref, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrIncludeBooleanAttr } from "vue/server-renderer";
import { RotateCcw, Users } from "lucide-vue-next";
import { u as useAuthStore } from "../server.mjs";
import "/Users/liu/Documents/private/model-test/trae-20260601-2/ski-patrol/node_modules/hookable/dist/index.mjs";
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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-8" }, _attrs))}><div class="mb-6"><h1 class="text-2xl font-bold text-white mb-1">系统管理</h1><p class="text-slate-400 text-sm">数据重置与演示账号管理</p></div><div class="grid grid-cols-2 gap-6"><div class="card"><div class="flex items-center gap-3 mb-4"><div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">`);
      _push(ssrRenderComponent(unref(RotateCcw), { class: "w-5 h-5 text-red-400" }, null, _parent));
      _push(`</div><div><h3 class="font-semibold text-white">数据重置</h3><p class="text-xs text-slate-400">将所有数据恢复至初始演示状态</p></div></div><p class="text-sm text-slate-400 mb-4">此操作将清除所有巡查记录、风险上报和操作日志，仅保留初始演示账号和雪道数据。操作不可逆。</p><button class="btn-danger">重置数据</button></div><div class="card"><div class="flex items-center gap-3 mb-4"><div class="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">`);
      _push(ssrRenderComponent(unref(Users), { class: "w-5 h-5 text-sky-400" }, null, _parent));
      _push(`</div><div><h3 class="font-semibold text-white">演示账号</h3><p class="text-xs text-slate-400">系统预设的三个演示账号</p></div></div><div class="space-y-3"><!--[-->`);
      ssrRenderList(unref(demoAccounts), (account) => {
        _push(`<div class="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30"><div class="${ssrRenderClass([accountAvatarClass(account.role), "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"])}">${ssrInterpolate(account.name.charAt(0))}</div><div class="flex-1"><p class="text-sm font-medium text-white">${ssrInterpolate(account.name)}</p><p class="text-xs text-slate-400">${ssrInterpolate(account.description)}</p></div><span class="${ssrRenderClass([account.role === "rental" ? "bg-emerald-500/20 text-emerald-400" : account.role === "coach" ? "bg-purple-500/20 text-purple-400" : "bg-sky-500/20 text-sky-400", "badge"])}">${ssrInterpolate(account.role === "rental" ? "租赁员" : account.role === "coach" ? "教练主管" : "安全巡逻员")}</span></div>`);
      });
      _push(`<!--]--></div></div></div>`);
      if (unref(showResetModal)) {
        _push(`<div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><div class="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-red-500/30"><h3 class="text-lg font-semibold text-white mb-2">确认重置数据？</h3><p class="text-sm text-slate-400 mb-6">此操作将清除所有巡查记录、风险上报和操作日志，仅保留初始演示数据。此操作不可逆。</p><div class="flex gap-3"><button class="btn-secondary flex-1">取消</button><button${ssrIncludeBooleanAttr(unref(resetting)) ? " disabled" : ""} class="btn-danger flex-1 disabled:opacity-50">${ssrInterpolate(unref(resetting) ? "重置中..." : "确认重置")}</button></div></div></div>`);
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
export {
  _sfc_main as default
};
//# sourceMappingURL=settings-Dm0NsTRo.js.map
