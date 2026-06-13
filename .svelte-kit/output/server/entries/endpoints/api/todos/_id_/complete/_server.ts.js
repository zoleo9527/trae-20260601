import { json } from "@sveltejs/kit";
import { d as db } from "../../../../../../chunks/db.js";
const POST = async ({ params, request, cookies }) => {
  const sessionCookie = cookies.get("session");
  if (!sessionCookie) {
    return json({ error: "未登录" }, { status: 401 });
  }
  const session = JSON.parse(sessionCookie);
  const id = parseInt(params.id);
  const data = await request.json();
  const todo = db.prepare("SELECT * FROM todo_items WHERE id = ?").get(id);
  if (!todo) {
    return json({ error: "待办不存在" }, { status: 404 });
  }
  db.prepare("UPDATE todo_items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run("completed", id);
  if (todo.risk_alert_id) {
    db.prepare(`
			INSERT INTO operation_logs (risk_alert_id, user_id, action, description)
			VALUES (?, ?, '完成待办', ?)
		`).run(todo.risk_alert_id, session.userId, `完成待办：${todo.todo_type}${data.note ? `，备注：${data.note}` : ""}`);
  }
  return json({ success: true });
};
export {
  POST
};
