import { c as create_ssr_component, v as validate_component, a as subscribe, b as add_attribute, d as each, e as escape } from "../../../chunks/ssr.js";
import { p as page } from "../../../chunks/stores.js";
import { I as Icon } from "../../../chunks/Icon.js";
import { S as Search, F as Filter } from "../../../chunks/search.js";
import { U as User } from "../../../chunks/user.js";
const Arrow_up_down = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["path", { "d": "m21 16-4 4-4-4" }],
    ["path", { "d": "M17 20V4" }],
    ["path", { "d": "m3 8 4-4 4 4" }],
    ["path", { "d": "M7 4v16" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "arrow-up-down" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const ArrowUpDown = Arrow_up_down;
const Circle_alert = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    [
      "line",
      {
        "x1": "12",
        "x2": "12",
        "y1": "8",
        "y2": "12"
      }
    ],
    [
      "line",
      {
        "x1": "12",
        "x2": "12.01",
        "y1": "16",
        "y2": "16"
      }
    ]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "circle-alert" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const AlertCircle = Circle_alert;
const Clock = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["polyline", { "points": "12 6 12 12 16 14" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "clock" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Clock$1 = Clock;
function getTableLabel(tableName) {
  const labels = {
    guests: "嘉宾名单",
    performances: "演出排班",
    reservations: "订台记录",
    wine_storage: "酒水寄存",
    attachments: "附件"
  };
  return labels[tableName] || tableName;
}
function getOperationLabel(operation) {
  const labels = {
    create: "新增",
    update: "修改",
    delete: "删除"
  };
  return labels[operation] || operation;
}
function getOperationColor(operation) {
  const colors = {
    create: "bg-green-100 text-green-700",
    update: "bg-blue-100 text-blue-700",
    delete: "bg-red-100 text-red-700"
  };
  return colors[operation] || "bg-gray-100 text-gray-700";
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let user;
  let $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => value);
  let { data } = $$props;
  let logs = [];
  let searchQuery = "";
  let tableFilter = "all";
  let operationFilter = "all";
  const tableOptions = [
    {
      value: "all",
      label: "全部模块"
    },
    {
      value: "guests",
      label: "嘉宾名单"
    },
    {
      value: "performances",
      label: "演出排班"
    },
    {
      value: "reservations",
      label: "订台记录"
    },
    {
      value: "wine_storage",
      label: "酒水寄存"
    }
  ];
  const operationOptions = [
    {
      value: "all",
      label: "全部操作"
    },
    { value: "create", label: "新增" },
    { value: "update", label: "修改" },
    { value: "delete", label: "删除" }
  ];
  function filterLogs() {
    return logs.filter((log) => {
      const matchesSearch = log.operator_name.toLowerCase().includes(searchQuery.toLowerCase()) || log.notes?.toLowerCase().includes(searchQuery.toLowerCase()) || log.field_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTable = tableFilter === "all";
      const matchesOperation = operationFilter === "all";
      return matchesSearch && matchesTable && matchesOperation;
    });
  }
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  user = data.user;
  $$unsubscribe_page();
  return `${!user ? `<div class="min-h-screen flex items-center justify-center" data-svelte-h="svelte-19y3vto"><p class="text-gray-500">请先登录</p></div>` : `<div><div class="flex items-center justify-between mb-6" data-svelte-h="svelte-sy4c6m"><div><h1 class="text-2xl font-bold text-gray-800">操作日志</h1> <p class="text-gray-500 mt-1">记录所有操作的状态变化、责任人、时间点和备注</p></div></div> <div class="bg-white rounded-xl shadow-sm p-6"><div class="flex items-center space-x-4 mb-6"><div class="relative flex-1">${validate_component(Search, "Search").$$render(
    $$result,
    {
      class: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
    },
    {},
    {}
  )} <input type="text" placeholder="搜索操作人、备注或字段..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"${add_attribute("value", searchQuery, 0)}></div> <div class="flex items-center space-x-2">${validate_component(Filter, "Filter").$$render($$result, { class: "w-5 h-5 text-gray-400" }, {}, {})} <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors">${each(tableOptions, (option) => {
    return `<option${add_attribute("value", option.value, 0)}>${escape(option.label)}</option>`;
  })}</select> <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors">${each(operationOptions, (option) => {
    return `<option${add_attribute("value", option.value, 0)}>${escape(option.label)}</option>`;
  })}</select></div></div> <div class="space-y-3">${filterLogs().length ? each(filterLogs(), (log) => {
    return `<div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"><div class="flex items-center justify-between mb-2"><div class="flex items-center space-x-4"><span${add_attribute("class", `px-3 py-1 text-xs font-medium rounded-full ${getOperationColor(log.operation)}`, 0)}>${escape(getOperationLabel(log.operation))}</span> <span class="text-sm text-gray-600">${escape(getTableLabel(log.table_name))}</span> <span class="text-sm text-gray-500">记录ID: ${escape(log.record_id)}</span></div> <div class="flex items-center space-x-2 text-gray-500 text-sm">${validate_component(Clock$1, "Clock").$$render($$result, { class: "w-4 h-4" }, {}, {})} <span>${escape(new Date(log.created_at).toLocaleString("zh-CN"))}</span> </div></div> <div class="flex items-center space-x-2 mb-2">${validate_component(User, "User").$$render($$result, { class: "w-4 h-4 text-gray-400" }, {}, {})} <span class="text-sm font-medium text-gray-700">操作人: ${escape(log.operator_name)}</span></div> ${log.field_name ? `<div class="flex items-center space-x-2 text-sm mb-2">${validate_component(ArrowUpDown, "ArrowUpDown").$$render($$result, { class: "w-4 h-4 text-gray-400" }, {}, {})} <span class="text-gray-600"><span class="font-medium">${escape(log.field_name)}</span>: 
                  <span class="text-gray-400 line-through">${escape(log.old_value || "-")}</span> <span class="mx-2 text-gray-400" data-svelte-h="svelte-1wncrel">→</span> <span class="text-green-600 font-medium">${escape(log.new_value || "-")}</span></span> </div>` : ``} ${log.notes ? `<div class="flex items-start space-x-2">${validate_component(AlertCircle, "AlertCircle").$$render($$result, { class: "w-4 h-4 text-gray-400 mt-0.5" }, {}, {})} <p class="text-sm text-gray-600">${escape(log.notes)}</p> </div>` : ``} </div>`;
  }) : `<div class="py-12 text-center text-gray-500" data-svelte-h="svelte-8ehm8t">暂无操作日志
          </div>`}</div></div></div>`}`;
});
export {
  Page as default
};
