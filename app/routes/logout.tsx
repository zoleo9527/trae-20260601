import type { ActionFunction } from "@remix-run/node";
import { logout } from "~/utils/session.server";

export const action: ActionFunction = async ({ request }) => {
  return logout(request);
};

export const loader = async () => {
  return new Response("Method Not Allowed", { status: 405 });
};
