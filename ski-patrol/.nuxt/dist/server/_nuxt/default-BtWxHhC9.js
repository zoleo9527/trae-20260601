import { _ as __nuxt_component_0 } from "./nuxt-link-COjNzfAG.js";
import { defineComponent, computed, mergeProps, unref, withCtx, createVNode, resolveDynamicComponent, openBlock, createBlock, createTextVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrRenderVNode, ssrInterpolate, ssrRenderClass, ssrRenderSlot } from "vue/server-renderer";
import { LayoutDashboard, Shield, AlertTriangle, Settings, MountainSnow } from "lucide-vue-next";
import { u as useAuthStore, a as useRoute } from "../server.mjs";
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
  __name: "default",
  __ssrInlineRender: true,
  setup(__props) {
    const authStore = useAuthStore();
    const route = useRoute();
    const navItems = computed(() => [
      { to: "/dashboard", label: "工作台", icon: LayoutDashboard },
      { to: "/patrols", label: "巡查管理", icon: Shield },
      { to: "/risks", label: "风险上报", icon: AlertTriangle },
      { to: "/settings", label: "系统管理", icon: Settings }
    ]);
    const roleAvatarClass = computed(() => {
      const role = authStore.user?.role;
      if (role === "rental") return "bg-emerald-500/20 text-emerald-400";
      if (role === "coach") return "bg-purple-500/20 text-purple-400";
      return "bg-sky-500/20 text-sky-400";
    });
    function isActive(path) {
      return route.path.startsWith(path);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-slate-900 text-white flex" }, _attrs))}>`);
      if (unref(authStore).isLoggedIn) {
        _push(`<aside class="w-64 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0"><div class="p-5 border-b border-slate-700"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">`);
        _push(ssrRenderComponent(unref(MountainSnow), { class: "w-5 h-5 text-sky-400" }, null, _parent));
        _push(`</div><div><h1 class="text-sm font-bold text-white">雪道巡查</h1><p class="text-xs text-slate-400">风险上报系统</p></div></div></div><nav class="flex-1 p-3 space-y-1"><!--[-->`);
        ssrRenderList(unref(navItems), (item) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: item.to,
            to: item.to,
            class: ["flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200", isActive(item.to) ? "bg-sky-500/20 text-sky-400 font-medium" : "text-slate-400 hover:text-white hover:bg-slate-700/50"]
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(item.icon), { class: "w-4 h-4" }, null), _parent2, _scopeId);
                _push2(` ${ssrInterpolate(item.label)}`);
              } else {
                return [
                  (openBlock(), createBlock(resolveDynamicComponent(item.icon), { class: "w-4 h-4" })),
                  createTextVNode(" " + toDisplayString(item.label), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></nav><div class="p-4 border-t border-slate-700"><div class="flex items-center gap-3 mb-3"><div class="${ssrRenderClass([unref(roleAvatarClass), "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"])}">${ssrInterpolate(unref(authStore).user?.name?.charAt(0))}</div><div><p class="text-sm font-medium text-white">${ssrInterpolate(unref(authStore).user?.name)}</p><p class="text-xs text-slate-400">${ssrInterpolate(unref(authStore).roleName)}</p></div></div><button class="w-full text-left text-xs text-slate-400 hover:text-white transition-colors"> 退出登录 </button></div></aside>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<main class="flex-1 overflow-auto">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=default-BtWxHhC9.js.map
