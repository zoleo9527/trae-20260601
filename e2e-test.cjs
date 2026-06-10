const http = require("http");
const BASE = "http://localhost:3002";

function request(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (cookie) opts.headers["Cookie"] = cookie;
    const req = http.request(opts, (res) => {
      const setCookie = res.headers["set-cookie"];
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, body: data, setCookie }));
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function extractCookie(setCookieArr) {
  if (!setCookieArr) return "";
  for (const h of setCookieArr) {
    if (h.startsWith("bike_ops_session=")) {
      return h.split(";")[0];
    }
  }
  return "";
}

async function main() {
  let dispCookie = "";
  let inspCookie = "";
  let results = [];

  // 1. Unauth → 307
  const r1 = await request("GET", "/", null, "");
  results.push(["未登录访问首页", r1.status === 307 ? "✅ 307" : `❌ ${r1.status}`]);

  // 2. Unauth API → 401
  const r2 = await request("GET", "/api/users/inspectors", null, "");
  results.push(["未登录访问API", r2.status === 401 ? "✅ 401" : `❌ ${r2.status}`]);

  // 3. Login dispatcher
  const r3 = await request("POST", "/api/auth/login", { username: "dispatcher01", password: "123456" }, "");
  dispCookie = extractCookie(r3.setCookie);
  const d3 = JSON.parse(r3.body);
  results.push(["调度员登录", d3.user ? `✅ ${d3.user.name}` : "❌ 失败"]);

  // 4. Login → homepage 200
  const r4 = await request("GET", "/", null, dispCookie);
  results.push(["登录后首页", r4.status === 200 ? "✅ 200" : `❌ ${r4.status}`]);

  // 5. Login → API 200
  const r5 = await request("GET", "/api/users/inspectors", null, dispCookie);
  const d5 = JSON.parse(r5.body);
  results.push(["获取巡检员列表", d5.inspectors ? `✅ ${d5.inspectors.length}人` : "❌"]);

  // 6. Find PENDING hotspot from homepage
  const pageMatch = r4.body.match(/__NEXT_DATA__[^>]*>(.*?)<\/script>/);
  let hsId = "";
  if (pageMatch) {
    const pd = JSON.parse(pageMatch[1]);
    const pending = pd.props.pageProps.hotspots.find((h) => h.status === "PENDING");
    hsId = pending ? pending.id : "";
  }
  results.push(["找PENDING热点", hsId ? `✅ ${hsId.slice(-6)}` : "❌ 未找到"]);

  // 7. Dispatch
  const inspId = d5.inspectors?.[0]?.id || "";
  const r7 = await request("POST", `/api/hotspots/${hsId}/dispatch`, {
    instructions: "从漕溪路停车场调运35辆至现场",
    assigneeId: inspId,
  }, dispCookie);
  const d7 = JSON.parse(r7.body);
  const orderId = d7.order?.id || "";
  results.push(["调度派单", d7.ok ? `✅ 派单号${d7.order?.orderNo}` : `❌ ${r7.body}`]);

  // 8. Login inspector
  const r8 = await request("POST", "/api/auth/login", { username: "inspector01", password: "123456" }, "");
  inspCookie = extractCookie(r8.setCookie);
  const d8 = JSON.parse(r8.body);
  results.push(["巡检员登录", d8.user ? `✅ ${d8.user.name}` : "❌"]);

  // 9. Accept
  const r9 = await request("POST", `/api/hotspots/${hsId}/accept`, {
    dispatchId: orderId,
    remark: "收到，15分钟到达",
  }, inspCookie);
  const d9 = JSON.parse(r9.body);
  results.push(["巡检员接单", d9.ok ? "✅ ok" : `❌ ${r9.body}`]);

  // 10. Update
  const r10 = await request("POST", `/api/hotspots/${hsId}/update`, {
    dispatchId: orderId,
    content: "已到达现场，正在转运第一批20辆",
  }, inspCookie);
  results.push(["进度更新", r10.body.includes('"ok":true') ? "✅ ok" : `❌ ${r10.body}`]);

  // 11. Comment
  const r11 = await request("POST", `/api/hotspots/${hsId}/comment`, {
    content: "发现4辆损坏车辆，已标记待回收",
  }, inspCookie);
  results.push(["添加备注", r11.body.includes('"ok":true') ? "✅ ok" : `❌ ${r11.body}`]);

  // 12. Attach
  const r12 = await request("POST", `/api/hotspots/${hsId}/attach`, {
    filename: "现场处理中照片.jpg",
    fileType: "image/jpeg",
    fileSize: 2048000,
  }, inspCookie);
  results.push(["上传附件", r12.body.includes('"ok":true') ? "✅ ok" : `❌ ${r12.body}`]);

  // 13. Complete
  const r13 = await request("POST", `/api/hotspots/${hsId}/complete`, {
    dispatchId: orderId,
    content: "共转运35辆，现场清理完毕",
  }, inspCookie);
  results.push(["标记完成", r13.body.includes('"ok":true') ? "✅ ok" : `❌ ${r13.body}`]);

  // 14. Verify final status
  const r14 = await request("GET", `/hotspot/${hsId}`, null, dispCookie);
  const pm14 = r14.body.match(/__NEXT_DATA__[^>]*>(.*?)<\/script>/);
  if (pm14) {
    const d14 = JSON.parse(pm14[1]);
    const h = d14.props.pageProps.hotspot;
    results.push(["最终状态", `✅ ${h.status} | 备注${h.comments.length} | 附件${h.attachments.length}`]);
  } else {
    results.push(["最终状态", "❌ 解析失败"]);
  }

  // 15. Logout
  const r15 = await request("POST", "/api/auth/logout", null, dispCookie);
  const r16 = await request("GET", "/", null, dispCookie);
  results.push(["登出后首页", r16.status === 307 ? "✅ 307" : `❌ ${r16.status}`]);

  console.log("\n========== 端到端验证结果 ==========\n");
  for (const [step, result] of results) {
    console.log(`  ${step.padEnd(16)} ${result}`);
  }
  const fails = results.filter(([, r]) => r.startsWith("❌")).length;
  console.log(`\n总计: ${results.length}步 | 通过: ${results.length - fails} | 失败: ${fails}`);
  process.exit(fails > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
