import { _ as __nuxt_component_0 } from './nuxt-link-COjNzfAG.mjs';
import { defineComponent, ref, watch, mergeProps, withCtx, unref, createVNode, createTextVNode, toDisplayString, openBlock, createBlock, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderAttr, ssrRenderList, ssrRenderClass, ssrInterpolate } from 'vue/server-renderer';
import { Plus, Loader2, AlertTriangle, ChevronRight } from 'lucide-vue-next';
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
    const risks = ref([]);
    const loading = ref(true);
    const filterStatus = ref("");
    const searchKeyword = ref("");
    async function loadRisks() {
      loading.value = true;
      try {
        const params = new URLSearchParams();
        if (filterStatus.value) params.set("status", filterStatus.value);
        if (searchKeyword.value) params.set("keyword", searchKeyword.value);
        risks.value = await $fetch(`/api/risks?${params.toString()}`);
      } catch (e) {
        console.error("\u52A0\u8F7D\u98CE\u9669\u5217\u8868\u5931\u8D25", e);
      } finally {
        loading.value = false;
      }
    }
    watch(filterStatus, loadRisks);
    function levelLabel(l) {
      const map = { low: "\u4F4E", medium: "\u4E2D", high: "\u9AD8", critical: "\u4E25\u91CD" };
      return map[l] || l;
    }
    function levelBadgeClass(l) {
      const map = { low: "bg-sky-500/20 text-sky-400", medium: "bg-amber-500/20 text-amber-400", high: "bg-orange-500/20 text-orange-400", critical: "bg-red-500/20 text-red-400" };
      return map[l] || "";
    }
    function urgencyLabel(u) {
      const map = { urgent: "\u7D27\u6025", immediate: "\u7ACB\u5373" };
      return map[u] || u;
    }
    function statusLabel(s) {
      const map = { reported: "\u5DF2\u4E0A\u62A5", approved: "\u5DF2\u5BA1\u6279", rejected: "\u5DF2\u9000\u56DE", resubmitted: "\u5DF2\u91CD\u63D0", archived: "\u5DF2\u5F52\u6863" };
      return map[s] || s;
    }
    function statusBadgeClass(s) {
      const map = { reported: "badge-reported", approved: "badge-approved", rejected: "badge-rejected", resubmitted: "badge-resubmitted", archived: "badge-archived" };
      return map[s] || "badge";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-8" }, _attrs))}><div class="flex items-center justify-between mb-6"><div><h1 class="text-2xl font-bold text-white mb-1">\u98CE\u9669\u4E0A\u62A5</h1><p class="text-slate-400 text-sm">\u67E5\u770B\u548C\u7BA1\u7406\u6240\u6709\u98CE\u9669\u4E0A\u62A5\u8BB0\u5F55</p></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/risks/new",
        class: "btn-danger flex items-center gap-2"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(unref(Plus), { class: "w-4 h-4" }, null, _parent2, _scopeId));
            _push2(` \u65B0\u5EFA\u4E0A\u62A5 `);
          } else {
            return [
              createVNode(unref(Plus), { class: "w-4 h-4" }),
              createTextVNode(" \u65B0\u5EFA\u4E0A\u62A5 ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex gap-3 mb-6"><select class="input-field text-sm min-w-[140px]"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "") : ssrLooseEqual(unref(filterStatus), "")) ? " selected" : ""}>\u5168\u90E8\u72B6\u6001</option><option value="reported"${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "reported") : ssrLooseEqual(unref(filterStatus), "reported")) ? " selected" : ""}>\u5DF2\u4E0A\u62A5</option><option value="approved"${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "approved") : ssrLooseEqual(unref(filterStatus), "approved")) ? " selected" : ""}>\u5DF2\u5BA1\u6279</option><option value="rejected"${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "rejected") : ssrLooseEqual(unref(filterStatus), "rejected")) ? " selected" : ""}>\u5DF2\u9000\u56DE</option><option value="resubmitted"${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "resubmitted") : ssrLooseEqual(unref(filterStatus), "resubmitted")) ? " selected" : ""}>\u5DF2\u91CD\u63D0</option><option value="archived"${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "archived") : ssrLooseEqual(unref(filterStatus), "archived")) ? " selected" : ""}>\u5DF2\u5F52\u6863</option></select><input${ssrRenderAttr("value", unref(searchKeyword))} type="text" placeholder="\u641C\u7D22\u96EA\u9053\u540D\u79F0\u6216\u63CF\u8FF0..." class="input-field text-sm flex-1"></div>`);
      if (unref(loading)) {
        _push(`<div class="text-center py-12">`);
        _push(ssrRenderComponent(unref(Loader2), { class: "w-8 h-8 text-orange-400 animate-spin mx-auto" }, null, _parent));
        _push(`</div>`);
      } else if (unref(risks).length === 0) {
        _push(`<div class="text-center py-12">`);
        _push(ssrRenderComponent(unref(AlertTriangle), { class: "w-12 h-12 text-slate-600 mx-auto mb-3" }, null, _parent));
        _push(`<p class="text-slate-400">\u6682\u65E0\u98CE\u9669\u4E0A\u62A5\u8BB0\u5F55</p></div>`);
      } else {
        _push(`<div class="space-y-3"><!--[-->`);
        ssrRenderList(unref(risks), (risk) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: risk.id,
            to: `/risks/${risk.id}`,
            class: "card flex items-center gap-4 group cursor-pointer"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="${ssrRenderClass([risk.status === "rejected" ? "bg-red-400" : risk.status === "approved" ? "bg-emerald-400" : "bg-orange-400", "w-2 h-12 rounded-full shrink-0"])}"${_scopeId}></div><div class="flex-1 min-w-0"${_scopeId}><div class="flex items-center gap-2 mb-1"${_scopeId}><h3 class="font-medium text-white truncate"${_scopeId}>${ssrInterpolate(risk.trailName)}</h3><span class="${ssrRenderClass([levelBadgeClass(risk.level), "badge"])}"${_scopeId}>${ssrInterpolate(levelLabel(risk.level))}</span>`);
                if (risk.urgency !== "normal") {
                  _push2(`<span class="badge bg-red-500/20 text-red-400"${_scopeId}>${ssrInterpolate(urgencyLabel(risk.urgency))}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><p class="text-xs text-slate-400 truncate"${_scopeId}>${ssrInterpolate(risk.description)} \xB7 ${ssrInterpolate(risk.createdAt)}</p></div><div class="flex items-center gap-3"${_scopeId}><span class="${ssrRenderClass(statusBadgeClass(risk.status))}"${_scopeId}>${ssrInterpolate(statusLabel(risk.status))}</span>`);
                _push2(ssrRenderComponent(unref(ChevronRight), { class: "w-4 h-4 text-slate-500 group-hover:text-white transition-colors" }, null, _parent2, _scopeId));
                _push2(`</div>`);
              } else {
                return [
                  createVNode("div", {
                    class: ["w-2 h-12 rounded-full shrink-0", risk.status === "rejected" ? "bg-red-400" : risk.status === "approved" ? "bg-emerald-400" : "bg-orange-400"]
                  }, null, 2),
                  createVNode("div", { class: "flex-1 min-w-0" }, [
                    createVNode("div", { class: "flex items-center gap-2 mb-1" }, [
                      createVNode("h3", { class: "font-medium text-white truncate" }, toDisplayString(risk.trailName), 1),
                      createVNode("span", {
                        class: ["badge", levelBadgeClass(risk.level)]
                      }, toDisplayString(levelLabel(risk.level)), 3),
                      risk.urgency !== "normal" ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "badge bg-red-500/20 text-red-400"
                      }, toDisplayString(urgencyLabel(risk.urgency)), 1)) : createCommentVNode("", true)
                    ]),
                    createVNode("p", { class: "text-xs text-slate-400 truncate" }, toDisplayString(risk.description) + " \xB7 " + toDisplayString(risk.createdAt), 1)
                  ]),
                  createVNode("div", { class: "flex items-center gap-3" }, [
                    createVNode("span", {
                      class: statusBadgeClass(risk.status)
                    }, toDisplayString(statusLabel(risk.status)), 3),
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/risks/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-CynPcjMN.mjs.map
