import { defineComponent, ref, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate } from 'vue/server-renderer';
import { _ as _export_sfc } from './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'devalue';
import '@unhead/ssr';
import 'unhead';
import '@unhead/shared';
import 'vue-router';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const username = ref("");
    const password = ref("");
    const errorMessage = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "login-container" }, _attrs))} data-v-25dde9bf><div class="login-card" data-v-25dde9bf><h2 data-v-25dde9bf>\u5F69\u7968\u95E8\u5E97-\u5151\u5956\u767B\u8BB0\u4E0E\u8D44\u6599\u7559\u5B58\u7CFB\u7EDF</h2><div class="demo-accounts" data-v-25dde9bf><p data-v-25dde9bf>\u6F14\u793A\u8D26\u53F7\uFF1A</p><div class="account-list" data-v-25dde9bf><div class="account-item" data-v-25dde9bf><span class="account-label" data-v-25dde9bf>\u5E97\u5458\uFF1A</span><span class="account-value" data-v-25dde9bf>clerk / 123456</span></div><div class="account-item" data-v-25dde9bf><span class="account-label" data-v-25dde9bf>\u5E97\u957F\uFF1A</span><span class="account-value" data-v-25dde9bf>manager / 123456</span></div><div class="account-item" data-v-25dde9bf><span class="account-label" data-v-25dde9bf>\u7247\u533A\u7BA1\u7406\u5458\uFF1A</span><span class="account-value" data-v-25dde9bf>admin / 123456</span></div></div></div><form data-v-25dde9bf><div class="form-group" data-v-25dde9bf><label data-v-25dde9bf>\u7528\u6237\u540D</label><input${ssrRenderAttr("value", username.value)} type="text" placeholder="\u8BF7\u8F93\u5165\u7528\u6237\u540D" data-v-25dde9bf></div><div class="form-group" data-v-25dde9bf><label data-v-25dde9bf>\u5BC6\u7801</label><input${ssrRenderAttr("value", password.value)} type="password" placeholder="\u8BF7\u8F93\u5165\u5BC6\u7801" data-v-25dde9bf></div><button type="submit" class="btn btn-primary btn-block" data-v-25dde9bf>\u767B\u5F55</button></form>`);
      if (errorMessage.value) {
        _push(`<div class="error-message" data-v-25dde9bf>${ssrInterpolate(errorMessage.value)}</div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-25dde9bf"]]);

export { index as default };
//# sourceMappingURL=index-Cmut8cs3.mjs.map
