import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, note, operatorId, operatorName } = body;

    const exception = await prisma.exceptionRecord.findUnique({
      where: { id: params.id },
      include: {
        application: {
          select: {
            id: true,
            borrowerName: true,
            borrowerPhone: true,
            status: true,
          },
        },
        repayment: {
          include: {
            application: {
              select: {
                borrowerName: true,
                borrowerPhone: true,
              },
            },
          },
        },
        reminders: {
          orderBy: { sentAt: "desc" },
        },
      },
    });

    if (!exception) {
      return NextResponse.json(
        { error: "异常记录不存在" },
        { status: 404 }
      );
    }

    const oldStatus = exception.status;

    await prisma.exceptionRecord.update({
      where: { id: params.id },
      data: {
        status: action === "REMIND" ? "PROCESSING" : "RESOLVED",
        resolution: note,
        resolvedAt: action !== "REMIND" ? new Date() : undefined,
      },
    });

    await prisma.operationLog.create({
      data: {
        businessId: params.id,
        businessType: "EXCEPTION",
        action: action === "REMIND" ? "发送提醒" : 
                action === "RETURN" ? "退回处理" :
                action === "SUPPLEMENT" ? "补充资料" : "催收处理",
        operatorId: operatorId || "unknown",
        operatorName: operatorName || "操作员",
        fromStatus: oldStatus,
        toStatus: action === "REMIND" ? "PROCESSING" : "RESOLVED",
        details: note,
      },
    });

    if (action === "REMIND") {
      const recipient = exception.businessType === "APPLICATION"
        ? exception.application?.borrowerPhone
        : exception.repayment?.application?.borrowerPhone;

      await prisma.systemReminder.create({
        data: {
          exceptionId: params.id,
          type: "SMS",
          content: note || "您的业务存在异常，请尽快处理",
          recipient: recipient || "",
          status: "SENT",
        },
      });

      await prisma.systemReminder.create({
        data: {
          exceptionId: params.id,
          type: "PHONE",
          content: `电话提醒: ${note}`,
          recipient: recipient || "",
          status: "SENT",
        },
      });

      await prisma.operationLog.create({
        data: {
          businessId: params.id,
          businessType: "EXCEPTION",
          action: "发送短信和电话提醒",
          operatorId: "system",
          operatorName: "系统",
          details: `已发送至${recipient}`,
        },
      });
    }

    if (action === "RETURN" && exception.businessType === "APPLICATION" && exception.applicationId) {
      await prisma.loanApplication.update({
        where: { id: exception.applicationId },
        data: { status: "APPROVED" },
      });

      await prisma.operationLog.create({
        data: {
          businessId: exception.applicationId,
          businessType: "APPLICATION",
          action: "退回放款确认环节",
          operatorId: operatorId || "unknown",
          operatorName: operatorName || "操作员",
          fromStatus: exception.application?.status || "",
          toStatus: "APPROVED",
          details: `因异常处理退回: ${note}`,
        },
      });
    }

    if (action === "COLLECTION" && exception.businessType === "REPAYMENT" && exception.repaymentId) {
      await prisma.collectionRecord.create({
        data: {
          repaymentId: exception.repaymentId,
          method: "电话催收",
          result: note,
        },
      });

      await prisma.operationLog.create({
        data: {
          businessId: exception.repaymentId,
          businessType: "REPAYMENT",
          action: "添加催收记录",
          operatorId: operatorId || "unknown",
          operatorName: operatorName || "操作员",
          details: `催收结果: ${note}`,
        },
      });

      const recipient = exception.repayment?.application?.borrowerPhone;
      await prisma.systemReminder.create({
        data: {
          exceptionId: params.id,
          type: "PHONE",
          content: `催收电话: ${note}`,
          recipient: recipient || "",
          status: "SENT",
        },
      });
    }

    if (action === "SUPPLEMENT") {
      const recipient = exception.businessType === "APPLICATION"
        ? exception.application?.borrowerPhone
        : exception.repayment?.application?.borrowerPhone;

      await prisma.systemReminder.create({
        data: {
          exceptionId: params.id,
          type: "SMS",
          content: `请补充资料: ${note}`,
          recipient: recipient || "",
          status: "SENT",
        },
      });

      await prisma.operationLog.create({
        data: {
          businessId: params.id,
          businessType: "EXCEPTION",
          action: "发送补录通知",
          operatorId: "system",
          operatorName: "系统",
          details: `已发送至${recipient}`,
        },
      });
    }

    const [updatedException, logs] = await Promise.all([
      prisma.exceptionRecord.findUnique({
        where: { id: params.id },
        include: {
          application: true,
          repayment: {
            include: {
              application: true,
            },
          },
          reminders: {
            orderBy: { sentAt: "desc" },
          },
        },
      }),
      prisma.operationLog.findMany({
        where: {
          businessId: params.id,
          businessType: "EXCEPTION",
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      ...updatedException,
      logs,
    });
  } catch (error) {
    console.error("处理异常失败:", error);
    return NextResponse.json(
      { error: "处理异常失败" },
      { status: 500 }
    );
  }
}