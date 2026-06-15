import { prisma } from "./prisma";
import type { OrderStatus, Role } from "@/types";
import { canTransition } from "./constants";
import type { PrismaClient } from "@prisma/client";

export interface AuthContext {
  userId: string;
  role: Role;
}

type Trans = [OrderStatus, OrderStatus];
type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export function assertRoleCanTransition(role: Role, from: OrderStatus, to: OrderStatus): void {
  const allowedByRole: Record<Role, Trans[]> = {
    RECEIVER: [],
    DETECTER: [
      ["RECEIVED", "DETECTED"],
      ["DETECTED", "BARGAIN_REVIEW"],
      ["DETECTED", "BARGAIN_APPROVED"],
      ["BARGAIN_REVIEW", "BARGAIN_APPROVED"],
      ["BARGAIN_REVIEW", "BARGAIN_REJECTED"],
      ["BARGAIN_REVIEW", "DETECTED"],
      ["BARGAIN_REJECTED", "DETECTED"],
      ["BARGAIN_APPROVED", "PAYMENT_REQUESTED"],
      ["PAYMENT_RETURNED", "BARGAIN_REVIEW"],
      ["PAYMENT_RETURNED", "PAYMENT_REQUESTED"],
    ],
    FINANCE: [
      ["PAYMENT_REQUESTED", "PAYMENT_PAID"],
      ["PAYMENT_REQUESTED", "PAYMENT_RETURNED"],
    ],
  };
  const list = allowedByRole[role];
  const ok = list.some(([f, t]) => f === from && t === to);
  if (!ok) {
    throw new Error(`当前角色无权限将状态从「${from}」变更为「${to}」`);
  }
}

// 核心内部实现：接受一个 tx 客户端，可嵌套在外部事务中
export async function transitionOrderStatusInternal(
  tx: TxClient,
  orderId: string,
  auth: AuthContext,
  to: OrderStatus,
  action: string,
  remark?: string,
  detail?: string
) {
  const order = await tx.recycleOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("回收单不存在");
  const from = order.status as OrderStatus;
  if (!canTransition(from, to)) {
    throw new Error(`不允许从「${from}」直接变更为「${to}」`);
  }
  assertRoleCanTransition(auth.role, from, to);

  const updated = await tx.recycleOrder.update({
    where: { id: orderId },
    data: {
      status: to,
      statusRemark: remark,
      ...(to === "DETECTED" ? { detectedAt: new Date() } : {}),
      ...(to === "CLOSED" ? { closedAt: new Date() } : {}),
    },
  });

  await tx.operationLog.create({
    data: {
      orderId,
      operatorId: auth.userId,
      fromStatus: from,
      toStatus: to,
      action,
      remark,
      detail,
    },
  });

  return updated;
}

// 对外 API：独立事务
export async function transitionOrderStatus(
  orderId: string,
  auth: AuthContext,
  to: OrderStatus,
  action: string,
  remark?: string,
  detail?: string
) {
  return prisma.$transaction((tx) =>
    transitionOrderStatusInternal(tx, orderId, auth, to, action, remark, detail)
  );
}
