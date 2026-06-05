import { d as defineEventHandler } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'better-sqlite3';
import 'path';
import 'fs';
import 'url';

const demoAccounts_get = defineEventHandler(async (event) => {
  return {
    accounts: [
      { role: "rental", name: "\u5F20\u79DF\u8D41", description: "\u79DF\u8D41\u67DC\u53F0\u4EBA\u5458\uFF0C\u53EF\u521B\u5EFA\u5DE1\u67E5\u5355\u3001\u67E5\u770B\u79DF\u8D41\u76F8\u5173\u5F85\u529E" },
      { role: "coach", name: "\u674E\u6559\u7EC3", description: "\u6559\u7EC3\u4E3B\u7BA1\uFF0C\u53EF\u5BA1\u6838\u98CE\u9669\u4E0A\u62A5\u3001\u5904\u7406\u6539\u671F\u6216\u9A73\u56DE" },
      { role: "patrol", name: "\u738B\u5DE1\u903B", description: "\u5B89\u5168\u5DE1\u903B\u5458\uFF0C\u53EF\u6267\u884C\u5DE1\u67E5\u3001\u4E0A\u62A5\u98CE\u9669\u3001\u8865\u5145\u5907\u6CE8" }
    ]
  };
});

export { demoAccounts_get as default };
//# sourceMappingURL=demo-accounts.get.mjs.map
