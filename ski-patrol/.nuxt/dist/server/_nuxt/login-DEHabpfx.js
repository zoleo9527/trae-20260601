import { defineComponent, ref, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrIncludeBooleanAttr, ssrRenderClass, ssrInterpolate } from "vue/server-renderer";
import { MountainSnow, ChevronRight, Loader2 } from "lucide-vue-next";
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
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    useAuthStore();
    const loading = ref(false);
    const accounts = ref([
      { role: "rental", name: "张租赁", description: "租赁柜台 · 创建巡查单 · 查看待办" },
      { role: "coach", name: "李教练", description: "教练主管 · 审批风险 · 改期驳回" },
      { role: "patrol", name: "王巡逻", description: "安全巡逻 · 执行巡查 · 上报风险" }
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
      _push(`</div><h1 class="text-2xl font-bold text-white mb-2">雪道巡查与风险上报</h1><p class="text-slate-400 text-sm">选择演示账号登录系统</p></div><div class="space-y-3"><!--[-->`);
      ssrRenderList(unref(accounts), (account) => {
        _push(`<button${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="${ssrRenderClass([accountCardClass(account.role), "w-full p-5 rounded-xl border transition-all duration-300 text-left group"])}"><div class="flex items-center gap-4"><div class="${ssrRenderClass([accountAvatarClass(account.role), "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"])}">${ssrInterpolate(account.name.charAt(0))}</div><div class="flex-1"><h3 class="font-semibold text-white mb-0.5">${ssrInterpolate(account.name)}</h3><p class="text-xs text-slate-400">${ssrInterpolate(account.description)}</p></div>`);
        _push(ssrRenderComponent(unref(ChevronRight), { class: "w-5 h-5 text-slate-500 group-hover:text-white transition-colors" }, null, _parent));
        _push(`</div></button>`);
      });
      _push(`<!--]--></div>`);
      if (unref(loading)) {
        _push(`<div class="mt-6 text-center"><div class="inline-flex items-center gap-2 text-sky-400 text-sm">`);
        _push(ssrRenderComponent(unref(Loader2), { class: "w-4 h-4 animate-spin" }, null, _parent));
        _push(` 登录中... </div></div>`);
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
export {
  _sfc_main as default
};
//# sourceMappingURL=login-DEHabpfx.js.map
