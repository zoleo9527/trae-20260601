import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDetails(details: string | null): Record<string, any> {
  if (!details) return {};
  try {
    return JSON.parse(details);
  } catch {
    return { note: details };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const businessId = params.businessId;

    const application = await prisma.loanApplication.findUnique({
      where: { id: businessId },
      include: {
        riskDocuments: true,
        confirmation: {
          include: {
            operator: true,
          },
        },
        repaymentPlans: {
          include: {
            collections: true,
            exceptions: {
              include: {
                reminders: true,
              },
            },
          },
          orderBy: { period: "asc" },
        },
        exceptions: {
          include: {
            reminders: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "业务记录不存在" },
        { status: 404 }
      );
    }

    const timeline = [];

    timeline.push({
      id: `event-${application.id}-create`,
      timestamp: application.createdAt,
      action: "提交借款申请",
      operator: application.borrowerName,
      toStatus: "PENDING",
      details: {
        amount: `¥${application.amount}`,
        purpose: application.purpose,
        phone: application.borrowerPhone,
      },
    });

    application.riskDocuments.forEach((doc, index) => {
      timeline.push({
        id: `event-${application.id}-doc-${index}`,
        timestamp: doc.uploadedAt,
        action: `上传${doc.type}`,
        operator: "系统",
        details: {
          documentType: doc.type,
          documentStatus: doc.status,
        },
      });
    });

    const operationLogs = await prisma.operationLog.findMany({
      where: {
        businessId: businessId,
        businessType: "APPLICATION",
      },
      orderBy: { createdAt: "asc" },
    });

    operationLogs.forEach((log) => {
      timeline.push({
        id: log.id,
        businessId: log.businessId,
        businessType: log.businessType,
        timestamp: log.createdAt,
        action: log.action,
        operator: log.operatorName,
        fromStatus: log.fromStatus,
        toStatus: log.toStatus,
        details: parseDetails(log.details),
      });
    });

    if (application.confirmation) {
      timeline.push({
        id: `event-${application.id}-confirmation`,
        timestamp: application.confirmation.confirmedAt,
        action:
          application.confirmation.action === "CONFIRM"
            ? "确认放款"
            : application.confirmation.action === "REJECT"
            ? "驳回申请"
            : "要求补录资料",
        operator: application.confirmation.operator?.name || "操作员",
        details: {
          reason: application.confirmation.reason,
        },
      });
    }

    const repaymentIds = application.repaymentPlans?.map(p => p.id) || [];
    const exceptionIds = [
      ...(application.repaymentPlans?.flatMap(p => p.exceptions?.map(e => e.id) || []) || []),
      ...(application.exceptions?.map(e => e.id) || []),
    ];

    const [repaymentLogs, exceptionLogs] = await Promise.all([
      prisma.operationLog.findMany({
        where: {
          businessId: { in: repaymentIds },
          businessType: "REPAYMENT",
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.operationLog.findMany({
        where: {
          businessId: { in: exceptionIds },
          businessType: "EXCEPTION",
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const repaymentLogsMap = new Map<string, any[]>();
    repaymentLogs.forEach(log => {
      const logs = repaymentLogsMap.get(log.businessId) || [];
      logs.push(log);
      repaymentLogsMap.set(log.businessId, logs);
    });

    const exceptionLogsMap = new Map<string, any[]>();
    exceptionLogs.forEach(log => {
      const logs = exceptionLogsMap.get(log.businessId) || [];
      logs.push(log);
      exceptionLogsMap.set(log.businessId, logs);
    });

    application.repaymentPlans?.forEach((plan) => {
      timeline.push({
        id: `event-${plan.id}-create`,
        timestamp: plan.dueDate,
        action: `第${plan.period}期还款计划`,
        operator: "系统",
        details: {
          amount: `¥${plan.amount}`,
          status: plan.status,
          paidAmount: `¥${plan.paidAmount}`,
        },
      });

      const planLogs = repaymentLogsMap.get(plan.id) || [];
      planLogs.forEach((log) => {
        timeline.push({
          id: log.id,
          businessId: log.businessId,
          businessType: log.businessType,
          timestamp: log.createdAt,
          action: log.action,
          operator: log.operatorName,
          fromStatus: log.fromStatus,
          toStatus: log.toStatus,
          details: parseDetails(log.details),
        });
      });

      plan.collections?.forEach((collection, index) => {
        timeline.push({
          id: `event-${collection.id}-${index}`,
          timestamp: collection.collectedAt,
          action: `催收记录 - ${collection.method}`,
          operator: "催收员",
          details: {
            result: collection.result,
          },
        });
      });

      plan.exceptions?.forEach((exception) => {
        timeline.push({
          id: `event-${exception.id}-create`,
          timestamp: exception.createdAt,
          action: `异常标记 - ${exception.type}`,
          operator: "操作员",
          details: {
            description: exception.description,
            status: exception.status,
          },
        });

        const exLogs = exceptionLogsMap.get(exception.id) || [];
        exLogs.forEach((log) => {
          timeline.push({
            id: log.id,
            businessId: log.businessId,
            businessType: log.businessType,
            timestamp: log.createdAt,
            action: log.action,
            operator: log.operatorName,
            fromStatus: log.fromStatus,
            toStatus: log.toStatus,
            details: parseDetails(log.details),
          });
        });

        exception.reminders?.forEach((reminder) => {
          timeline.push({
            id: `event-${reminder.id}`,
            timestamp: reminder.sentAt,
            action: `发送${reminder.type === "SMS" ? "短信" : reminder.type === "PHONE" ? "电话" : "邮件"}提醒`,
            operator: "系统",
            details: {
              content: reminder.content,
              recipient: reminder.recipient,
              status: reminder.status,
            },
          });
        });

        if (exception.resolvedAt) {
          timeline.push({
            id: `event-${exception.id}-resolve`,
            timestamp: exception.resolvedAt,
            action: "异常已处理",
            operator: "操作员",
            details: {
              resolution: exception.resolution,
            },
          });
        }
      });
    });

    application.exceptions?.forEach((exception) => {
      timeline.push({
        id: `event-${exception.id}-create`,
        timestamp: exception.createdAt,
        action: `异常标记 - ${exception.type}`,
        operator: "操作员",
        details: {
          description: exception.description,
          status: exception.status,
        },
      });

      const exLogs = exceptionLogsMap.get(exception.id) || [];
      exLogs.forEach((log) => {
        timeline.push({
          id: log.id,
          businessId: log.businessId,
          businessType: log.businessType,
          timestamp: log.createdAt,
          action: log.action,
          operator: log.operatorName,
          fromStatus: log.fromStatus,
          toStatus: log.toStatus,
          details: parseDetails(log.details),
        });
      });

      exception.reminders?.forEach((reminder) => {
        timeline.push({
          id: `event-${reminder.id}`,
          timestamp: reminder.sentAt,
          action: `发送${reminder.type === "SMS" ? "短信" : reminder.type === "PHONE" ? "电话" : "邮件"}提醒`,
          operator: "系统",
          details: {
            content: reminder.content,
            recipient: reminder.recipient,
            status: reminder.status,
          },
        });
      });

      if (exception.resolvedAt) {
        timeline.push({
          id: `event-${exception.id}-resolve`,
          timestamp: exception.resolvedAt,
          action: "异常已处理",
          operator: "操作员",
          details: {
            resolution: exception.resolution,
          },
        });
      }
    });

    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return NextResponse.json({
      businessId,
      businessType: "APPLICATION",
      timeline,
      application: {
        borrowerName: application.borrowerName,
        borrowerPhone: application.borrowerPhone,
        amount: application.amount,
        purpose: application.purpose,
        status: application.status,
      },
    });
  } catch (error) {
    console.error("获取业务流程历史失败:", error);
    return NextResponse.json(
      { error: "获取业务流程历史失败" },
      { status: 500 }
    );
  }
}