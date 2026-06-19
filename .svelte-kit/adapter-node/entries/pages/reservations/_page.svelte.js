import { c as create_ssr_component, v as validate_component, d as add_attribute, f as each, e as escape } from "../../../chunks/ssr.js";
import { I as Icon } from "../../../chunks/Icon.js";
import { P as Plus, E as Eye, a as Edit } from "../../../chunks/square-pen.js";
import { S as Search, F as Filter } from "../../../chunks/search.js";
import { F as FileText } from "../../../chunks/file-text.js";
const Calendar_clock = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "path",
      {
        "d": "M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"
      }
    ],
    ["path", { "d": "M16 2v4" }],
    ["path", { "d": "M8 2v4" }],
    ["path", { "d": "M3 10h5" }],
    ["path", { "d": "M17.5 17.5 16 16.3V14" }],
    ["circle", { "cx": "16", "cy": "16", "r": "6" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "calendar-clock" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const CalendarClock = Calendar_clock;
function getStatusLabel(status) {
  const labels = {
    pending: "待确认",
    confirmed: "已确认",
    cancelled: "已取消",
    completed: "已完成"
  };
  return labels[status] || status;
}
function getStatusColor(status) {
  const colors = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700"
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}
function getTimeSlotLabel(slot) {
  const labels = {
    morning: "上午 (10:00-14:00)",
    afternoon: "下午 (14:00-18:00)",
    evening: "晚间 (18:00-22:00)",
    night: "深夜 (22:00-02:00)"
  };
  return labels[slot] || slot;
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let user;
  let { data } = $$props;
  let reservations = [];
  let searchQuery = "";
  let statusFilter = "all";
  let selectedDate = "";
  function filterReservations() {
    return reservations.filter((r) => {
      const matchesSearch = r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || r.phone.includes(searchQuery);
      const matchesStatus = statusFilter === "all";
      const matchesDate = !selectedDate;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  user = data.user;
  return `${!user ? `<div class="min-h-screen flex items-center justify-center" data-svelte-h="svelte-19y3vto"><p class="text-gray-500">请先登录</p></div>` : `<div><div class="flex items-center justify-between mb-6"><div data-svelte-h="svelte-dxg5e6"><h1 class="text-2xl font-bold text-gray-800">订台记录</h1> <p class="text-gray-500 mt-1">管理酒吧订台信息，防止重复订台</p></div> <a href="/reservations/new" class="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">${validate_component(Plus, "Plus").$$render($$result, { class: "w-5 h-5" }, {}, {})} <span data-svelte-h="svelte-15dgsmi">新增订台</span></a></div> <div class="bg-white rounded-xl shadow-sm p-6"><div class="flex items-center space-x-4 mb-6"><div class="relative flex-1">${validate_component(Search, "Search").$$render(
    $$result,
    {
      class: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
    },
    {},
    {}
  )} <input type="text" placeholder="搜索客户姓名或电话..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"${add_attribute("value", searchQuery, 0)}></div> <div class="flex items-center space-x-2">${validate_component(CalendarClock, "CalendarClock").$$render($$result, { class: "w-5 h-5 text-gray-400" }, {}, {})} <input type="date" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"${add_attribute("value", selectedDate, 0)}></div> <div class="flex items-center space-x-2">${validate_component(Filter, "Filter").$$render($$result, { class: "w-5 h-5 text-gray-400" }, {}, {})} <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"><option value="all" data-svelte-h="svelte-sa0fi">全部状态</option><option value="pending" data-svelte-h="svelte-bysh86">待确认</option><option value="confirmed" data-svelte-h="svelte-18u0isz">已确认</option><option value="cancelled" data-svelte-h="svelte-1qxf86x">已取消</option><option value="completed" data-svelte-h="svelte-pc9bwx">已完成</option></select></div></div> <div class="overflow-x-auto"><table class="w-full"><thead data-svelte-h="svelte-8sw919"><tr class="border-b border-gray-200"><th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">客户姓名</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">联系电话</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">日期</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">时段</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">台号</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">人数</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">状态</th> <th class="text-right py-3 px-4 text-sm font-semibold text-gray-600">操作</th></tr></thead> <tbody>${filterReservations().length ? each(filterReservations(), (reservation) => {
    return `<tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors"><td class="py-3 px-4 text-gray-800">${escape(reservation.customer_name)}</td> <td class="py-3 px-4 text-gray-600">${escape(reservation.phone)}</td> <td class="py-3 px-4 text-gray-600">${escape(reservation.date)}</td> <td class="py-3 px-4 text-gray-600">${escape(getTimeSlotLabel(reservation.time_slot))}</td> <td class="py-3 px-4 text-gray-600">台${escape(reservation.table_number)}</td> <td class="py-3 px-4 text-gray-600">${escape(reservation.guests_count)}人</td> <td class="py-3 px-4"><span${add_attribute("class", `px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reservation.status)}`, 0)}>${escape(getStatusLabel(reservation.status))} </span></td> <td class="py-3 px-4 text-right"><div class="flex items-center justify-end space-x-2"><button class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="查看详情">${validate_component(Eye, "Eye").$$render($$result, { class: "w-4 h-4" }, {}, {})}</button> <a${add_attribute("href", `/reservations/edit/${reservation.id}`, 0)} class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="编辑">${validate_component(Edit, "Edit").$$render($$result, { class: "w-4 h-4" }, {}, {})}</a> <a${add_attribute("href", `/logs?table=reservations&recordId=${reservation.id}`, 0)} class="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="查看日志">${validate_component(FileText, "FileText").$$render($$result, { class: "w-4 h-4" }, {}, {})}</a> </div></td> </tr>`;
  }) : `<tr data-svelte-h="svelte-1wppfhf"><td colspan="8" class="py-12 text-center text-gray-500">暂无订台记录</td> </tr>`}</tbody></table></div></div> ${``}</div>`}`;
});
export {
  Page as default
};
