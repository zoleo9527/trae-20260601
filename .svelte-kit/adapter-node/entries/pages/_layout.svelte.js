import { c as create_ssr_component, v as validate_component, e as escape } from "../../chunks/ssr.js";
import { B as BarChart3 } from "../../chunks/bar-chart-3.js";
import { M as Music } from "../../chunks/music.js";
import { C as Calendar } from "../../chunks/calendar.js";
import { W as Wine } from "../../chunks/wine.js";
import { F as FileText } from "../../chunks/file-text.js";
import { U as User } from "../../chunks/user.js";
const _layout_svelte_svelte_type_style_lang = "";
const css = {
  code: "body{margin:0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif}",
  map: null
};
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let user;
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  $$result.css.add(css);
  user = data.user;
  return `${!user ? `${slots.default ? slots.default({}) : ``}` : `<div class="min-h-screen bg-gray-100"><nav class="bg-white shadow-md"><div class="max-w-7xl mx-auto px-4"><div class="flex items-center justify-between h-16"><div class="flex items-center space-x-3"><a href="/" class="flex items-center space-x-3"><div class="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">${validate_component(BarChart3, "BarChart3").$$render($$result, { class: "w-6 h-6 text-white" }, {}, {})}</div> <span class="text-xl font-bold text-gray-800" data-svelte-h="svelte-i4xuk2">酒吧运营系统</span></a></div> <div class="flex items-center space-x-6"><a href="/guests" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">${validate_component(Music, "Music").$$render($$result, { class: "w-5 h-5" }, {}, {})} <span data-svelte-h="svelte-huct3z">嘉宾名单</span></a> <a href="/performances" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">${validate_component(Calendar, "Calendar").$$render($$result, { class: "w-5 h-5" }, {}, {})} <span data-svelte-h="svelte-us17cd">演出排班</span></a> <a href="/reservations" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">${validate_component(BarChart3, "BarChart3").$$render($$result, { class: "w-5 h-5" }, {}, {})} <span data-svelte-h="svelte-2jm6yz">订台记录</span></a> <a href="/wine-storage" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">${validate_component(Wine, "Wine").$$render($$result, { class: "w-5 h-5" }, {}, {})} <span data-svelte-h="svelte-15bf6i0">酒水寄存</span></a> <a href="/logs" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">${validate_component(FileText, "FileText").$$render($$result, { class: "w-5 h-5" }, {}, {})} <span data-svelte-h="svelte-17q1yf">操作日志</span></a> <button class="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">${validate_component(User, "User").$$render($$result, { class: "w-4 h-4" }, {}, {})} <span>${escape(user.username)}</span> <span class="text-gray-400" data-svelte-h="svelte-iz1zsv">退出</span></button></div></div></div></nav> <main class="max-w-7xl mx-auto px-4 py-8">${slots.default ? slots.default({}) : ``}</main></div>`}`;
});
export {
  Layout as default
};
