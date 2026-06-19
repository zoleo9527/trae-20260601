import { c as create_ssr_component, v as validate_component, d as add_attribute, f as each, e as escape } from "../../../chunks/ssr.js";
import { P as Plus, E as Eye, a as Edit } from "../../../chunks/square-pen.js";
import { S as Search, F as Filter } from "../../../chunks/search.js";
import { F as FileText } from "../../../chunks/file-text.js";
function getStatusLabel(status) {
  const labels = {
    scheduled: "已安排",
    completed: "已完成",
    cancelled: "已取消",
    postponed: "已延期"
  };
  return labels[status] || status;
}
function getStatusColor(status) {
  const colors = {
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    postponed: "bg-yellow-100 text-yellow-700"
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let user;
  let { data } = $$props;
  let performances = [];
  let guests = [];
  let searchQuery = "";
  let statusFilter = "all";
  function getGuestName(guestId) {
    const guest = guests.find((g) => g.id === guestId);
    return guest?.stage_name || guest?.name || "-";
  }
  function filterPerformances() {
    return performances.filter((p) => {
      const guestName = getGuestName(p.guest_id);
      const matchesSearch = guestName.toLowerCase().includes(searchQuery.toLowerCase()) || p.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all";
      return matchesSearch && matchesStatus;
    });
  }
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  user = data.user;
  return `${!user ? `<div class="min-h-screen flex items-center justify-center" data-svelte-h="svelte-19y3vto"><p class="text-gray-500">请先登录</p></div>` : `<div><div class="flex items-center justify-between mb-6"><div data-svelte-h="svelte-357ydl"><h1 class="text-2xl font-bold text-gray-800">演出排班</h1> <p class="text-gray-500 mt-1">管理酒吧演出日程安排</p></div> <a href="/performances/new" class="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">${validate_component(Plus, "Plus").$$render($$result, { class: "w-5 h-5" }, {}, {})} <span data-svelte-h="svelte-1t8rv3r">安排演出</span></a></div> <div class="bg-white rounded-xl shadow-sm p-6"><div class="flex items-center space-x-4 mb-6"><div class="relative flex-1">${validate_component(Search, "Search").$$render(
    $$result,
    {
      class: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
    },
    {},
    {}
  )} <input type="text" placeholder="搜索嘉宾或备注..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"${add_attribute("value", searchQuery, 0)}></div> <div class="flex items-center space-x-2">${validate_component(Filter, "Filter").$$render($$result, { class: "w-5 h-5 text-gray-400" }, {}, {})} <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"><option value="all" data-svelte-h="svelte-sa0fi">全部状态</option><option value="scheduled" data-svelte-h="svelte-e1sjm2">已安排</option><option value="completed" data-svelte-h="svelte-pc9bwx">已完成</option><option value="cancelled" data-svelte-h="svelte-1qxf86x">已取消</option><option value="postponed" data-svelte-h="svelte-1chedun">已延期</option></select></div></div> <div class="overflow-x-auto"><table class="w-full"><thead data-svelte-h="svelte-108ikjl"><tr class="border-b border-gray-200"><th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">嘉宾</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">日期</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">时间</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">舞台</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">状态</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">备注</th> <th class="text-right py-3 px-4 text-sm font-semibold text-gray-600">操作</th></tr></thead> <tbody>${filterPerformances().length ? each(filterPerformances(), (performance) => {
    return `<tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors"><td class="py-3 px-4 text-gray-800">${escape(getGuestName(performance.guest_id))}</td> <td class="py-3 px-4 text-gray-600">${escape(performance.date)}</td> <td class="py-3 px-4 text-gray-600">${escape(performance.start_time)} - ${escape(performance.end_time)}</td> <td class="py-3 px-4 text-gray-600">${escape(performance.stage)}</td> <td class="py-3 px-4"><span${add_attribute("class", `px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(performance.status)}`, 0)}>${escape(getStatusLabel(performance.status))} </span></td> <td class="py-3 px-4 text-gray-500 text-sm truncate max-w-xs">${escape(performance.notes || "-")}</td> <td class="py-3 px-4 text-right"><div class="flex items-center justify-end space-x-2"><button class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="查看详情">${validate_component(Eye, "Eye").$$render($$result, { class: "w-4 h-4" }, {}, {})}</button> <a${add_attribute("href", `/performances/edit/${performance.id}`, 0)} class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="编辑">${validate_component(Edit, "Edit").$$render($$result, { class: "w-4 h-4" }, {}, {})}</a> <a${add_attribute("href", `/logs?table=performances&recordId=${performance.id}`, 0)} class="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="查看日志">${validate_component(FileText, "FileText").$$render($$result, { class: "w-4 h-4" }, {}, {})}</a> </div></td> </tr>`;
  }) : `<tr data-svelte-h="svelte-1y60v24"><td colspan="7" class="py-12 text-center text-gray-500">暂无演出安排</td> </tr>`}</tbody></table></div></div> ${``}</div>`}`;
});
export {
  Page as default
};
