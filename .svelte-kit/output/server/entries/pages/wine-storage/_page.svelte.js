import { c as create_ssr_component, v as validate_component, d as add_attribute, f as each, e as escape } from "../../../chunks/ssr.js";
import { I as Icon } from "../../../chunks/Icon.js";
import { P as Plus, E as Eye, a as Edit } from "../../../chunks/square-pen.js";
import { S as Search, F as Filter } from "../../../chunks/search.js";
import { F as FileText } from "../../../chunks/file-text.js";
const Package = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["path", { "d": "m7.5 4.27 9 5.15" }],
    [
      "path",
      {
        "d": "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
      }
    ],
    ["path", { "d": "m3.3 7 8.7 5 8.7-5" }],
    ["path", { "d": "M12 22V12" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "package" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Package$1 = Package;
function getStatusLabel(status) {
  const labels = {
    stored: "寄存中",
    retrieved: "已取走",
    consumed: "已消费"
  };
  return labels[status] || status;
}
function getStatusColor(status) {
  const colors = {
    stored: "bg-green-100 text-green-700",
    retrieved: "bg-blue-100 text-blue-700",
    consumed: "bg-gray-100 text-gray-700"
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let user;
  let { data } = $$props;
  let wines = [];
  let searchQuery = "";
  let statusFilter = "all";
  function filterWines() {
    return wines.filter((w) => {
      const matchesSearch = w.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || w.phone.includes(searchQuery) || w.wine_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all";
      return matchesSearch && matchesStatus;
    });
  }
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  user = data.user;
  return `${!user ? `<div class="min-h-screen flex items-center justify-center" data-svelte-h="svelte-19y3vto"><p class="text-gray-500">请先登录</p></div>` : `<div><div class="flex items-center justify-between mb-6"><div data-svelte-h="svelte-j54agx"><h1 class="text-2xl font-bold text-gray-800">酒水寄存</h1> <p class="text-gray-500 mt-1">管理客户寄存的酒水，记录存取记录</p></div> <a href="/wine-storage/new" class="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">${validate_component(Plus, "Plus").$$render($$result, { class: "w-5 h-5" }, {}, {})} <span data-svelte-h="svelte-o5xi20">寄存酒水</span></a></div> <div class="bg-white rounded-xl shadow-sm p-6"><div class="flex items-center space-x-4 mb-6"><div class="relative flex-1">${validate_component(Search, "Search").$$render(
    $$result,
    {
      class: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
    },
    {},
    {}
  )} <input type="text" placeholder="搜索客户姓名、电话或酒名..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"${add_attribute("value", searchQuery, 0)}></div> <div class="flex items-center space-x-2">${validate_component(Filter, "Filter").$$render($$result, { class: "w-5 h-5 text-gray-400" }, {}, {})} <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"><option value="all" data-svelte-h="svelte-sa0fi">全部状态</option><option value="stored" data-svelte-h="svelte-1a3ka9i">寄存中</option><option value="retrieved" data-svelte-h="svelte-1d8xnhi">已取走</option><option value="consumed" data-svelte-h="svelte-z06qhr">已消费</option></select></div></div> <div class="overflow-x-auto"><table class="w-full"><thead data-svelte-h="svelte-108npyo"><tr class="border-b border-gray-200"><th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">客户姓名</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">联系电话</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">酒名</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">数量</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">规格</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">位置</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">状态</th> <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">寄存时间</th> <th class="text-right py-3 px-4 text-sm font-semibold text-gray-600">操作</th></tr></thead> <tbody>${filterWines().length ? each(filterWines(), (wine) => {
    return `<tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors"><td class="py-3 px-4 text-gray-800">${escape(wine.customer_name)}</td> <td class="py-3 px-4 text-gray-600">${escape(wine.phone)}</td> <td class="py-3 px-4 text-gray-600">${escape(wine.wine_name)}</td> <td class="py-3 px-4 text-gray-600">${escape(wine.quantity)}瓶</td> <td class="py-3 px-4 text-gray-600">${escape(wine.bottle_size)}</td> <td class="py-3 px-4 text-gray-600">${escape(wine.storage_location)}</td> <td class="py-3 px-4"><span${add_attribute("class", `px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(wine.status)}`, 0)}>${escape(getStatusLabel(wine.status))} </span></td> <td class="py-3 px-4 text-gray-600 text-sm">${escape(new Date(wine.stored_at).toLocaleDateString("zh-CN"))}</td> <td class="py-3 px-4 text-right"><div class="flex items-center justify-end space-x-2"><button class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="查看详情">${validate_component(Eye, "Eye").$$render($$result, { class: "w-4 h-4" }, {}, {})}</button> ${wine.status === "stored" ? `<a${add_attribute("href", `/wine-storage/retrieve/${wine.id}`, 0)} class="flex items-center space-x-1 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm" title="取走">${validate_component(Package$1, "Package").$$render($$result, { class: "w-4 h-4" }, {}, {})} <span data-svelte-h="svelte-11b2t7g">取走</span> </a>` : ``} <a${add_attribute("href", `/wine-storage/edit/${wine.id}`, 0)} class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="编辑">${validate_component(Edit, "Edit").$$render($$result, { class: "w-4 h-4" }, {}, {})}</a> <a${add_attribute("href", `/logs?table=wine_storage&recordId=${wine.id}`, 0)} class="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="查看日志">${validate_component(FileText, "FileText").$$render($$result, { class: "w-4 h-4" }, {}, {})}</a> </div></td> </tr>`;
  }) : `<tr data-svelte-h="svelte-dm7dkk"><td colspan="9" class="py-12 text-center text-gray-500">暂无寄存记录</td> </tr>`}</tbody></table></div></div> ${``}</div>`}`;
});
export {
  Page as default
};
