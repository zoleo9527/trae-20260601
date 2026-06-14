import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, action, reason, requiredDocuments, operatorId, operatorName } = body;

    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: "借款申请不存在" },
        { status: 404 }
      );
    }

    const operator = await prisma.user.findUnique({
      where: { id: operatorId || "user-operator-1" },
    });

    const confirmation = await prisma.loanConfirmation.create({
      data: {
        applicationId,
        operatorId: operatorId || "user-operator-1",
        action,
        reason,
      },
      include: {
        application: true,
        operator: true,
      },
    });

    let newStatus = application.status;
    if (action === "CONFIRM") {
      newStatus = "CONFIRMED";
    } else if (action === "REJECT") {
      newStatus = "REJECTED";
    } else if (action === "REQUEST_INFO") {
      newStatus = "RISK_REVIEW";
    }

    await prisma.loanApplication.update({
      where: { id: applicationId },
      data: { status: newStatus },
    });

    await prisma.operationLog.create({
      data: {
        businessId: applicationId,
        businessType: "APPLICATION",
        action: action === "CONFIRM" ? "确认放款" : action === "REJECT" ? "驳回申请" : "要求补录资料",
        operatorId: operatorId || "user-operator-1",
        operatorName: operator?.name || "操作员",
        fromStatus: application.status,
        toStatus: newStatus,
        details: reason || undefined,
      },
    });

    if (action === "CONFIRM") {
      const periods = 12;
      const periodAmount = application.amount / periods;

      for (let i = 1; i <= periods; i++) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30 * i);

        await prisma.repaymentPlan.create({
          data: {
            applicationId,
            period: i,
            amount: periodAmount,
            dueDate,
            status: "PENDING",
            paidAmount: 0,
          },
        });
      }

      await prisma.loanApplication.update({
        where: { id: applicationId },
        data: { status: "DISBURSED" },
      });

      await prisma.operationLog.create({
        data: {
          businessId: applicationId,
          businessType: "APPLICATION",
          action: "放款完成",
          operatorId: operatorId || "user-operator-1",
          operatorName: operator?.name || "操作员",
          fromStatus: "CONFIRMED",
          toStatus: "DISBURSED",
          details: `生成${periods}期还款计划`,
        },
      });
    }

    if (action === "REQUEST_INFO" || action === "REJECT") {
      const exception = await prisma.exceptionRecord.create({
        data: {
          applicationId: applicationId,
          businessType: "APPLICATION",
          type: action === "REQUEST_INFO" ? "INFO_MISSING" : "REJECTION",
          description: reason || (action === "REQUEST_INFO" ? "需要补录资料" : "申请驳回"),
          status: "OPEN",
        },
      });

      await prisma.operationLog.create({
        data: {
          businessId: exception.id,
          businessType: "EXCEPTION",
          action: "创建异常记录",
          operatorId: operatorId || "user-operator-1",
          operatorName: operator?.name || "操作员",
          toStatus: "OPEN",
          details: `${action === "REQUEST_INFO" ? "需要补录资料" : "申请驳回"}: ${reason || ""}`,
        },
      });

      if (action === "REQUEST_INFO") {
        await prisma.systemReminder.create({
          data: {
            exceptionId: exception.id,
            type: "SMS",
            content: `您的借款申请需要补录资料: ${reason || "请联系工作人员"}`,
            recipient: application.borrowerPhone,
            status: "SENT",
          },
        });

        await prisma.operationLog.create({
          data: {
            businessId: exception.id,
            businessType: "EXCEPTION",
            action: "发送补录提醒",
            operatorId: "system",
            operatorName: "系统",
            details: `已发送短信至${application.borrowerPhone}`,
          },
        });
      }
    }

    return NextResponse.json(confirmation);
  } catch (error) {
    console.error("创建放款确认失败:", error);
    return NextResponse.json(
      { error: "创建放款确认失败" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const confirmation = await prisma.loanConfirmation.findUnique({
      where: { id: params.id },
      include: {
        application: true,
        operator: true,
      },
    });

    if (!confirmation) {
      return NextResponse.json(
        { error: "放款确认记录不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(confirmation);
  } catch (error) {
    console.error("获取放款确认记录失败:", error);
    return NextResponse.json(
      { error: "获取放款确认记录失败" },
      { status: 500 }
    );
  }
}