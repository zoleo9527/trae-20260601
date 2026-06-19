import { c as create_ssr_component, v as validate_component, d as add_attribute, f as each, e as escape } from "../../../../chunks/ssr.js";
import { A as ArrowLeft, S as Save } from "../../../../chunks/save.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let user;
  let { data } = $$props;
  let customer_name = "";
  let phone = "";
  let wine_name = "";
  let quantity = 1;
  const bottleSizes = [
    {
      value: "standard",
      label: "标准瓶 (750ml)"
    },
    {
      value: "magnum",
      label: "大瓶 (1.5L)"
    },
    {
      value: "jeroboam",
      label: "杰罗波安 (3L)"
    },
    {
      value: "split",
      label: "小瓶 (187ml)"
    },
    { value: "other", label: "其他" }
  ];
  const storageLocations = [
    { value: "cellar", label: "酒窖" },
    { value: "bar", label: "吧台" },
    { value: "vip", label: "VIP区" },
    {
      value: "locker",
      label: "储物柜"
    }
  ];
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  user = data.user;
  return `${!user ? `<div class="min-h-screen flex items-center justify-center" data-svelte-h="svelte-19y3vto"><p class="text-gray-500">请先登录</p></div>` : `<div><div class="flex items-center space-x-4 mb-6"><a href="/wine-storage" class="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">${validate_component(ArrowLeft, "ArrowLeft").$$render($$result, { class: "w-5 h-5" }, {}, {})} <span data-svelte-h="svelte-y94d90">返回</span></a> <div data-svelte-h="svelte-z5ysjn"><h1 class="text-2xl font-bold text-gray-800">寄存酒水</h1> <p class="text-gray-500 mt-1">记录客户寄存的酒水信息</p></div></div> <div class="bg-white rounded-xl shadow-sm p-6">${``} ${``} <form class="space-y-6"><div class="grid grid-cols-2 gap-6"><div><label class="block text-sm font-medium text-gray-700 mb-2" data-svelte-h="svelte-5ml9gm">客户姓名 <span class="text-red-500">*</span></label> <input type="text" placeholder="请输入客户姓名" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"${add_attribute("value", customer_name, 0)}></div> <div><label class="block text-sm font-medium text-gray-700 mb-2" data-svelte-h="svelte-kn9zau">联系电话 <span class="text-red-500">*</span></label> <input type="tel" placeholder="请输入联系电话" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"${add_attribute("value", phone, 0)}></div></div> <div><label class="block text-sm font-medium text-gray-700 mb-2" data-svelte-h="svelte-11qflxw">酒名 <span class="text-red-500">*</span></label> <input type="text" placeholder="请输入酒名" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"${add_attribute("value", wine_name, 0)}></div> <div class="grid grid-cols-3 gap-6"><div><label class="block text-sm font-medium text-gray-700 mb-2" data-svelte-h="svelte-aanyow">数量（瓶）</label> <input type="number" min="1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"${add_attribute("value", quantity, 0)}></div> <div><label class="block text-sm font-medium text-gray-700 mb-2" data-svelte-h="svelte-hwe0di">规格</label> <select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors">${each(bottleSizes, (option) => {
    return `<option${add_attribute("value", option.value, 0)}>${escape(option.label)}</option>`;
  })}</select></div> <div><label class="block text-sm font-medium text-gray-700 mb-2" data-svelte-h="svelte-fr0njr">存放位置</label> <select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors">${each(storageLocations, (option) => {
    return `<option${add_attribute("value", option.value, 0)}>${escape(option.label)}</option>`;
  })}</select></div></div> <div><label class="block text-sm font-medium text-gray-700 mb-2" data-svelte-h="svelte-whn34t">备注</label> <textarea rows="3" placeholder="请输入备注信息" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors resize-none">${escape("")}</textarea></div> <div class="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200"><a href="/wine-storage" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" data-svelte-h="svelte-3tw84v">取消</a> <button type="submit" class="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">${validate_component(Save, "Save").$$render($$result, { class: "w-4 h-4" }, {}, {})} <span data-svelte-h="svelte-1gb7vxb">保存</span></button></div></form></div></div>`}`;
});
export {
  Page as default
};
