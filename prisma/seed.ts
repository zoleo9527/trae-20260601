import { PrismaClient } from "@prisma/client";
import { addDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  const operator = await prisma.user.create({
    data: {
      id: "user-operator-1",
      name: "张操作员",
      role: "OPERATOR",
    },
  });

  const admin = await prisma.user.create({
    data: {
      id: "user-admin-1",
      name: "李管理员",
      role: "ADMIN",
    },
  });

  console.log("创建用户完成");

  const applications = [
    {
      id: "app-1",
      borrowerName: "王小明",
      borrowerPhone: "13800138001",
      amount: 50000,
      purpose: "个人消费",
      status: "PENDING",
    },
    {
      id: "app-2",
      borrowerName: "李小红",
      borrowerPhone: "13800138002",
      amount: 100000,
      purpose: "创业资金",
      status: "RISK_REVIEW",
    },
    {
      id: "app-3",
      borrowerName: "张小刚",
      borrowerPhone: "13800138003",
      amount: 30000,
      purpose: "医疗费用",
      status: "APPROVED",
    },
    {
      id: "app-4",
      borrowerName: "刘小芳",
      borrowerPhone: "13800138004",
      amount: 80000,
      purpose: "房屋装修",
      status: "CONFIRMED",
    },
    {
      id: "app-5",
      borrowerName: "陈小华",
      borrowerPhone: "13800138005",
      amount: 20000,
      purpose: "教育培训",
      status: "DISBURSED",
    },
    {
      id: "app-6",
      borrowerName: "赵小强",
      borrowerPhone: "13800138006",
      amount: 150000,
      purpose: "购车",
      status: "REJECTED",
    },
    {
      id: "app-7",
      borrowerName: "孙小丽",
      borrowerPhone: "13800138007",
      amount: 60000,
      purpose: "旅游",
      status: "PENDING",
    },
    {
      id: "app-8",
      borrowerName: "周小伟",
      borrowerPhone: "13800138008",
      amount: 40000,
      purpose: "家电购买",
      status: "RISK_REVIEW",
    },
    {
      id: "app-9",
      borrowerName: "吴小梅",
      borrowerPhone: "13800138009",
      amount: 120000,
      purpose: "创业资金",
      status: "APPROVED",
    },
    {
      id: "app-10",
      borrowerName: "郑小龙",
      borrowerPhone: "13800138010",
      amount: 25000,
      purpose: "个人消费",
      status: "CONFIRMED",
    },
  ];

  for (const appData of applications) {
    const application = await prisma.loanApplication.create({
      data: appData,
    });

    await prisma.riskControlDocument.create({
      data: {
        applicationId: application.id,
        type: "身份证",
        status: application.status === "REJECTED" ? "REJECTED" : "APPROVED",
      },
    });

    await prisma.riskControlDocument.create({
      data: {
        applicationId: application.id,
        type: "收入证明",
        status: application.status === "REJECTED" ? "REJECTED" : "APPROVED",
      },
    });

    if (application.status === "CONFIRMED" || application.status === "DISBURSED") {
      await prisma.loanConfirmation.create({
        data: {
          id: `conf-${application.id}`,
          applicationId: application.id,
          operatorId: operator.id,
          action: "CONFIRM",
          confirmedAt: addDays(application.createdAt, 1),
        },
      });

      await prisma.operationLog.create({
        data: {
          businessId: application.id,
          businessType: "APPLICATION",
          action: "确认放款",
          operatorId: operator.id,
          operatorName: operator.name,
          fromStatus: "APPROVED",
          toStatus: "CONFIRMED",
        },
      });
    }

    if (application.status === "REJECTED") {
      await prisma.loanConfirmation.create({
        data: {
          id: `conf-${application.id}`,
          applicationId: application.id,
          operatorId: operator.id,
          action: "REJECT",
          reason: "风控审核不通过，征信记录不良",
          confirmedAt: addDays(application.createdAt, 1),
        },
      });

      await prisma.operationLog.create({
        data: {
          businessId: application.id,
          businessType: "APPLICATION",
          action: "驳回申请",
          operatorId: operator.id,
          operatorName: operator.name,
          fromStatus: "APPROVED",
          toStatus: "REJECTED",
          details: "风控审核不通过，征信记录不良",
        },
      });

      const exception = await prisma.exceptionRecord.create({
        data: {
          applicationId: application.id,
          businessType: "APPLICATION",
          type: "REJECTION",
          description: "风控审核驳回",
          status: "RESOLVED",
          resolution: "已通知借款人",
          resolvedAt: addDays(application.createdAt, 2),
        },
      });

      await prisma.operationLog.create({
        data: {
          businessId: exception.id,
          businessType: "EXCEPTION",
          action: "创建异常记录",
          operatorId: operator.id,
          operatorName: operator.name,
          toStatus: "OPEN",
          details: "风控审核驳回",
        },
      });

      await prisma.systemReminder.create({
        data: {
          exceptionId: exception.id,
          type: "SMS",
          content: "您的借款申请已被驳回，原因：风控审核不通过",
          recipient: application.borrowerPhone,
          status: "SENT",
        },
      });

      await prisma.operationLog.create({
        data: {
          businessId: exception.id,
          businessType: "EXCEPTION",
          action: "发送驳回通知",
          operatorId: "system",
          operatorName: "系统",
          details: `已发送短信至${application.borrowerPhone}`,
        },
      });
    }

    if (application.status === "DISBURSED") {
      const periods = 12;
      const periodAmount = application.amount / periods;

      await prisma.operationLog.create({
        data: {
          businessId: application.id,
          businessType: "APPLICATION",
          action: "放款完成",
          operatorId: operator.id,
          operatorName: operator.name,
          fromStatus: "CONFIRMED",
          toStatus: "DISBURSED",
          details: `生成${periods}期还款计划`,
        },
      });

      for (let i = 1; i <= periods; i++) {
        const dueDate = addDays(application.createdAt, 30 * i);
        const status = i <= 3 ? "PAID" : i === 4 ? "OVERDUE" : i === 5 ? "PARTIAL_PAID" : "PENDING";
        const paidAmount = i <= 3 ? periodAmount : i === 5 ? periodAmount * 0.6 : 0;

        const repaymentPlan = await prisma.repaymentPlan.create({
          data: {
            applicationId: application.id,
            period: i,
            amount: periodAmount,
            dueDate,
            status,
            paidAmount,
          },
        });

        if (status === "PAID") {
          await prisma.operationLog.create({
            data: {
              businessId: repaymentPlan.id,
              businessType: "REPAYMENT",
              action: "完成还款",
              operatorId: "system",
              operatorName: "系统",
              fromStatus: "PENDING",
              toStatus: "PAID",
              details: `还款金额: ¥${periodAmount}`,
            },
          });
        }

        if (status === "OVERDUE") {
          await prisma.collectionRecord.create({
            data: {
              repaymentId: repaymentPlan.id,
              method: "电话催收",
              result: "部分还款，承诺下周补齐",
              collectedAt: addDays(dueDate, 5),
            },
          });

          const exception = await prisma.exceptionRecord.create({
            data: {
              repaymentId: repaymentPlan.id,
              businessType: "REPAYMENT",
              type: "OVERDUE",
              description: `第${i}期还款逾期`,
              status: "PROCESSING",
            },
          });

          await prisma.operationLog.create({
            data: {
              businessId: exception.id,
              businessType: "EXCEPTION",
              action: "标记还款异常",
              operatorId: operator.id,
              operatorName: operator.name,
              toStatus: "OPEN",
              details: `第${i}期还款逾期`,
            },
          });

          await prisma.systemReminder.create({
            data: {
              exceptionId: exception.id,
              type: "SMS",
              content: `您第${i}期还款已逾期，请尽快处理`,
              recipient: application.borrowerPhone,
              status: "SENT",
            },
          });

          await prisma.operationLog.create({
            data: {
              businessId: exception.id,
              businessType: "EXCEPTION",
              action: "发送逾期提醒",
              operatorId: "system",
              operatorName: "系统",
              details: `已发送短信至${application.borrowerPhone}`,
            },
          });
        }

        if (status === "PARTIAL_PAID") {
          await prisma.operationLog.create({
            data: {
              businessId: repaymentPlan.id,
              businessType: "REPAYMENT",
              action: "部分还款",
              operatorId: "system",
              operatorName: "系统",
              fromStatus: "PENDING",
              toStatus: "PARTIAL_PAID",
              details: `还款金额: ¥${paidAmount}, 累计已还: ¥${paidAmount}`,
            },
          });

          const exception = await prisma.exceptionRecord.create({
            data: {
              repaymentId: repaymentPlan.id,
              businessType: "REPAYMENT",
              type: "PARTIAL_PAYMENT",
              description: `第${i}期部分还款，剩余¥${periodAmount - paidAmount}未还`,
              status: "OPEN",
            },
          });

          await prisma.operationLog.create({
            data: {
              businessId: exception.id,
              businessType: "EXCEPTION",
              action: "创建部分还款异常",
              operatorId: "system",
              operatorName: "系统",
              toStatus: "OPEN",
              details: `部分还款异常已自动创建`,
            },
          });

          await prisma.systemReminder.create({
            data: {
              exceptionId: exception.id,
              type: "SMS",
              content: `您第${i}期还款已部分完成，剩余¥${periodAmount - paidAmount}请尽快补齐`,
              recipient: application.borrowerPhone,
              status: "SENT",
            },
          });
        }
      }
    }
  }

  console.log("创建借款申请完成");

  const appNeedInfo = await prisma.loanApplication.create({
    data: {
      id: "app-11",
      borrowerName: "钱小宝",
      borrowerPhone: "13800138011",
      amount: 70000,
      purpose: "创业资金",
      status: "RISK_REVIEW",
    },
  });

  await prisma.riskControlDocument.create({
    data: {
      applicationId: appNeedInfo.id,
      type: "身份证",
      status: "APPROVED",
    },
  });

  const exceptionNeedInfo = await prisma.exceptionRecord.create({
    data: {
      applicationId: appNeedInfo.id,
      businessType: "APPLICATION",
      type: "INFO_MISSING",
      description: "缺少收入证明和征信报告",
      status: "OPEN",
    },
  });

  await prisma.operationLog.create({
    data: {
      businessId: exceptionNeedInfo.id,
      businessType: "EXCEPTION",
      action: "创建异常记录",
      operatorId: operator.id,
      operatorName: operator.name,
      toStatus: "OPEN",
      details: "缺少收入证明和征信报告",
    },
  });

  await prisma.systemReminder.create({
    data: {
      exceptionId: exceptionNeedInfo.id,
      type: "SMS",
      content: "您的借款申请需要补录资料：缺少收入证明和征信报告",
      recipient: appNeedInfo.borrowerPhone,
      status: "SENT",
    },
  });

  await prisma.operationLog.create({
    data: {
      businessId: exceptionNeedInfo.id,
      businessType: "EXCEPTION",
      action: "发送补录提醒",
      operatorId: "system",
      operatorName: "系统",
      details: `已发送短信至${appNeedInfo.borrowerPhone}`,
    },
  });

  console.log("种子数据创建完成！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });