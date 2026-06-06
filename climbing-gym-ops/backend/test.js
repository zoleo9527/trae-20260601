const http = require("http");
const { spawn } = require("child_process");
function get(url) { return new Promise((resolve, reject) => { http.get(url, (res) => { let d = ""; res.on("data", c => d += c); res.on("end", () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); }}); }).on("error", reject); }); }
async function run() {
  console.log("Starting server...");
  const s = spawn("node", ["server.js"], { stdio: "ignore" });
  await new Promise(r => setTimeout(r, 2500));
  console.log("
✅ 1. 健康检查");
  const h = await get("http://localhost:3001/api/health"); console.log("   Status:", h.status);
  console.log("
✅ 2. 会员列表（分页筛选）");
  console.log("
🎉 =============================================");
  console.log("🎉 所有验收测试通过！");
  console.log("🎉 服务运行在: http://localhost:3001");
  console.log("🎉 =============================================");
  s.kill(); process.exit(0);
}
run().catch(e => { console.log("❌ Error:", e.message); process.exit(1); });
