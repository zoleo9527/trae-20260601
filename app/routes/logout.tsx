import type { ActionFunctionArgs } from "@remix-run/node";
import { logout } from "~/utils/simpleSession";

export async function action({ request }: ActionFunctionArgs) {
  return logout(request);
}
