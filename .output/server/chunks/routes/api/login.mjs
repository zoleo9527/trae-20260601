import { d as defineEventHandler, r as readBody } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const users = [
  { username: "clerk", password: "123456", role: "\u5E97\u5458", name: "\u5F20\u4E09", storeCode: "BJ-WJ-001", storeName: "\u671D\u9633\u533A\u671B\u4EAC\u5E97" },
  { username: "manager", password: "123456", role: "\u5E97\u957F", name: "\u738B\u4E94", storeCode: "BJ-ZG-002", storeName: "\u6D77\u6DC0\u533A\u4E2D\u5173\u6751\u5E97" },
  { username: "admin", password: "123456", role: "\u7247\u533A\u7BA1\u7406\u5458", name: "\u5B59\u516B", storeCode: "", storeName: "\u5317\u4EAC\u7247\u533A" }
];
const login = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password } = body;
  const user = users.find((u) => u.username === username && u.password === password);
  if (user) {
    return {
      success: true,
      data: {
        username: user.username,
        name: user.name,
        role: user.role,
        storeCode: user.storeCode,
        storeName: user.storeName
      }
    };
  }
  return { success: false, message: "\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF" };
});

export { login as default };
//# sourceMappingURL=login.mjs.map
