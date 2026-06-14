import { ActionFunctionArgs } from "@remix-run/node";
import { logout } from "../auth/session";

export async function action({ request }: ActionFunctionArgs) {
  return logout(request);
}
