import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, paidAmount, operatorId, operatorName } = body;

    const oldRepayment = await prisma.repaymentPlan.findUnique({
      where: { id: params.id },
      include: {
        application: {
          select: {
            borrowerName: true,
            borrowerPhone: true,
          },
        },
      },
    });

    if (!oldRepayment) {
      return NextResponse.json(
        { error: "还款计划不存在" },
        { status: 404 }
      );
    }

    const repayment = await prisma.repaymentPlan.update({
      where: { id: params.id },
      data: {
        status,
        paidAmount: paidAmount !== undefined ? parseFloat(paidAmount) : undefined,
      },
      include: {
        application: true,
      },
    });

    await prisma.operationLog.create({
      data: {
        businessId: params.id,
        businessType: "REPAYMENT",
        action: status === "PAID" ? "完成还款" : "部分还款",
        operatorId: operatorId || "unknown",
        operatorName: operatorName || "操作员",
        fromStatus: oldRepayment.status,
        toStatus: status,
        details: paidAmount !== undefined 
          ? `还款金额: ¥${paidAmount}, 累计已还: ¥${repayment.paidAmount}`
          : undefined,
      },
    });

    if (status === "PARTIAL_PAID" && oldRepayment.status === "PENDING") {
      const exception = await prisma.exceptionRecord.create({
        data: {
          repaymentId: params.id,
          businessType: "REPAYMENT",
          type: "PARTIAL_PAYMENT",
          description: `第${oldRepayment.period}期部分还款，剩余¥${repayment.amount - repayment.paidAmount}未还`,
          status: "OPEN",
        },
      });

      await prisma.operationLog.create({
        data: {
          businessId: exception.id,
          businessType: "EXCEPTION",
          action: "创建部分还款异常",
          operatorId: operatorId || "unknown",
          operatorName: operatorName || "操作员",
          toStatus: "OPEN",
          details: `部分还款异常已自动创建`,
        },
      });

      await prisma.systemReminder.create({
        data: {
          exceptionId: exception.id,
          type: "SMS",
          content: `您第${oldRepayment.period}期还款已部分完成，剩余¥${repayment.amount - repayment.paidAmount}请尽快补齐`,
          recipient: oldRepayment.application?.borrowerPhone || "",
          status: "SENT",
        },
      });
    }

    return NextResponse.json(repayment);
  } catch (error) {
    console.error("更新还款状态失败:", error);
    return NextResponse.json(
      { error: "更新还款状态失败" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type, description, operatorId, operatorName } = body;

    const repayment = await prisma.repaymentPlan.findUnique({
      where: { id: params.id },
      include: {
        application: {
          select: {
            borrowerName: true,
            borrowerPhone: true,
          },
        },
      },
    });

    if (!repayment) {
      return NextResponse.json(
        { error: "还款计划不存在" },
        { status: 404 }
      );
    }

    const exception = await prisma.exceptionRecord.create({
      data: {
        repaymentId: params.id,
        businessType: "REPAYMENT",
        type,
        description,
        status: "OPEN",
      },
    });

    await prisma.operationLog.create({
      data: {
        businessId: exception.id,
        businessType: "EXCEPTION",
        action: "标记还款异常",
        operatorId: operatorId || "unknown",
        operatorName: operatorName || "操作员",
        toStatus: "OPEN",
        details: `${type}: ${description}`,
      },
    });

    if (type === "OVERDUE") {
      await prisma.repaymentPlan.update({
        where: { id: params.id },
        data: { status: "OVERDUE" },
      });

      await prisma.operationLog.create({
        data: {
          businessId: params.id,
          businessType: "REPAYMENT",
          action: "状态变更为逾期",
          operatorId: operatorId || "unknown",
          operatorName: operatorName || "操作员",
          fromStatus: repayment.status,
          toStatus: "OVERDUE",
          details: `因异常标记自动变更`,
        },
      });
    }

    await prisma.systemReminder.create({
      data: {
        exceptionId: exception.id,
        type: "SMS",
        content: `您的还款出现异常(${type}): ${description}，请尽快处理`,
        recipient: repayment.application?.borrowerPhone || "",
        status: "SENT",
      },
    });

    await prisma.operationLog.create({
      data: {
        businessId: exception.id,
        businessType: "EXCEPTION",
        action: "发送异常提醒",
        operatorId: "system",
        operatorName: "系统",
        details: `已发送短信至${repayment.application?.borrowerPhone}`,
      },
    });

    return NextResponse.json(exception);
  } catch (error) {
    console.error("标记还款异常失败:", error);
    return NextResponse.json(
      { error: "标记还款异常失败" },
      { status: 500 }
    );
  }
}