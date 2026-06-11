import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: { select: { testRecords: true, materialRequisitions: true, cableRoutes: true } },
      },
    });
    if (!project) return json({ error: "项目不存在" }, { status: 404 });
    return json({ project });
  }

  const projects = await prisma.project.findMany({
    include: {
      _count: { select: { testRecords: true, materialRequisitions: true, cableRoutes: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return json({ projects });
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();
  const { action: op } = body;

  switch (op) {
    case "create": {
      const { name, code, address } = body;
      if (!name || !code) {
        return json({ error: "name, code 必填" }, { status: 400 });
      }
      const existing = await prisma.project.findUnique({ where: { code } });
      if (existing) {
        return json({ error: `项目编码 ${code} 已存在` }, { status: 409 });
      }
      const project = await prisma.project.create({
        data: { name, code, address: address || null },
      });
      return json({ project }, { status: 201 });
    }

    default:
      return json({ error: `不支持的操作: ${op}` }, { status: 400 });
  }
}
