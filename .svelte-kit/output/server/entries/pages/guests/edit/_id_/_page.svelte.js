import { c as create_ssr_component, b as subscribe } from "../../../../../chunks/ssr.js";
import { p as page } from "../../../../../chunks/stores.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let user;
  let $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => value);
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  user = data.user;
  $$unsubscribe_page();
  return `${!user ? `<div class="min-h-screen flex items-center justify-center" data-svelte-h="svelte-19y3vto"><p class="text-gray-500">请先登录</p></div>` : `${`<div class="min-h-screen flex items-center justify-center" data-svelte-h="svelte-17kna5z"><p class="text-gray-500">嘉宾不存在</p></div>`}`}`;
});
export {
  Page as default
};
