import { defineComponent, ref, mergeProps, computed, watch, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderAttr, ssrRenderList, ssrRenderStyle } from 'vue/server-renderer';
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

const stageLabels = {
  registration: "\u767B\u8BB0",
  verification: "\u5BA1\u6838",
  payment: "\u6253\u6B3E",
  completed: "\u5B8C\u6210",
  exception: "\u5F02\u5E38"
};
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "ProcessingPanel",
  __ssrInlineRender: true,
  props: {
    records: {},
    user: {}
  },
  emits: ["update"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const statusFilter = ref("");
    const stageFilter = ref("");
    const handlerFilter = ref("");
    const searchKeyword = ref("");
    const showDetailModal = ref(false);
    const showAddModal = ref(false);
    const showUpdateModal = ref(false);
    const selectedRecord = ref(null);
    const updatingRecord = ref(null);
    const updateAction = ref({
      status: "processing",
      remark: ""
    });
    const newRecord = ref({
      ticketNumber: "",
      prizeType: "",
      prizeAmount: "",
      storeCode: "",
      customerName: "",
      customerId: ""
    });
    const statusText = (status) => {
      const map = {
        pending: "\u5F85\u5904\u7406",
        processing: "\u5904\u7406\u4E2D",
        completed: "\u5DF2\u5B8C\u6210",
        exception: "\u5F02\u5E38"
      };
      return map[status] || status;
    };
    const stageText = (stage) => {
      return stageLabels[stage] || stage;
    };
    const formatAmount = (amount) => {
      return `\xA5${amount.toLocaleString()}`;
    };
    const filteredRecords = computed(() => {
      return props.records.filter((r) => {
        if (statusFilter.value && r.status !== statusFilter.value) return false;
        if (stageFilter.value && r.currentStage !== stageFilter.value) return false;
        if (handlerFilter.value && r.currentHandler !== handlerFilter.value) return false;
        if (searchKeyword.value) {
          const keyword = searchKeyword.value.toLowerCase();
          return r.ticketNumber.toLowerCase().includes(keyword) || r.customerName.toLowerCase().includes(keyword);
        }
        return true;
      });
    });
    const canHandle = (record) => {
      if (!props.user) return false;
      const role = props.user.role;
      if (role === "\u7247\u533A\u7BA1\u7406\u5458") return true;
      if (role === "\u5E97\u957F" && record.currentHandler !== "\u7247\u533A\u7BA1\u7406\u5458") return true;
      if (role === "\u5E97\u5458" && record.currentHandler === "\u5E97\u5458") return true;
      return false;
    };
    const getActionText = (record) => {
      if (record.status === "pending") return "\u5F00\u59CB\u5904\u7406";
      if (record.status === "processing") return "\u5B8C\u6210/\u5F02\u5E38";
      return "\u67E5\u770B";
    };
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "processing-panel" }, _attrs))} data-v-e841981c><div class="panel-header" data-v-e841981c><h2 data-v-e841981c>\u5151\u5956\u767B\u8BB0\u5904\u7406</h2><button class="btn btn-primary" data-v-e841981c>\u65B0\u5EFA\u767B\u8BB0</button></div><div class="filter-bar" data-v-e841981c><select data-v-e841981c><option value="" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "") : ssrLooseEqual(statusFilter.value, "")) ? " selected" : ""}>\u5168\u90E8\u72B6\u6001</option><option value="pending" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "pending") : ssrLooseEqual(statusFilter.value, "pending")) ? " selected" : ""}>\u5F85\u5904\u7406</option><option value="processing" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "processing") : ssrLooseEqual(statusFilter.value, "processing")) ? " selected" : ""}>\u5904\u7406\u4E2D</option></select><select data-v-e841981c><option value="" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(stageFilter.value) ? ssrLooseContain(stageFilter.value, "") : ssrLooseEqual(stageFilter.value, "")) ? " selected" : ""}>\u5168\u90E8\u73AF\u8282</option><option value="registration" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(stageFilter.value) ? ssrLooseContain(stageFilter.value, "registration") : ssrLooseEqual(stageFilter.value, "registration")) ? " selected" : ""}>\u767B\u8BB0</option><option value="verification" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(stageFilter.value) ? ssrLooseContain(stageFilter.value, "verification") : ssrLooseEqual(stageFilter.value, "verification")) ? " selected" : ""}>\u5BA1\u6838</option><option value="payment" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(stageFilter.value) ? ssrLooseContain(stageFilter.value, "payment") : ssrLooseEqual(stageFilter.value, "payment")) ? " selected" : ""}>\u6253\u6B3E</option><option value="completed" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(stageFilter.value) ? ssrLooseContain(stageFilter.value, "completed") : ssrLooseEqual(stageFilter.value, "completed")) ? " selected" : ""}>\u5B8C\u6210</option><option value="exception" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(stageFilter.value) ? ssrLooseContain(stageFilter.value, "exception") : ssrLooseEqual(stageFilter.value, "exception")) ? " selected" : ""}>\u5F02\u5E38</option></select><select data-v-e841981c><option value="" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(handlerFilter.value) ? ssrLooseContain(handlerFilter.value, "") : ssrLooseEqual(handlerFilter.value, "")) ? " selected" : ""}>\u5168\u90E8\u8D23\u4EFB\u4EBA</option><option value="\u5E97\u5458" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(handlerFilter.value) ? ssrLooseContain(handlerFilter.value, "\u5E97\u5458") : ssrLooseEqual(handlerFilter.value, "\u5E97\u5458")) ? " selected" : ""}>\u5E97\u5458</option><option value="\u5E97\u957F" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(handlerFilter.value) ? ssrLooseContain(handlerFilter.value, "\u5E97\u957F") : ssrLooseEqual(handlerFilter.value, "\u5E97\u957F")) ? " selected" : ""}>\u5E97\u957F</option><option value="\u7247\u533A\u7BA1\u7406\u5458" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(handlerFilter.value) ? ssrLooseContain(handlerFilter.value, "\u7247\u533A\u7BA1\u7406\u5458") : ssrLooseEqual(handlerFilter.value, "\u7247\u533A\u7BA1\u7406\u5458")) ? " selected" : ""}>\u7247\u533A\u7BA1\u7406\u5458</option></select><input${ssrRenderAttr("value", searchKeyword.value)} type="text" placeholder="\u641C\u7D22\u5F69\u7968\u53F7\u7801\u6216\u987E\u5BA2\u59D3\u540D" data-v-e841981c></div><div class="card" data-v-e841981c><table class="table" data-v-e841981c><thead data-v-e841981c><tr data-v-e841981c><th data-v-e841981c>\u5151\u5956\u7F16\u53F7</th><th data-v-e841981c>\u5F69\u7968\u53F7\u7801</th><th data-v-e841981c>\u5956\u7EA7</th><th data-v-e841981c>\u91D1\u989D</th><th data-v-e841981c>\u95E8\u5E97</th><th data-v-e841981c>\u987E\u5BA2</th><th data-v-e841981c>\u5F53\u524D\u73AF\u8282</th><th data-v-e841981c>\u5F53\u524D\u72B6\u6001</th><th data-v-e841981c>\u5F53\u524D\u5904\u7406\u4EBA</th><th data-v-e841981c>\u66F4\u65B0\u65F6\u95F4</th><th data-v-e841981c>\u6458\u8981</th><th data-v-e841981c>\u64CD\u4F5C</th></tr></thead><tbody data-v-e841981c><!--[-->`);
      ssrRenderList(filteredRecords.value, (record) => {
        _push(`<tr data-v-e841981c><td data-v-e841981c>${ssrInterpolate(record.id)}</td><td data-v-e841981c>${ssrInterpolate(record.ticketNumber)}</td><td data-v-e841981c>${ssrInterpolate(record.prizeType)}</td><td data-v-e841981c>${ssrInterpolate(formatAmount(record.prizeAmount))}</td><td data-v-e841981c>${ssrInterpolate(record.storeName)}</td><td data-v-e841981c>${ssrInterpolate(record.customerName)}</td><td data-v-e841981c><span class="${ssrRenderClass(["stage-badge", `stage-${record.currentStage}`])}" data-v-e841981c>${ssrInterpolate(stageText(record.currentStage))}</span></td><td data-v-e841981c><span class="${ssrRenderClass(["status-badge", `status-${record.status}`])}" data-v-e841981c>${ssrInterpolate(statusText(record.status))}</span></td><td data-v-e841981c>${ssrInterpolate(record.currentHandlerName)}\uFF08${ssrInterpolate(record.currentHandler)}\uFF09</td><td data-v-e841981c>${ssrInterpolate(record.lastUpdatedAt)}</td><td class="summary-cell" data-v-e841981c>${ssrInterpolate(record.summary || "\u65E0\u6458\u8981")}</td><td data-v-e841981c><button class="btn btn-sm btn-primary" data-v-e841981c>\u8BE6\u60C5</button><button class="btn btn-sm btn-secondary"${ssrIncludeBooleanAttr(!canHandle(record)) ? " disabled" : ""} data-v-e841981c>${ssrInterpolate(getActionText(record))}</button></td></tr>`);
      });
      _push(`<!--]--></tbody></table></div>`);
      if (showDetailModal.value) {
        _push(`<div class="modal-overlay" data-v-e841981c><div class="modal-content" data-v-e841981c><h3 data-v-e841981c>\u5151\u5956\u8BE6\u60C5 - ${ssrInterpolate((_a = selectedRecord.value) == null ? void 0 : _a.id)}</h3><div class="detail-section" data-v-e841981c><h4 data-v-e841981c>\u57FA\u672C\u4FE1\u606F</h4><div class="detail-row" data-v-e841981c><span class="detail-label" data-v-e841981c>\u5F69\u7968\u53F7\u7801\uFF1A</span><span data-v-e841981c>${ssrInterpolate((_b = selectedRecord.value) == null ? void 0 : _b.ticketNumber)}</span></div><div class="detail-row" data-v-e841981c><span class="detail-label" data-v-e841981c>\u5956\u7EA7\uFF1A</span><span data-v-e841981c>${ssrInterpolate((_c = selectedRecord.value) == null ? void 0 : _c.prizeType)}</span></div><div class="detail-row" data-v-e841981c><span class="detail-label" data-v-e841981c>\u91D1\u989D\uFF1A</span><span data-v-e841981c>${ssrInterpolate(formatAmount(((_d = selectedRecord.value) == null ? void 0 : _d.prizeAmount) || 0))}</span></div><div class="detail-row" data-v-e841981c><span class="detail-label" data-v-e841981c>\u95E8\u5E97\uFF1A</span><span data-v-e841981c>${ssrInterpolate((_e = selectedRecord.value) == null ? void 0 : _e.storeName)}\uFF08${ssrInterpolate((_f = selectedRecord.value) == null ? void 0 : _f.storeCode)}\uFF09</span></div><div class="detail-row" data-v-e841981c><span class="detail-label" data-v-e841981c>\u987E\u5BA2\uFF1A</span><span data-v-e841981c>${ssrInterpolate((_g = selectedRecord.value) == null ? void 0 : _g.customerName)}\uFF08${ssrInterpolate((_h = selectedRecord.value) == null ? void 0 : _h.customerId)}\uFF09</span></div><div class="detail-row" data-v-e841981c><span class="detail-label" data-v-e841981c>\u5F53\u524D\u73AF\u8282\uFF1A</span><span class="${ssrRenderClass(["stage-badge", `stage-${(_i = selectedRecord.value) == null ? void 0 : _i.currentStage}`])}" data-v-e841981c>${ssrInterpolate(stageText(((_j = selectedRecord.value) == null ? void 0 : _j.currentStage) || ""))}</span></div><div class="detail-row" data-v-e841981c><span class="detail-label" data-v-e841981c>\u5F53\u524D\u72B6\u6001\uFF1A</span><span class="${ssrRenderClass(["status-badge", `status-${(_k = selectedRecord.value) == null ? void 0 : _k.status}`])}" data-v-e841981c>${ssrInterpolate(statusText(((_l = selectedRecord.value) == null ? void 0 : _l.status) || ""))}</span></div><div class="detail-row" data-v-e841981c><span class="detail-label" data-v-e841981c>\u5F53\u524D\u5904\u7406\u4EBA\uFF1A</span><span data-v-e841981c>${ssrInterpolate((_m = selectedRecord.value) == null ? void 0 : _m.currentHandlerName)}\uFF08${ssrInterpolate((_n = selectedRecord.value) == null ? void 0 : _n.currentHandler)}\uFF09</span></div><div class="detail-row" data-v-e841981c><span class="detail-label" data-v-e841981c>\u66F4\u65B0\u65F6\u95F4\uFF1A</span><span data-v-e841981c>${ssrInterpolate((_o = selectedRecord.value) == null ? void 0 : _o.lastUpdatedAt)}</span></div><div class="detail-row" data-v-e841981c><span class="detail-label" data-v-e841981c>\u6458\u8981\uFF1A</span><span class="summary-text" data-v-e841981c>${ssrInterpolate(((_p = selectedRecord.value) == null ? void 0 : _p.summary) || "\u65E0\u6458\u8981")}</span></div><div class="detail-row" data-v-e841981c><span class="detail-label" data-v-e841981c>\u5907\u6CE8\uFF1A</span><span data-v-e841981c>${ssrInterpolate(((_q = selectedRecord.value) == null ? void 0 : _q.remark) || "\u65E0\u5907\u6CE8")}</span></div></div><div class="detail-section" data-v-e841981c><h4 data-v-e841981c>\u72B6\u6001\u53D8\u66F4\u8BB0\u5F55</h4><div class="timeline" data-v-e841981c><!--[-->`);
        ssrRenderList((_r = selectedRecord.value) == null ? void 0 : _r.statusChanges, (change, index) => {
          _push(`<div class="timeline-item" data-v-e841981c><div class="timeline-time" data-v-e841981c>${ssrInterpolate(change.time)}</div><div class="timeline-content" data-v-e841981c><span class="${ssrRenderClass(["stage-badge", `stage-${change.stage}`])}" data-v-e841981c>${ssrInterpolate(stageText(change.stage))}</span><span class="${ssrRenderClass(["status-badge", `status-${change.status}`])}" data-v-e841981c>${ssrInterpolate(statusText(change.status))}</span></div><div class="timeline-operator" data-v-e841981c>${ssrInterpolate(change.operator)}\uFF08${ssrInterpolate(change.operatorRole)}\uFF09</div><div class="timeline-remark" data-v-e841981c>${ssrInterpolate(change.remark || "\u65E0\u5907\u6CE8")}</div></div>`);
        });
        _push(`<!--]--></div></div><button class="btn btn-secondary" data-v-e841981c>\u5173\u95ED</button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (showAddModal.value) {
        _push(`<div class="modal-overlay" data-v-e841981c><div class="modal-content" data-v-e841981c><h3 data-v-e841981c>\u65B0\u5EFA\u5151\u5956\u767B\u8BB0</h3><form data-v-e841981c><div class="form-group" data-v-e841981c><label data-v-e841981c>\u5F69\u7968\u53F7\u7801</label><input${ssrRenderAttr("value", newRecord.value.ticketNumber)} type="text" required data-v-e841981c></div><div class="form-group" data-v-e841981c><label data-v-e841981c>\u5956\u7EA7</label><select required data-v-e841981c><option value="" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(newRecord.value.prizeType) ? ssrLooseContain(newRecord.value.prizeType, "") : ssrLooseEqual(newRecord.value.prizeType, "")) ? " selected" : ""}>\u8BF7\u9009\u62E9\u5956\u7EA7</option><option value="\u4E00\u7B49\u5956" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(newRecord.value.prizeType) ? ssrLooseContain(newRecord.value.prizeType, "\u4E00\u7B49\u5956") : ssrLooseEqual(newRecord.value.prizeType, "\u4E00\u7B49\u5956")) ? " selected" : ""}>\u4E00\u7B49\u5956</option><option value="\u4E8C\u7B49\u5956" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(newRecord.value.prizeType) ? ssrLooseContain(newRecord.value.prizeType, "\u4E8C\u7B49\u5956") : ssrLooseEqual(newRecord.value.prizeType, "\u4E8C\u7B49\u5956")) ? " selected" : ""}>\u4E8C\u7B49\u5956</option><option value="\u4E09\u7B49\u5956" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(newRecord.value.prizeType) ? ssrLooseContain(newRecord.value.prizeType, "\u4E09\u7B49\u5956") : ssrLooseEqual(newRecord.value.prizeType, "\u4E09\u7B49\u5956")) ? " selected" : ""}>\u4E09\u7B49\u5956</option><option value="\u56DB\u7B49\u5956" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(newRecord.value.prizeType) ? ssrLooseContain(newRecord.value.prizeType, "\u56DB\u7B49\u5956") : ssrLooseEqual(newRecord.value.prizeType, "\u56DB\u7B49\u5956")) ? " selected" : ""}>\u56DB\u7B49\u5956</option><option value="\u4E94\u7B49\u5956" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(newRecord.value.prizeType) ? ssrLooseContain(newRecord.value.prizeType, "\u4E94\u7B49\u5956") : ssrLooseEqual(newRecord.value.prizeType, "\u4E94\u7B49\u5956")) ? " selected" : ""}>\u4E94\u7B49\u5956</option></select></div><div class="form-group" data-v-e841981c><label data-v-e841981c>\u91D1\u989D</label><input${ssrRenderAttr("value", newRecord.value.prizeAmount)} type="number" required data-v-e841981c></div><div class="form-group" data-v-e841981c><label data-v-e841981c>\u95E8\u5E97</label><select required data-v-e841981c><option value="" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(newRecord.value.storeCode) ? ssrLooseContain(newRecord.value.storeCode, "") : ssrLooseEqual(newRecord.value.storeCode, "")) ? " selected" : ""}>\u8BF7\u9009\u62E9\u95E8\u5E97</option><option value="BJ-WJ-001" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(newRecord.value.storeCode) ? ssrLooseContain(newRecord.value.storeCode, "BJ-WJ-001") : ssrLooseEqual(newRecord.value.storeCode, "BJ-WJ-001")) ? " selected" : ""}>\u671D\u9633\u533A\u671B\u4EAC\u5E97</option><option value="BJ-ZG-002" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(newRecord.value.storeCode) ? ssrLooseContain(newRecord.value.storeCode, "BJ-ZG-002") : ssrLooseEqual(newRecord.value.storeCode, "BJ-ZG-002")) ? " selected" : ""}>\u6D77\u6DC0\u533A\u4E2D\u5173\u6751\u5E97</option><option value="BJ-XD-003" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(newRecord.value.storeCode) ? ssrLooseContain(newRecord.value.storeCode, "BJ-XD-003") : ssrLooseEqual(newRecord.value.storeCode, "BJ-XD-003")) ? " selected" : ""}>\u897F\u57CE\u533A\u897F\u5355\u5E97</option><option value="BJ-WF-004" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(newRecord.value.storeCode) ? ssrLooseContain(newRecord.value.storeCode, "BJ-WF-004") : ssrLooseEqual(newRecord.value.storeCode, "BJ-WF-004")) ? " selected" : ""}>\u4E1C\u57CE\u533A\u738B\u5E9C\u4E95\u5E97</option></select></div><div class="form-group" data-v-e841981c><label data-v-e841981c>\u987E\u5BA2\u59D3\u540D</label><input${ssrRenderAttr("value", newRecord.value.customerName)} type="text" required data-v-e841981c></div><div class="form-group" data-v-e841981c><label data-v-e841981c>\u8EAB\u4EFD\u8BC1\u53F7</label><input${ssrRenderAttr("value", newRecord.value.customerId)} type="text" required data-v-e841981c></div><button type="submit" class="btn btn-primary" data-v-e841981c>\u63D0\u4EA4</button><button type="button" class="btn btn-secondary" data-v-e841981c>\u53D6\u6D88</button></form></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (showUpdateModal.value) {
        _push(`<div class="modal-overlay" data-v-e841981c><div class="modal-content" data-v-e841981c><h3 data-v-e841981c>\u5904\u7406\u5151\u5956 - ${ssrInterpolate((_s = updatingRecord.value) == null ? void 0 : _s.id)}</h3><div class="form-group" data-v-e841981c><label data-v-e841981c>\u64CD\u4F5C</label><select data-v-e841981c><option value="processing" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(updateAction.value.status) ? ssrLooseContain(updateAction.value.status, "processing") : ssrLooseEqual(updateAction.value.status, "processing")) ? " selected" : ""}>\u5F00\u59CB\u5904\u7406/\u4E0B\u4E00\u6B65</option><option value="completed" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(updateAction.value.status) ? ssrLooseContain(updateAction.value.status, "completed") : ssrLooseEqual(updateAction.value.status, "completed")) ? " selected" : ""}>\u5B8C\u6210\u5151\u5956</option><option value="exception" data-v-e841981c${ssrIncludeBooleanAttr(Array.isArray(updateAction.value.status) ? ssrLooseContain(updateAction.value.status, "exception") : ssrLooseEqual(updateAction.value.status, "exception")) ? " selected" : ""}>\u6807\u8BB0\u5F02\u5E38</option></select></div><div class="form-group" data-v-e841981c><label data-v-e841981c>\u5907\u6CE8</label><textarea data-v-e841981c>${ssrInterpolate(updateAction.value.remark)}</textarea></div><button class="btn btn-primary" data-v-e841981c>\u786E\u8BA4\u5904\u7406</button><button class="btn btn-secondary" data-v-e841981c>\u53D6\u6D88</button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ProcessingPanel.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const ProcessingPanel = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-e841981c"]]);
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "MaterialsPanel",
  __ssrInlineRender: true,
  props: {
    records: {},
    user: {}
  },
  setup(__props) {
    const props = __props;
    const statusFilter = ref("");
    const searchKeyword = ref("");
    const showDetailModal = ref(false);
    const selectedRecord = ref(null);
    const stats = computed(() => {
      const records = filteredRecords.value;
      return {
        total: records.length,
        uploading: records.filter((r) => r.materialsStatus === "uploading").length,
        pending: records.filter((r) => r.materialsStatus === "pending").length,
        completed: records.filter((r) => r.materialsStatus === "completed").length,
        exception: records.filter((r) => r.materialsStatus === "exception").length
      };
    });
    const filteredRecords = computed(() => {
      return props.records.filter((r) => {
        if (statusFilter.value && r.materialsStatus !== statusFilter.value) return false;
        if (searchKeyword.value) {
          const keyword = searchKeyword.value.toLowerCase();
          return r.ticketNumber.toLowerCase().includes(keyword) || r.customerName.toLowerCase().includes(keyword);
        }
        return true;
      });
    });
    const materialsStatusText = (status) => {
      const map = {
        uploading: "\u4E0A\u4F20\u4E2D",
        pending: "\u5F85\u5BA1\u6838",
        completed: "\u5DF2\u5B8C\u6210",
        exception: "\u5F02\u5E38"
      };
      return map[status] || status;
    };
    const stageText = (stage) => {
      return stageLabels[stage] || stage;
    };
    const formatAmount = (amount) => {
      return `\xA5${amount.toLocaleString()}`;
    };
    const getProgress = (record) => {
      if (!record.materials || record.materials.length === 0) return 0;
      const uploaded = record.materials.filter((m) => m.uploaded).length;
      return Math.round(uploaded / record.materials.length * 100);
    };
    const getProgressClass = (record) => {
      const progress = getProgress(record);
      if (progress === 100) return "progress-success";
      if (progress >= 50) return "progress-warning";
      return "progress-danger";
    };
    const getIncompleteReason = (record) => {
      var _a;
      if (!record) return "";
      if (record.materialsStatus === "completed") return "";
      const missingMaterials = ((_a = record.materials) == null ? void 0 : _a.filter((m) => !m.uploaded)) || [];
      if (missingMaterials.length > 0) {
        return `\u7F3A\u5C11\u4EE5\u4E0B\u8D44\u6599\uFF1A${missingMaterials.map((m) => m.type).join("\u3001")}`;
      }
      if (record.materialsStatus === "exception") {
        return record.remark || "\u8D44\u6599\u5B58\u5728\u5F02\u5E38\uFF0C\u9700\u8FDB\u4E00\u6B65\u6838\u5B9E";
      }
      return "\u8D44\u6599\u6B63\u5728\u5BA1\u6838\u4E2D";
    };
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "materials-panel" }, _attrs))} data-v-c9bb6f63><div class="panel-header" data-v-c9bb6f63><h2 data-v-c9bb6f63>\u8D44\u6599\u7559\u5B58\u56DE\u770B</h2></div><div class="filter-bar" data-v-c9bb6f63><select data-v-c9bb6f63><option value="" data-v-c9bb6f63${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "") : ssrLooseEqual(statusFilter.value, "")) ? " selected" : ""}>\u5168\u90E8\u72B6\u6001</option><option value="uploading" data-v-c9bb6f63${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "uploading") : ssrLooseEqual(statusFilter.value, "uploading")) ? " selected" : ""}>\u4E0A\u4F20\u4E2D</option><option value="pending" data-v-c9bb6f63${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "pending") : ssrLooseEqual(statusFilter.value, "pending")) ? " selected" : ""}>\u5F85\u5BA1\u6838</option><option value="completed" data-v-c9bb6f63${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "completed") : ssrLooseEqual(statusFilter.value, "completed")) ? " selected" : ""}>\u5DF2\u5B8C\u6210</option><option value="exception" data-v-c9bb6f63${ssrIncludeBooleanAttr(Array.isArray(statusFilter.value) ? ssrLooseContain(statusFilter.value, "exception") : ssrLooseEqual(statusFilter.value, "exception")) ? " selected" : ""}>\u5F02\u5E38</option></select><input${ssrRenderAttr("value", searchKeyword.value)} type="text" placeholder="\u641C\u7D22\u5F69\u7968\u53F7\u7801\u6216\u987E\u5BA2\u59D3\u540D" data-v-c9bb6f63></div><div class="stats-row" data-v-c9bb6f63><div class="stat-card" data-v-c9bb6f63><div class="stat-value" data-v-c9bb6f63>${ssrInterpolate(stats.value.total)}</div><div class="stat-label" data-v-c9bb6f63>\u603B\u8BB0\u5F55</div></div><div class="stat-card" data-v-c9bb6f63><div class="stat-value stat-warning" data-v-c9bb6f63>${ssrInterpolate(stats.value.uploading)}</div><div class="stat-label" data-v-c9bb6f63>\u4E0A\u4F20\u4E2D</div></div><div class="stat-card" data-v-c9bb6f63><div class="stat-value stat-info" data-v-c9bb6f63>${ssrInterpolate(stats.value.pending)}</div><div class="stat-label" data-v-c9bb6f63>\u5F85\u5BA1\u6838</div></div><div class="stat-card" data-v-c9bb6f63><div class="stat-value stat-success" data-v-c9bb6f63>${ssrInterpolate(stats.value.completed)}</div><div class="stat-label" data-v-c9bb6f63>\u5DF2\u5B8C\u6210</div></div><div class="stat-card" data-v-c9bb6f63><div class="stat-value stat-danger" data-v-c9bb6f63>${ssrInterpolate(stats.value.exception)}</div><div class="stat-label" data-v-c9bb6f63>\u5F02\u5E38</div></div></div><div class="card" data-v-c9bb6f63><table class="table" data-v-c9bb6f63><thead data-v-c9bb6f63><tr data-v-c9bb6f63><th data-v-c9bb6f63>\u5151\u5956\u7F16\u53F7</th><th data-v-c9bb6f63>\u5F69\u7968\u53F7\u7801</th><th data-v-c9bb6f63>\u5956\u7EA7</th><th data-v-c9bb6f63>\u91D1\u989D</th><th data-v-c9bb6f63>\u95E8\u5E97</th><th data-v-c9bb6f63>\u987E\u5BA2</th><th data-v-c9bb6f63>\u5F53\u524D\u73AF\u8282</th><th data-v-c9bb6f63>\u8D44\u6599\u72B6\u6001</th><th data-v-c9bb6f63>\u8D44\u6599\u5B8C\u6210\u5EA6</th><th data-v-c9bb6f63>\u5904\u7406\u4EBA</th><th data-v-c9bb6f63>\u66F4\u65B0\u65F6\u95F4</th><th data-v-c9bb6f63>\u6458\u8981</th><th data-v-c9bb6f63>\u64CD\u4F5C</th></tr></thead><tbody data-v-c9bb6f63><!--[-->`);
      ssrRenderList(filteredRecords.value, (record) => {
        _push(`<tr data-v-c9bb6f63><td data-v-c9bb6f63>${ssrInterpolate(record.id)}</td><td data-v-c9bb6f63>${ssrInterpolate(record.ticketNumber)}</td><td data-v-c9bb6f63>${ssrInterpolate(record.prizeType)}</td><td data-v-c9bb6f63>${ssrInterpolate(formatAmount(record.prizeAmount))}</td><td data-v-c9bb6f63>${ssrInterpolate(record.storeName)}</td><td data-v-c9bb6f63>${ssrInterpolate(record.customerName)}</td><td data-v-c9bb6f63><span class="${ssrRenderClass(["stage-badge", `stage-${record.currentStage}`])}" data-v-c9bb6f63>${ssrInterpolate(stageText(record.currentStage))}</span></td><td data-v-c9bb6f63><span class="${ssrRenderClass(["status-badge", `status-${record.materialsStatus}`])}" data-v-c9bb6f63>${ssrInterpolate(materialsStatusText(record.materialsStatus))}</span></td><td data-v-c9bb6f63><div class="progress-bar" data-v-c9bb6f63><div style="${ssrRenderStyle({ width: `${getProgress(record)}%` })}" class="${ssrRenderClass([getProgressClass(record), "progress-fill"])}" data-v-c9bb6f63></div></div><span class="progress-text" data-v-c9bb6f63>${ssrInterpolate(getProgress(record))}%</span></td><td data-v-c9bb6f63>${ssrInterpolate(record.currentHandlerName)}\uFF08${ssrInterpolate(record.currentHandler)}\uFF09</td><td data-v-c9bb6f63>${ssrInterpolate(record.lastUpdatedAt)}</td><td class="summary-cell" data-v-c9bb6f63>${ssrInterpolate(record.summary || "\u65E0\u6458\u8981")}</td><td data-v-c9bb6f63><button class="btn btn-sm btn-primary" data-v-c9bb6f63>\u67E5\u770B\u8D44\u6599</button></td></tr>`);
      });
      _push(`<!--]--></tbody></table></div>`);
      if (showDetailModal.value) {
        _push(`<div class="modal-overlay" data-v-c9bb6f63><div class="modal-content" style="${ssrRenderStyle({ "max-width": "600px" })}" data-v-c9bb6f63><h3 data-v-c9bb6f63>\u8D44\u6599\u8BE6\u60C5 - ${ssrInterpolate((_a = selectedRecord.value) == null ? void 0 : _a.id)}</h3><div class="detail-section" data-v-c9bb6f63><h4 data-v-c9bb6f63>\u57FA\u672C\u4FE1\u606F</h4><div class="detail-row" data-v-c9bb6f63><span class="detail-label" data-v-c9bb6f63>\u5F69\u7968\u53F7\u7801\uFF1A</span><span data-v-c9bb6f63>${ssrInterpolate((_b = selectedRecord.value) == null ? void 0 : _b.ticketNumber)}</span></div><div class="detail-row" data-v-c9bb6f63><span class="detail-label" data-v-c9bb6f63>\u5956\u7EA7\uFF1A</span><span data-v-c9bb6f63>${ssrInterpolate((_c = selectedRecord.value) == null ? void 0 : _c.prizeType)}</span></div><div class="detail-row" data-v-c9bb6f63><span class="detail-label" data-v-c9bb6f63>\u91D1\u989D\uFF1A</span><span data-v-c9bb6f63>${ssrInterpolate(formatAmount(((_d = selectedRecord.value) == null ? void 0 : _d.prizeAmount) || 0))}</span></div><div class="detail-row" data-v-c9bb6f63><span class="detail-label" data-v-c9bb6f63>\u987E\u5BA2\uFF1A</span><span data-v-c9bb6f63>${ssrInterpolate((_e = selectedRecord.value) == null ? void 0 : _e.customerName)}\uFF08${ssrInterpolate((_f = selectedRecord.value) == null ? void 0 : _f.customerId)}\uFF09</span></div><div class="detail-row" data-v-c9bb6f63><span class="detail-label" data-v-c9bb6f63>\u5F53\u524D\u73AF\u8282\uFF1A</span><span class="${ssrRenderClass(["stage-badge", `stage-${(_g = selectedRecord.value) == null ? void 0 : _g.currentStage}`])}" data-v-c9bb6f63>${ssrInterpolate(stageText(((_h = selectedRecord.value) == null ? void 0 : _h.currentStage) || ""))}</span></div><div class="detail-row" data-v-c9bb6f63><span class="detail-label" data-v-c9bb6f63>\u8D44\u6599\u72B6\u6001\uFF1A</span><span class="${ssrRenderClass(["status-badge", `status-${(_i = selectedRecord.value) == null ? void 0 : _i.materialsStatus}`])}" data-v-c9bb6f63>${ssrInterpolate(materialsStatusText(((_j = selectedRecord.value) == null ? void 0 : _j.materialsStatus) || ""))}</span></div><div class="detail-row" data-v-c9bb6f63><span class="detail-label" data-v-c9bb6f63>\u5F53\u524D\u5904\u7406\u4EBA\uFF1A</span><span data-v-c9bb6f63>${ssrInterpolate((_k = selectedRecord.value) == null ? void 0 : _k.currentHandlerName)}\uFF08${ssrInterpolate((_l = selectedRecord.value) == null ? void 0 : _l.currentHandler)}\uFF09</span></div><div class="detail-row" data-v-c9bb6f63><span class="detail-label" data-v-c9bb6f63>\u66F4\u65B0\u65F6\u95F4\uFF1A</span><span data-v-c9bb6f63>${ssrInterpolate((_m = selectedRecord.value) == null ? void 0 : _m.lastUpdatedAt)}</span></div><div class="detail-row" data-v-c9bb6f63><span class="detail-label" data-v-c9bb6f63>\u6458\u8981\uFF1A</span><span class="summary-text" data-v-c9bb6f63>${ssrInterpolate(((_n = selectedRecord.value) == null ? void 0 : _n.summary) || "\u65E0\u6458\u8981")}</span></div><div class="detail-row" data-v-c9bb6f63><span class="detail-label" data-v-c9bb6f63>\u5907\u6CE8\uFF1A</span><span data-v-c9bb6f63>${ssrInterpolate(((_o = selectedRecord.value) == null ? void 0 : _o.remark) || "\u65E0\u5907\u6CE8")}</span></div></div><div class="detail-section" data-v-c9bb6f63><h4 data-v-c9bb6f63>\u8D44\u6599\u6E05\u5355</h4><div class="materials-list" data-v-c9bb6f63><!--[-->`);
        ssrRenderList((_p = selectedRecord.value) == null ? void 0 : _p.materials, (material, index) => {
          _push(`<div class="material-item" data-v-c9bb6f63><div class="material-type" data-v-c9bb6f63>${ssrInterpolate(material.type)}</div><div class="material-status" data-v-c9bb6f63><span class="${ssrRenderClass(material.uploaded ? "status-completed" : "status-pending")}" data-v-c9bb6f63>${ssrInterpolate(material.uploaded ? "\u5DF2\u4E0A\u4F20" : "\u672A\u4E0A\u4F20")}</span></div>`);
          if (material.uploaded) {
            _push(`<div class="material-meta" data-v-c9bb6f63>${ssrInterpolate(material.uploadedBy)} / ${ssrInterpolate(material.uploadedAt)}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div></div><div class="detail-section" data-v-c9bb6f63><h4 data-v-c9bb6f63>\u8D44\u6599\u672A\u5B8C\u6210\u539F\u56E0\u5206\u6790</h4>`);
        if (getIncompleteReason(selectedRecord.value)) {
          _push(`<div class="reason-box" data-v-c9bb6f63>${ssrInterpolate(getIncompleteReason(selectedRecord.value))}</div>`);
        } else {
          _push(`<div class="reason-box reason-complete" data-v-c9bb6f63> \u6240\u6709\u8D44\u6599\u5DF2\u5B8C\u6574\u4E0A\u4F20 </div>`);
        }
        _push(`</div><button class="btn btn-secondary" data-v-c9bb6f63>\u5173\u95ED</button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/MaterialsPanel.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const MaterialsPanel = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-c9bb6f63"]]);
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "ExceptionsPanel",
  __ssrInlineRender: true,
  props: {
    records: {},
    user: {}
  },
  emits: ["handle"],
  setup(__props, { emit: __emit }) {
    const formatAmount = (amount) => {
      return `\xA5${amount.toLocaleString()}`;
    };
    const stageText = (stage) => {
      return stageLabels[stage] || stage;
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "exceptions-panel" }, _attrs))} data-v-e09b69d7><div class="panel-header" data-v-e09b69d7><h2 data-v-e09b69d7>\u5F02\u5E38\u5904\u7406</h2><div class="exception-count" data-v-e09b69d7> \u5171 ${ssrInterpolate(_ctx.records.length)} \u6761\u5F02\u5E38\u8BB0\u5F55 </div></div><div class="card" data-v-e09b69d7><table class="table" data-v-e09b69d7><thead data-v-e09b69d7><tr data-v-e09b69d7><th data-v-e09b69d7>\u5151\u5956\u7F16\u53F7</th><th data-v-e09b69d7>\u5F69\u7968\u53F7\u7801</th><th data-v-e09b69d7>\u5956\u7EA7</th><th data-v-e09b69d7>\u91D1\u989D</th><th data-v-e09b69d7>\u95E8\u5E97</th><th data-v-e09b69d7>\u987E\u5BA2</th><th data-v-e09b69d7>\u5F53\u524D\u73AF\u8282</th><th data-v-e09b69d7>\u5F53\u524D\u5904\u7406\u4EBA</th><th data-v-e09b69d7>\u66F4\u65B0\u65F6\u95F4</th><th data-v-e09b69d7>\u6458\u8981</th><th data-v-e09b69d7>\u5F02\u5E38\u539F\u56E0</th><th data-v-e09b69d7>\u64CD\u4F5C</th></tr></thead><tbody data-v-e09b69d7><!--[-->`);
      ssrRenderList(_ctx.records, (record) => {
        _push(`<tr data-v-e09b69d7><td data-v-e09b69d7>${ssrInterpolate(record.id)}</td><td data-v-e09b69d7>${ssrInterpolate(record.ticketNumber)}</td><td data-v-e09b69d7>${ssrInterpolate(record.prizeType)}</td><td data-v-e09b69d7>${ssrInterpolate(formatAmount(record.prizeAmount))}</td><td data-v-e09b69d7>${ssrInterpolate(record.storeName)}</td><td data-v-e09b69d7>${ssrInterpolate(record.customerName)}</td><td data-v-e09b69d7><span class="${ssrRenderClass(["stage-badge", `stage-${record.currentStage}`])}" data-v-e09b69d7>${ssrInterpolate(stageText(record.currentStage))}</span></td><td data-v-e09b69d7>${ssrInterpolate(record.currentHandlerName)}\uFF08${ssrInterpolate(record.currentHandler)}\uFF09</td><td data-v-e09b69d7>${ssrInterpolate(record.lastUpdatedAt)}</td><td class="summary-cell" data-v-e09b69d7>${ssrInterpolate(record.summary || "\u65E0\u6458\u8981")}</td><td data-v-e09b69d7><span class="exception-reason" data-v-e09b69d7>${ssrInterpolate(record.remark || "\u65E0\u5907\u6CE8")}</span></td><td data-v-e09b69d7><button class="btn btn-sm btn-danger" data-v-e09b69d7>\u5904\u7406\u5F02\u5E38</button></td></tr>`);
      });
      _push(`<!--]--></tbody></table>`);
      if (_ctx.records.length === 0) {
        _push(`<div class="empty-state" data-v-e09b69d7><div class="empty-icon" data-v-e09b69d7>\u2713</div><div class="empty-text" data-v-e09b69d7>\u6682\u65E0\u5F02\u5E38\u8BB0\u5F55</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ExceptionsPanel.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const ExceptionsPanel = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-e09b69d7"]]);
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ExceptionDrawer",
  __ssrInlineRender: true,
  props: {
    record: {},
    visible: { type: Boolean },
    user: {}
  },
  emits: ["close", "resolve"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const resolveAction = ref("processing");
    const resolveRemark = ref("");
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        resolveAction.value = "processing";
        resolveRemark.value = "";
      }
    });
    const formatAmount = (amount) => {
      return `\xA5${amount.toLocaleString()}`;
    };
    const statusText = (status) => {
      const map = {
        pending: "\u5F85\u5904\u7406",
        processing: "\u5904\u7406\u4E2D",
        completed: "\u5DF2\u5B8C\u6210",
        exception: "\u5F02\u5E38"
      };
      return map[status] || status;
    };
    const stageText = (stage) => {
      return stageLabels[stage] || stage;
    };
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
      _push(`<div${ssrRenderAttrs(_attrs)} data-v-7a4fdc85><div class="${ssrRenderClass([{ open: _ctx.visible }, "drawer-overlay"])}" data-v-7a4fdc85></div><div class="${ssrRenderClass([{ open: _ctx.visible }, "drawer"])}" data-v-7a4fdc85><div class="drawer-header" data-v-7a4fdc85><div class="drawer-title" data-v-7a4fdc85><span class="exception-badge" data-v-7a4fdc85>\u5F02\u5E38\u5904\u7406</span> ${ssrInterpolate((_a = _ctx.record) == null ? void 0 : _a.id)}</div><button class="drawer-close" data-v-7a4fdc85>\xD7</button></div><div class="drawer-body" data-v-7a4fdc85><div class="section" data-v-7a4fdc85><h3 data-v-7a4fdc85>\u57FA\u672C\u4FE1\u606F</h3><div class="info-row" data-v-7a4fdc85><span class="info-label" data-v-7a4fdc85>\u5F69\u7968\u53F7\u7801</span><span class="info-value" data-v-7a4fdc85>${ssrInterpolate((_b = _ctx.record) == null ? void 0 : _b.ticketNumber)}</span></div><div class="info-row" data-v-7a4fdc85><span class="info-label" data-v-7a4fdc85>\u5956\u7EA7</span><span class="info-value" data-v-7a4fdc85>${ssrInterpolate((_c = _ctx.record) == null ? void 0 : _c.prizeType)}</span></div><div class="info-row" data-v-7a4fdc85><span class="info-label" data-v-7a4fdc85>\u91D1\u989D</span><span class="info-value" data-v-7a4fdc85>${ssrInterpolate(formatAmount(((_d = _ctx.record) == null ? void 0 : _d.prizeAmount) || 0))}</span></div><div class="info-row" data-v-7a4fdc85><span class="info-label" data-v-7a4fdc85>\u95E8\u5E97</span><span class="info-value" data-v-7a4fdc85>${ssrInterpolate((_e = _ctx.record) == null ? void 0 : _e.storeName)}</span></div><div class="info-row" data-v-7a4fdc85><span class="info-label" data-v-7a4fdc85>\u987E\u5BA2</span><span class="info-value" data-v-7a4fdc85>${ssrInterpolate((_f = _ctx.record) == null ? void 0 : _f.customerName)}\uFF08${ssrInterpolate((_g = _ctx.record) == null ? void 0 : _g.customerId)}\uFF09</span></div><div class="info-row" data-v-7a4fdc85><span class="info-label" data-v-7a4fdc85>\u5F53\u524D\u73AF\u8282</span><span class="${ssrRenderClass(["stage-badge", `stage-${(_h = _ctx.record) == null ? void 0 : _h.currentStage}`])}" data-v-7a4fdc85>${ssrInterpolate(stageText(((_i = _ctx.record) == null ? void 0 : _i.currentStage) || ""))}</span></div><div class="info-row" data-v-7a4fdc85><span class="info-label" data-v-7a4fdc85>\u5F53\u524D\u5904\u7406\u4EBA</span><span class="info-value" data-v-7a4fdc85>${ssrInterpolate((_j = _ctx.record) == null ? void 0 : _j.currentHandlerName)}\uFF08${ssrInterpolate((_k = _ctx.record) == null ? void 0 : _k.currentHandler)}\uFF09</span></div><div class="info-row" data-v-7a4fdc85><span class="info-label" data-v-7a4fdc85>\u66F4\u65B0\u65F6\u95F4</span><span class="info-value" data-v-7a4fdc85>${ssrInterpolate((_l = _ctx.record) == null ? void 0 : _l.lastUpdatedAt)}</span></div><div class="info-row" data-v-7a4fdc85><span class="info-label" data-v-7a4fdc85>\u6458\u8981</span><span class="info-value summary-text" data-v-7a4fdc85>${ssrInterpolate(((_m = _ctx.record) == null ? void 0 : _m.summary) || "\u65E0\u6458\u8981")}</span></div></div><div class="section" data-v-7a4fdc85><h3 data-v-7a4fdc85>\u5F02\u5E38\u4FE1\u606F</h3><div class="exception-detail" data-v-7a4fdc85><div class="exception-title" data-v-7a4fdc85>\u5F02\u5E38\u539F\u56E0</div><div class="exception-content" data-v-7a4fdc85>${ssrInterpolate(((_n = _ctx.record) == null ? void 0 : _n.remark) || "\u65E0\u5907\u6CE8")}</div></div></div><div class="section" data-v-7a4fdc85><h3 data-v-7a4fdc85>\u72B6\u6001\u53D8\u66F4\u5386\u53F2</h3><div class="timeline" data-v-7a4fdc85><!--[-->`);
      ssrRenderList((_o = _ctx.record) == null ? void 0 : _o.statusChanges, (change, index) => {
        _push(`<div class="timeline-item" data-v-7a4fdc85><div class="timeline-time" data-v-7a4fdc85>${ssrInterpolate(change.time)}</div><div class="timeline-content" data-v-7a4fdc85><span class="${ssrRenderClass(["stage-badge", `stage-${change.stage}`])}" data-v-7a4fdc85>${ssrInterpolate(stageText(change.stage))}</span><span class="${ssrRenderClass(["status-badge", `status-${change.status}`])}" data-v-7a4fdc85>${ssrInterpolate(statusText(change.status))}</span></div><div class="timeline-operator" data-v-7a4fdc85>${ssrInterpolate(change.operator)}\uFF08${ssrInterpolate(change.operatorRole)}\uFF09</div><div class="timeline-remark" data-v-7a4fdc85>${ssrInterpolate(change.remark || "\u65E0\u5907\u6CE8")}</div></div>`);
      });
      _push(`<!--]--></div></div><div class="section" data-v-7a4fdc85><h3 data-v-7a4fdc85>\u5904\u7406\u64CD\u4F5C</h3><div class="form-group" data-v-7a4fdc85><label data-v-7a4fdc85>\u5904\u7406\u65B9\u5F0F</label><select data-v-7a4fdc85><option value="processing" data-v-7a4fdc85${ssrIncludeBooleanAttr(Array.isArray(resolveAction.value) ? ssrLooseContain(resolveAction.value, "processing") : ssrLooseEqual(resolveAction.value, "processing")) ? " selected" : ""}>\u91CD\u65B0\u5904\u7406</option><option value="completed" data-v-7a4fdc85${ssrIncludeBooleanAttr(Array.isArray(resolveAction.value) ? ssrLooseContain(resolveAction.value, "completed") : ssrLooseEqual(resolveAction.value, "completed")) ? " selected" : ""}>\u76F4\u63A5\u5B8C\u6210</option><option value="pending" data-v-7a4fdc85${ssrIncludeBooleanAttr(Array.isArray(resolveAction.value) ? ssrLooseContain(resolveAction.value, "pending") : ssrLooseEqual(resolveAction.value, "pending")) ? " selected" : ""}>\u9000\u56DE\u5F85\u5904\u7406</option></select></div><div class="form-group" data-v-7a4fdc85><label data-v-7a4fdc85>\u5904\u7406\u5907\u6CE8</label><textarea placeholder="\u8BF7\u8F93\u5165\u5904\u7406\u5907\u6CE8" data-v-7a4fdc85>${ssrInterpolate(resolveRemark.value)}</textarea></div><div class="action-buttons" data-v-7a4fdc85><button class="btn btn-danger" data-v-7a4fdc85>\u9A73\u56DE\u7533\u8BF7</button><button class="btn btn-primary" data-v-7a4fdc85>\u786E\u8BA4\u5904\u7406</button></div></div></div></div></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ExceptionDrawer.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const ExceptionDrawer = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-7a4fdc85"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "dashboard",
  __ssrInlineRender: true,
  setup(__props, { expose: __expose }) {
    const currentUser = ref(null);
    const prizeRecords = ref([]);
    const currentTab = ref("processing");
    const showExceptionDrawer = ref(false);
    const selectedException = ref(null);
    const filterByStatus = (statuses) => {
      return prizeRecords.value.filter((r) => statuses.includes(r.status));
    };
    const loadRecords = async () => {
      const response = await fetch("/api/prize");
      const result = await response.json();
      if (result.success) {
        prizeRecords.value = result.data;
      }
    };
    const handleResolveException = async (updatedRecord) => {
      await loadRecords();
      showExceptionDrawer.value = false;
      if (updatedRecord) {
        selectedException.value = { ...updatedRecord };
      } else if (selectedException.value) {
        const record = prizeRecords.value.find((r) => r.id === selectedException.value.id);
        if (record) {
          selectedException.value = { ...record };
        }
      }
    };
    const openExceptionDrawer = (record) => {
      const freshRecord = prizeRecords.value.find((r) => r.id === record.id);
      selectedException.value = freshRecord ? { ...freshRecord } : { ...record };
      showExceptionDrawer.value = true;
    };
    __expose({ openExceptionDrawer });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "dashboard" }, _attrs))} data-v-2eff21d8><header class="dashboard-header" data-v-2eff21d8><div class="header-left" data-v-2eff21d8><h1 data-v-2eff21d8>\u5F69\u7968\u95E8\u5E97-\u5151\u5956\u767B\u8BB0\u4E0E\u8D44\u6599\u7559\u5B58\u7CFB\u7EDF</h1></div><div class="header-right" data-v-2eff21d8><span class="user-info" data-v-2eff21d8>\u6B22\u8FCE\uFF0C${ssrInterpolate((_a = currentUser.value) == null ? void 0 : _a.name)}\uFF08${ssrInterpolate((_b = currentUser.value) == null ? void 0 : _b.role)}\uFF09</span><span class="store-info" data-v-2eff21d8>${ssrInterpolate((_c = currentUser.value) == null ? void 0 : _c.storeName)}</span><button class="btn btn-secondary" data-v-2eff21d8>\u9000\u51FA\u767B\u5F55</button></div></header><nav class="dashboard-nav" data-v-2eff21d8><button class="${ssrRenderClass([{ active: currentTab.value === "processing" }, "nav-btn"])}" data-v-2eff21d8> \u5151\u5956\u767B\u8BB0\u5904\u7406 </button><button class="${ssrRenderClass([{ active: currentTab.value === "materials" }, "nav-btn"])}" data-v-2eff21d8> \u8D44\u6599\u7559\u5B58\u56DE\u770B </button><button class="${ssrRenderClass([{ active: currentTab.value === "exceptions" }, "nav-btn"])}" data-v-2eff21d8> \u5F02\u5E38\u5904\u7406 </button></nav><main class="dashboard-content" data-v-2eff21d8>`);
      if (currentTab.value === "processing") {
        _push(`<div data-v-2eff21d8>`);
        _push(ssrRenderComponent(ProcessingPanel, {
          records: filterByStatus(["pending", "processing"]),
          user: currentUser.value,
          onUpdate: loadRecords
        }, null, _parent));
        _push(`</div>`);
      } else if (currentTab.value === "materials") {
        _push(`<div data-v-2eff21d8>`);
        _push(ssrRenderComponent(MaterialsPanel, {
          records: prizeRecords.value,
          user: currentUser.value
        }, null, _parent));
        _push(`</div>`);
      } else if (currentTab.value === "exceptions") {
        _push(`<div data-v-2eff21d8>`);
        _push(ssrRenderComponent(ExceptionsPanel, {
          records: filterByStatus(["exception"]),
          user: currentUser.value,
          onHandle: openExceptionDrawer
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</main>`);
      _push(ssrRenderComponent(ExceptionDrawer, {
        record: selectedException.value,
        visible: showExceptionDrawer.value,
        user: currentUser.value,
        onClose: ($event) => showExceptionDrawer.value = false,
        onResolve: handleResolveException
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/dashboard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const dashboard = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-2eff21d8"]]);

export { dashboard as default };
//# sourceMappingURL=dashboard--sCYiacW.mjs.map
