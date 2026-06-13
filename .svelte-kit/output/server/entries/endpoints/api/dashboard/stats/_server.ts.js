import { json } from "@sveltejs/kit";
import { d as db } from "../../../../../chunks/db.js";
const GET = async ({ cookies }) => {
  const sessionCookie = cookies.get("session");
  if (!sessionCookie) {
    return json({ error: "未登录" }, { status: 401 });
  }
  const total = db.prepare("SELECT COUNT(*) as count FROM risk_alerts").get();
  const pending = db.prepare("SELECT COUNT(*) as count FROM risk_alerts WHERE status = ?").get("pending");
  const processing = db.prepare("SELECT COUNT(*) as count FROM risk_alerts WHERE status = ?").get("processing");
  const confirming = db.prepare("SELECT COUNT(*) as count FROM risk_alerts WHERE status = ?").get("confirming");
  const completed = db.prepare("SELECT COUNT(*) as count FROM risk_alerts WHERE status = ?").get("completed");
  const closed = db.prepare("SELECT COUNT(*) as count FROM risk_alerts WHERE status = ?").get("closed");
  const high = db.prepare("SELECT COUNT(*) as count FROM risk_alerts WHERE severity = ?").get("high");
  const medium = db.prepare("SELECT COUNT(*) as count FROM risk_alerts WHERE severity = ?").get("medium");
  const low = db.prepare("SELECT COUNT(*) as count FROM risk_alerts WHERE severity = ?").get("low");
  const typeStats = db.prepare("SELECT type, COUNT(*) as count FROM risk_alerts GROUP BY type").all();
  const byType = {};
  typeStats.forEach((stat) => {
    byType[stat.type] = stat.count;
  });
  return json({
    total: total.count,
    pending: pending.count,
    processing: processing.count,
    confirming: confirming.count,
    completed: completed.count,
    closed: closed.count,
    bySeverity: {
      high: high.count,
      medium: medium.count,
      low: low.count
    },
    byType
  });
};
export {
  GET
};
