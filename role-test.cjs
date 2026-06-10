const http = require("http");
const BASE = "http://localhost:3002";

function request(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = { hostname: url.hostname, port: url.port, path: url.pathname, method, headers: { "Content-Type": "application/json" } };
    if (cookie) opts.headers.Cookie = cookie;
    const req = http.request(opts, (res) => {
      const setCookie = res.headers["set-cookie"];
      let data = ""; res.on("data", (c) => (data += c)); res.on("end", () => resolve({ status: res.statusCode, body: data, setCookie }));
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function extractCookie(setCookieArr) {
  if (!setCookieArr) return "";
  for (const h of setCookieArr) { if (h.startsWith("bike_ops_session=")) return h.split(";")[0]; }
  return "";
}

function parsePage(body) {
  const m = body.match(/__NEXT_DATA__[^>]*>(.*?)<\/script>/);
  if (!m) return null;
  return JSON.parse(m[1]);
}

async function main() {
  const accounts = [
    { username: "inspector01", label: "张巡检" },
    { username: "inspector02", label: "李巡检" },
    { username: "dispatcher01", label: "王调度" },
    { username: "manager01", label: "赵经理" },
  ];

  console.log("\n============ 角色差异验证 ============\n");

  for (const acc of accounts) {
    const lr = await request("POST", "/api/auth/login", { username: acc.username, password: "123456" }, "");
    const cookie = extractCookie(lr.setCookie);
    const pr = await request("GET", "/", null, cookie);
    const pd = parsePage(pr.body);
    if (!pd) { console.log(`${acc.label}: 页面解析失败`); continue; }

    const user = pd.props.pageProps.user;
    const hotspots = pd.props.pageProps.hotspots;
    const inspectors = pd.props.pageProps.inspectors;

    const myTodo = hotspots.filter(h => {
      const o = h.dispatchOrders?.[0];
      return o?.assignee?.id === user.id && (h.status === "DISPATCHED" || h.status === "IN_PROGRESS");
    });

    console.log(`【${acc.label}】(${user.role})`);
    console.log(`  总热点: ${hotspots.length}`);
    console.log(`  我的待办: ${myTodo.length}`);
    console.log(`  巡检员列表(供筛选): ${inspectors?.length || 0}人`);

    for (const h of hotspots) {
      const order = h.dispatchOrders?.[0];
      const isMine = order?.assignee?.id === user.id;
      const hint = !order ? "无派单"
        : h.status === "DISPATCHED" && !order.acceptedAt ? "⏳待接单"
        : h.status === "DISPATCHED" && order.acceptedAt ? "📞已接单"
        : h.status === "IN_PROGRESS" ? "🔧处理中"
        : h.status === "COMPLETED" ? "✅已完成"
        : h.status === "PENDING" ? "📋待派单" : h.status;
      const dispatchTime = h.dispatchedAt ? `派单于${h.dispatchedAt.slice(11, 16)}` : "未派单";
      const mineTag = isMine ? " [指派给我]" : "";
      console.log(`  - ${h.title.slice(0, 12)}… | ${h.status} | ${hint} | ${dispatchTime}${mineTag}`);
    }
    console.log("");
  }
}

main().catch(e => { console.error(e); process.exit(1); });
