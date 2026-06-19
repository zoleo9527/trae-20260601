import { c as create_ssr_component, v as validate_component, e as escape, d as add_attribute } from "../../chunks/ssr.js";
import { I as Icon } from "../../chunks/Icon.js";
import { M as Music, C as Calendar, B as BarChart3, W as Wine } from "../../chunks/wine.js";
import { U as User } from "../../chunks/user.js";
const Lock = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    [
      "rect",
      {
        "width": "18",
        "height": "11",
        "x": "3",
        "y": "11",
        "rx": "2",
        "ry": "2"
      }
    ],
    ["path", { "d": "M7 11V7a5 5 0 0 1 10 0v4" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "lock" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Lock$1 = Lock;
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let user;
  let { data } = $$props;
  let username = "";
  let password = "";
  let guestCount = 0;
  let performanceCount = 0;
  let reservationCount = 0;
  let wineCount = 0;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  user = data.user;
  return `${user ? `<div><div class="flex items-center justify-between mb-6" data-svelte-h="svelte-1453hie"><div><h1 class="text-2xl font-bold text-gray-800">系统概览</h1> <p class="text-gray-500 mt-1">酒吧运营数据总览</p></div></div> <div class="grid grid-cols-4 gap-6 mb-8"><div class="bg-white rounded-xl shadow-sm p-6"><div class="flex items-center justify-between"><div><p class="text-gray-500 text-sm" data-svelte-h="svelte-1te62ss">嘉宾数量</p> <p class="text-3xl font-bold text-gray-800 mt-2">${escape(guestCount)}</p></div> <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">${validate_component(Music, "Music").$$render($$result, { class: "w-6 h-6 text-purple-600" }, {}, {})}</div></div></div> <div class="bg-white rounded-xl shadow-sm p-6"><div class="flex items-center justify-between"><div><p class="text-gray-500 text-sm" data-svelte-h="svelte-11upo0d">演出安排</p> <p class="text-3xl font-bold text-gray-800 mt-2">${escape(performanceCount)}</p></div> <div class="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">${validate_component(Calendar, "Calendar").$$render($$result, { class: "w-6 h-6 text-pink-600" }, {}, {})}</div></div></div> <div class="bg-white rounded-xl shadow-sm p-6"><div class="flex items-center justify-between"><div><p class="text-gray-500 text-sm" data-svelte-h="svelte-10hh0q1">订台记录</p> <p class="text-3xl font-bold text-gray-800 mt-2">${escape(reservationCount)}</p></div> <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">${validate_component(BarChart3, "BarChart3").$$render($$result, { class: "w-6 h-6 text-blue-600" }, {}, {})}</div></div></div> <div class="bg-white rounded-xl shadow-sm p-6"><div class="flex items-center justify-between"><div><p class="text-gray-500 text-sm" data-svelte-h="svelte-zdjmkc">寄存酒水</p> <p class="text-3xl font-bold text-gray-800 mt-2">${escape(wineCount)}</p></div> <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">${validate_component(Wine, "Wine").$$render($$result, { class: "w-6 h-6 text-green-600" }, {}, {})}</div></div></div></div> <div class="bg-white rounded-xl shadow-sm p-6"><h2 class="text-xl font-semibold text-gray-800 mb-4" data-svelte-h="svelte-1q4qux">快速操作</h2> <div class="grid grid-cols-4 gap-4"><a href="/guests/new" class="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">${validate_component(Music, "Music").$$render($$result, { class: "w-8 h-8 text-purple-600 mb-2" }, {}, {})} <span class="text-sm font-medium text-gray-700" data-svelte-h="svelte-1dpbo3d">添加嘉宾</span></a> <a href="/performances/new" class="flex flex-col items-center p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors">${validate_component(Calendar, "Calendar").$$render($$result, { class: "w-8 h-8 text-pink-600 mb-2" }, {}, {})} <span class="text-sm font-medium text-gray-700" data-svelte-h="svelte-1xqmmxg">安排演出</span></a> <a href="/reservations/new" class="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">${validate_component(BarChart3, "BarChart3").$$render($$result, { class: "w-8 h-8 text-blue-600 mb-2" }, {}, {})} <span class="text-sm font-medium text-gray-700" data-svelte-h="svelte-1ylhbm1">新增订台</span></a> <a href="/wine-storage/new" class="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">${validate_component(Wine, "Wine").$$render($$result, { class: "w-8 h-8 text-green-600 mb-2" }, {}, {})} <span class="text-sm font-medium text-gray-700" data-svelte-h="svelte-98io53">寄存酒水</span></a></div></div></div>` : `<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"><div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl"><div class="text-center mb-8"><div class="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">${validate_component(BarChart3, "BarChart3").$$render($$result, { class: "w-10 h-10 text-white" }, {}, {})}</div> <h1 class="text-3xl font-bold text-white" data-svelte-h="svelte-n94f2e">酒吧运营系统</h1> <p class="text-gray-300 mt-2" data-svelte-h="svelte-10sbny3">演出排班与嘉宾名单管理</p></div> <form class="space-y-6"><div><label class="block text-white/80 text-sm font-medium mb-2" data-svelte-h="svelte-10a79st">用户名</label> <div class="relative">${validate_component(User, "User").$$render(
    $$result,
    {
      class: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
    },
    {},
    {}
  )} <input type="text" placeholder="请输入用户名" class="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"${add_attribute("value", username, 0)}></div></div> <div><label class="block text-white/80 text-sm font-medium mb-2" data-svelte-h="svelte-1oe0r74">密码</label> <div class="relative">${validate_component(Lock$1, "Lock").$$render(
    $$result,
    {
      class: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
    },
    {},
    {}
  )} <input type="password" placeholder="请输入密码" class="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"${add_attribute("value", password, 0)}></div></div> ${``} <button type="submit" class="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]" data-svelte-h="svelte-1qg2r3m">登录</button></form> <div class="mt-6 text-center" data-svelte-h="svelte-kyxrvi"><p class="text-gray-400 text-sm">默认账号: admin / admin123</p></div></div></div>`}`;
});
export {
  Page as default
};
