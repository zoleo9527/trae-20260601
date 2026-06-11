import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import type { Role } from "~/types";
import { setRoleCookie } from "~/utils/role.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const role = formData.get("role") as Role;

  if (role !== "supervisor" && role !== "property" && role !== "engineer") {
    return json({ ok: false, error: "无效角色" }, { status: 400 });
  }

  return json(
    { ok: true, role },
    {
      headers: {
        "Set-Cookie": setRoleCookie(role),
      },
    }
  );
};
