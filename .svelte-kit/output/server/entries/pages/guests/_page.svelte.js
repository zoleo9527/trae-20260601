import { c as create_ssr_component, v as validate_component, d as add_attribute, f as each, e as escape } from "../../../chunks/ssr.js";
import { P as Plus, E as Eye, a as Edit } from "../../../chunks/square-pen.js";
import { S as Search, F as Filter } from "../../../chunks/search.js";
import { F as FileText } from "../../../chunks/file-text.js";
function getStatusLabel(status) {
  const labels = {
    active: "活跃",
    inactive: "暂停",
    blacklisted: "黑名单"
  };
  return labels[status] || status;
}
function getStatusColor(status) {
  const colors = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-yellow-100 text-yellow-700",
    blacklisted: "bg-red-100 text-red-700"
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let user;
  let { data } = $$props;
  let guests = [];
  let searchQuery = "";
  let statusFilter = "all";
  function filterGuests() {
    return guests.filter((g) => {
      const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.stage_name?.toLowerCase().includes(searchQuery.toLowerCase()) || g.phone?.includes(searchQuery);
      const matchesStatus = statusFilter === "all";
      return matchesSearch && matchesStatus;
    });
  }
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  user = data.user;
  return `${!user ? `<div class="min-h-screen flex items-center justify-center" data-svelte-h="svelte-19y3vto"><p class="text-gray-500">请先登录</p></div>` : `<div><div class="flex items-center justify-between mb-6"><div data-svelte-h="svelte-1x5jyjf"><h1 class="text-2xl font-bold text-gray-800">嘉宾名单</h1> <p class="text-gray-500 mt-1">管理酒吧演出嘉宾信息</p></div> <a href="/guests/new" class="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">${validate_component(Plus, "Plus").$$render($$result, { class: "w-5 h-5" }, {}, {})} <span data-svelte-h="svelte-1mhlth6">添加嘉宾</span></a></div> <div class="bg-white rounded-xl shadow-sm p-6"><div class="flex items-center space-x-4 mb-6"><div class="relative flex-1">${validate_component(Search, "Search").$$render(
    $$result,
    {
      class: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
    },
    {},
    {}
  )} <input type="text" placeholder="搜索嘉宾姓名、艺名或电话..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"${add_attribute("value", searchQuery, 0)}></div> <div class="flex items-center space-x-2">${validate_component(Filter, "Filter").$$render($$result, { class: "w-5 h-5 text-gray-400" }, {}, {})} <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"><option value="all" data-svelte-h="svelte-sa0fi">全部状态</option><option value="active" data-svelte-h="svelte-jwpxcu">活跃</option><option value="inactive" data-svelte-h="svelte-1dx2io7">暂停</option><option value="blacklisted" data-svelte-h="svelte-aq4wcf">黑名单</option></select></div></div> <div class="overflow-x-auto"><table class="w-full"><thead data-svelte-h="svelte-1lp4ljf"><tr class="border-b border-gray-200"><th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">姓名</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">艺名</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">电话</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">风格</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">状态</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">创建时间</th> <th class="text-right py-3 px-4 text-sm font-semibold text-gray-600">操作</th></tr></thead> <tbody>${filterGuests().length ? each(filterGuests(), (guest) => {
    return `<tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors"><td class="py-3 px-4 text-gray-800">${escape(guest.name)}</td> <td class="py-3 px-4 text-gray-600">${escape(guest.stage_name || "-")}</td> <td class="py-3 px-4 text-gray-600">${escape(guest.phone || "-")}</td> <td class="py-3 px-4 text-gray-600">${escape(guest.genre || "-")}</td> <td class="py-3 px-4"><span${add_attribute("class", `px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(guest.status)}`, 0)}>${escape(getStatusLabel(guest.status))} </span></td> <td class="py-3 px-4 text-gray-500 text-sm">${escape(new Date(guest.created_at).toLocaleString("zh-CN"))}</td> <td class="py-3 px-4 text-right"><div class="flex items-center justify-end space-x-2"><button class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="查看详情">${validate_component(Eye, "Eye").$$render($$result, { class: "w-4 h-4" }, {}, {})}</button> <a${add_attribute("href", `/guests/edit/${guest.id}`, 0)} class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="编辑">${validate_component(Edit, "Edit").$$render($$result, { class: "w-4 h-4" }, {}, {})}</a> <a${add_attribute("href", `/logs?table=guests&recordId=${guest.id}`, 0)} class="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="查看日志">${validate_component(FileText, "FileText").$$render($$result, { class: "w-4 h-4" }, {}, {})}</a> </div></td> </tr>`;
  }) : `<tr data-svelte-h="svelte-q9oqas"><td colspan="7" class="py-12 text-center text-gray-500">暂无嘉宾数据</td> </tr>`}</tbody></table></div></div> ${``}</div>`}`;
});
export {
  Page as default
};
