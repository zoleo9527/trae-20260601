import { _ as __nuxt_component_0 } from './nuxt-link-COjNzfAG.mjs';
import { defineComponent, ref, watch, mergeProps, withCtx, unref, createVNode, createTextVNode, toDisplayString, openBlock, createBlock, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderAttr, ssrRenderList, ssrRenderClass, ssrInterpolate } from 'vue/server-renderer';
import { Plus, Loader2, Shield, ChevronRight } from 'lucide-vue-next';
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
import './server.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';
import 'pinia';
import 'vue-router';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const patrols = ref([]);
    const loading = ref(true);
    const filterStatus = ref("");
    const searchKeyword = ref("");
    async function loadPatrols() {
      loading.value = true;
      try {
        const params = new URLSearchParams();
        if (filterStatus.value) params.set("status", filterStatus.value);
        if (searchKeyword.value) params.set("keyword", searchKeyword.value);
        patrols.value = await $fetch(`/api/patrols?${params.toString()}`);
      } catch (e) {
        console.error("\u52A0\u8F7D\u5DE1\u67E5\u5217\u8868\u5931\u8D25", e);
      } finally {
        loading.value = false;
      }
    }
    watch(filterStatus, loadPatrols);
    function difficultyLabel(d) {
      const map = { beginner: "\u521D\u7EA7", intermediate: "\u4E2D\u7EA7", advanced: "\u9AD8\u7EA7", expert: "\u4E13\u5BB6" };
      return map[d] || d;
    }
    function difficultyBadgeClass(d) {
      const map = {
        beginner: "bg-emerald-500/20 text-emerald-400",
        intermediate: "bg-sky-500/20 text-sky-400",
        advanced: "bg-amber-500/20 text-amber-400",
        expert: "bg-red-500/20 text-red-400"
      };
      return map[d] || "";
    }
    function statusLabel(s) {
      const map = { pending: "\u5F85\u5DE1\u67E5", in_progress: "\u8FDB\u884C\u4E2D", completed: "\u5DF2\u5B8C\u6210", archived: "\u5DF2\u5F52\u6863" };
      return map[s] || s;
    }
    function statusBadgeClass(s) {
      const map = { pending: "badge-pending", in_progress: "badge-progress", completed: "badge-completed", archived: "badge-archived" };
      return map[s] || "badge";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-8" }, _attrs))}><div class="flex items-center justify-between mb-6"><div><h1 class="text-2xl font-bold text-white mb-1">\u5DE1\u67E5\u7BA1\u7406</h1><p class="text-slate-400 text-sm">\u7BA1\u7406\u6240\u6709\u96EA\u9053\u5DE1\u67E5\u8BB0\u5F55</p></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/patrols/new",
        class: "btn-primary flex items-center gap-2"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(unref(Plus), { class: "w-4 h-4" }, null, _parent2, _scopeId));
            _push2(` \u65B0\u5EFA\u5DE1\u67E5 `);
          } else {
            return [
              createVNode(unref(Plus), { class: "w-4 h-4" }),
              createTextVNode(" \u65B0\u5EFA\u5DE1\u67E5 ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex gap-3 mb-6"><select class="input-field text-sm min-w-[140px]"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "") : ssrLooseEqual(unref(filterStatus), "")) ? " selected" : ""}>\u5168\u90E8\u72B6\u6001</option><option value="pending"${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "pending") : ssrLooseEqual(unref(filterStatus), "pending")) ? " selected" : ""}>\u5F85\u5DE1\u67E5</option><option value="in_progress"${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "in_progress") : ssrLooseEqual(unref(filterStatus), "in_progress")) ? " selected" : ""}>\u8FDB\u884C\u4E2D</option><option value="completed"${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "completed") : ssrLooseEqual(unref(filterStatus), "completed")) ? " selected" : ""}>\u5DF2\u5B8C\u6210</option><option value="archived"${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "archived") : ssrLooseEqual(unref(filterStatus), "archived")) ? " selected" : ""}>\u5DF2\u5F52\u6863</option></select><input${ssrRenderAttr("value", unref(searchKeyword))} type="text" placeholder="\u641C\u7D22\u96EA\u9053\u540D\u79F0..." class="input-field text-sm flex-1"></div>`);
      if (unref(loading)) {
        _push(`<div class="text-center py-12">`);
        _push(ssrRenderComponent(unref(Loader2), { class: "w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" }, null, _parent));
        _push(`<p class="text-slate-400">\u52A0\u8F7D\u4E2D...</p></div>`);
      } else if (unref(patrols).length === 0) {
        _push(`<div class="text-center py-12">`);
        _push(ssrRenderComponent(unref(Shield), { class: "w-12 h-12 text-slate-600 mx-auto mb-3" }, null, _parent));
        _push(`<p class="text-slate-400">\u6682\u65E0\u5DE1\u67E5\u8BB0\u5F55</p></div>`);
      } else {
        _push(`<div class="space-y-3"><!--[-->`);
        ssrRenderList(unref(patrols), (patrol) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: patrol.id,
            to: `/patrols/${patrol.id}`,
            class: "card flex items-center gap-4 group cursor-pointer"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="${ssrRenderClass([patrol.result === "issue" ? "bg-orange-400" : patrol.status === "completed" ? "bg-emerald-400" : "bg-sky-400", "w-2 h-12 rounded-full shrink-0"])}"${_scopeId}></div><div class="flex-1 min-w-0"${_scopeId}><div class="flex items-center gap-2 mb-1"${_scopeId}><h3 class="font-medium text-white"${_scopeId}>${ssrInterpolate(patrol.trailName)}</h3><span class="${ssrRenderClass([difficultyBadgeClass(patrol.trailDifficulty), "badge"])}"${_scopeId}>${ssrInterpolate(difficultyLabel(patrol.trailDifficulty))}</span></div><p class="text-xs text-slate-400"${_scopeId}>${ssrInterpolate(patrol.type === "daily" ? "\u65E5\u5E38\u5DE1\u67E5" : "\u4E13\u9879\u5DE1\u67E5")} \xB7 ${ssrInterpolate(patrol.creatorName)}\u521B\u5EFA \xB7 ${ssrInterpolate(patrol.createdAt)}</p></div><div class="flex items-center gap-3"${_scopeId}>`);
                if (patrol.result === "issue") {
                  _push2(`<span class="badge-reported"${_scopeId}>\u6709\u95EE\u9898</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<span class="${ssrRenderClass(statusBadgeClass(patrol.status))}"${_scopeId}>${ssrInterpolate(statusLabel(patrol.status))}</span>`);
                _push2(ssrRenderComponent(unref(ChevronRight), { class: "w-4 h-4 text-slate-500 group-hover:text-white transition-colors" }, null, _parent2, _scopeId));
                _push2(`</div>`);
              } else {
                return [
                  createVNode("div", {
                    class: ["w-2 h-12 rounded-full shrink-0", patrol.result === "issue" ? "bg-orange-400" : patrol.status === "completed" ? "bg-emerald-400" : "bg-sky-400"]
                  }, null, 2),
                  createVNode("div", { class: "flex-1 min-w-0" }, [
                    createVNode("div", { class: "flex items-center gap-2 mb-1" }, [
                      createVNode("h3", { class: "font-medium text-white" }, toDisplayString(patrol.trailName), 1),
                      createVNode("span", {
                        class: ["badge", difficultyBadgeClass(patrol.trailDifficulty)]
                      }, toDisplayString(difficultyLabel(patrol.trailDifficulty)), 3)
                    ]),
                    createVNode("p", { class: "text-xs text-slate-400" }, toDisplayString(patrol.type === "daily" ? "\u65E5\u5E38\u5DE1\u67E5" : "\u4E13\u9879\u5DE1\u67E5") + " \xB7 " + toDisplayString(patrol.creatorName) + "\u521B\u5EFA \xB7 " + toDisplayString(patrol.createdAt), 1)
                  ]),
                  createVNode("div", { class: "flex items-center gap-3" }, [
                    patrol.result === "issue" ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "badge-reported"
                    }, "\u6709\u95EE\u9898")) : createCommentVNode("", true),
                    createVNode("span", {
                      class: statusBadgeClass(patrol.status)
                    }, toDisplayString(statusLabel(patrol.status)), 3),
                    createVNode(unref(ChevronRight), { class: "w-4 h-4 text-slate-500 group-hover:text-white transition-colors" })
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/patrols/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-D8Yi-P3C.mjs.map
