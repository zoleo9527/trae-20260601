import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireUserId } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import { Role, AlertStatus } from "~/utils/constants";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const role = url.searchParams.get("role");

  const where: any = { status: AlertStatus.ACTIVE };

  if (role === Role.TECHNICIAN && userId) {
    where.OR = [
      { assignedToId: userId },
      { workOrder: { assignedTechnicianId: userId } },
    ];
  }
  // 前台和店长看到全部活跃异常

  const alerts = await prisma.alert.findMany({
    where,
    include: {
      workOrder: {
        select: { id: true, orderNo: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return json({ alerts });
};
