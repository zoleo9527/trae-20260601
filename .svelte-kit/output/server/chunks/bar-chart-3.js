import { c as create_ssr_component, v as validate_component } from "./ssr.js";
import { I as Icon } from "./Icon.js";
const Bar_chart_3 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const iconNode = [
    ["path", { "d": "M3 3v18h18" }],
    ["path", { "d": "M18 17V9" }],
    ["path", { "d": "M13 17V5" }],
    ["path", { "d": "M8 17v-3" }]
  ];
  return `${validate_component(Icon, "Icon").$$render($$result, Object.assign({}, { name: "bar-chart-3" }, $$props, { iconNode }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const BarChart3 = Bar_chart_3;
export {
  BarChart3 as B
};
