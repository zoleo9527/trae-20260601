import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { createCableRoute, listCableRoutes, updateCableRoute } from "~/services/cable-route.service";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) {
    return json({ error: "projectId 必填" }, { status: 400 });
  }
  const testRecordId = url.searchParams.get("testRecordId") || undefined;
  const routes = await listCableRoutes(projectId, testRecordId);
  return json({ routes });
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();
  const { action: op } = body;

  switch (op) {
    case "create": {
      const { projectId, testRecordId, routeName, startPoint, endPoint, cableType, length, description } = body;
      if (!projectId || !routeName || !startPoint || !endPoint || !cableType || length === undefined) {
        return json({ error: "projectId, routeName, startPoint, endPoint, cableType, length 必填" }, { status: 400 });
      }
      const route = await createCableRoute({
        projectId,
        testRecordId,
        routeName,
        startPoint,
        endPoint,
        cableType,
        length,
        description,
      });
      return json({ route }, { status: 201 });
    }

    case "update": {
      const { id, routeName, startPoint, endPoint, cableType, length, description } = body;
      if (!id) {
        return json({ error: "id 必填" }, { status: 400 });
      }
      const route = await updateCableRoute(id, {
        routeName,
        startPoint,
        endPoint,
        cableType,
        length,
        description,
      });
      return json({ route });
    }

    default:
      return json({ error: `不支持的操作: ${op}` }, { status: 400 });
  }
}
