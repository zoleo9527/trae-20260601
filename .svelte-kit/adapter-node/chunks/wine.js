import { c as create_ssr_component, v as validate_component } from "./ssr.js";
import { I as Icon } from "./Icon.js";
const Wine = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["path", { "d": "M8 22h8" }],
    ["path", { "d": "M7 10h10" }],
    ["path", { "d": "M12 15v7" }],
    [
      "path",
      {
        "d": "M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"
      }
    ]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "wine" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const Wine$1 = Wine;
export {
  Wine$1 as W
};
