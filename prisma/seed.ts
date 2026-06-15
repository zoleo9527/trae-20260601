import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const Role = {
  RECEPTIONIST: "RECEPTIONIST",
  TECHNICIAN: "TECHNICIAN",
  MANAGER: "MANAGER",
} as const;

const WorkOrderStatus = {
  PENDING_INSPECTION: "PENDING_INSPECTION",
  INSPECTION_IN_PROGRESS: "INSPECTION_IN_PROGRESS",
  QUOTE_READY: "QUOTE_READY",
  CUSTOMER_CONFIRMED: "CUSTOMER_CONFIRMED",
  CUSTOMER_REJECTED: "CUSTOMER_REJECTED",
  REPAIR_IN_PROGRESS: "REPAIR_IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

async function seed() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  const receptionist = await db.user.upsert({
    where: { email: "qiantai@repair.com" },
    update: {},
    create: {
      email: "qiantai@repair.com",
      name: "李小美（前台）",
      passwordHash: hashedPassword,
      role: Role.RECEPTIONIST,
    },
  });

  const technician = await db.user.upsert({
    where: { email: "weixiu@repair.com" },
    update: {},
    create: {
      email: "weixiu@repair.com",
      name: "张大强（维修师）",
      passwordHash: hashedPassword,
      role: Role.TECHNICIAN,
    },
  });

  const technician2 = await db.user.upsert({
    where: { email: "weixiu2@repair.com" },
    update: {},
    create: {
      email: "weixiu2@repair.com",
      name: "王师傅（维修师）",
      passwordHash: hashedPassword,
      role: Role.TECHNICIAN,
    },
  });

  const manager = await db.user.upsert({
    where: { email: "dianzhang@repair.com" },
    update: {},
    create: {
      email: "dianzhang@repair.com",
      name: "赵经理（店长）",
      passwordHash: hashedPassword,
      role: Role.MANAGER,
    },
  });

  console.log("演示账号已创建:");
  console.log("前台: qiantai@repair.com / password123");
  console.log("维修师1: weixiu@repair.com / password123");
  console.log("维修师2: weixiu2@repair.com / password123");
  console.log("店长: dianzhang@repair.com / password123");

  const ordersData = [
    {
      orderNo: "WO20260615001",
      customerName: "陈先生",
      customerPhone: "13800000001",
      deviceBrand: "苹果",
      deviceModel: "iPhone 14 Pro",
      deviceImei: "351234567890123",
      deviceColor: "深空黑",
      faultDescription: "屏幕碎裂，触摸失灵",
      appearanceNotes: "边框有轻微划痕，后盖完好",
      accessoryItems: "原装充电器 x1，手机盒 x1",
      status: WorkOrderStatus.PENDING_INSPECTION,
      receivedById: receptionist.id,
    },
    {
      orderNo: "WO20260615002",
      customerName: "刘女士",
      customerPhone: "13800000002",
      deviceBrand: "华为",
      deviceModel: "Mate 60 Pro",
      deviceImei: "861234567890123",
      deviceColor: "雅川青",
      faultDescription: "进水无法开机",
      appearanceNotes: "机身有明显水渍痕迹",
      accessoryItems: "无",
      status: WorkOrderStatus.INSPECTION_IN_PROGRESS,
      receivedById: receptionist.id,
      assignedTechnicianId: technician.id,
      technicianAssignedAt: new Date(),
    },
    {
      orderNo: "WO20260615003",
      customerName: "王先生",
      customerPhone: "13800000003",
      deviceBrand: "小米",
      deviceModel: "小米 14 Ultra",
      deviceImei: "869876543210987",
      deviceColor: "白色",
      faultDescription: "电池不耐用，耗电快",
      appearanceNotes: "外观几乎全新",
      accessoryItems: "原装充电器 x1",
      status: WorkOrderStatus.QUOTE_READY,
      receivedById: receptionist.id,
      assignedTechnicianId: technician.id,
      technicianAssignedAt: new Date(Date.now() - 3600000),
    },
    {
      orderNo: "WO20260615004",
      customerName: "张女士",
      customerPhone: "13800000004",
      deviceBrand: "苹果",
      deviceModel: "iPhone 15",
      deviceImei: "359999999999999",
      deviceColor: "粉色",
      faultDescription: "后置摄像头黑屏",
      appearanceNotes: "外观完好",
      accessoryItems: "无",
      status: WorkOrderStatus.CUSTOMER_CONFIRMED,
      receivedById: receptionist.id,
      assignedTechnicianId: technician2.id,
      technicianAssignedAt: new Date(Date.now() - 7200000),
    },
    {
      orderNo: "WO20260615005",
      customerName: "孙先生",
      customerPhone: "13800000005",
      deviceBrand: "OPPO",
      deviceModel: "Find X7 Ultra",
      deviceColor: "海阔天空",
      faultDescription: "充电口松动，无法正常充电",
      appearanceNotes: "充电口附近有磨损",
      accessoryItems: "无",
      status: WorkOrderStatus.COMPLETED,
      receivedById: receptionist.id,
      assignedTechnicianId: technician.id,
      technicianAssignedAt: new Date(Date.now() - 86400000),
    },
    {
      orderNo: "WO20260615006",
      customerName: "周先生",
      customerPhone: "13800000006",
      deviceBrand: "VIVO",
      deviceModel: "X100 Pro",
      deviceColor: "蓝色",
      faultDescription: "系统频繁死机重启",
      appearanceNotes: "外观完好",
      accessoryItems: "原装充电器 x1",
      status: WorkOrderStatus.CUSTOMER_REJECTED,
      receivedById: receptionist.id,
      assignedTechnicianId: technician2.id,
      technicianAssignedAt: new Date(Date.now() - 10800000),
    },
  ];

  for (const data of ordersData) {
    await db.workOrder.upsert({
      where: { orderNo: data.orderNo },
      update: {},
      create: data,
    });
  }
  console.log(`已创建 ${ordersData.length} 个示例工单`);

  const order3 = await db.workOrder.findUnique({ where: { orderNo: "WO20260615003" } });
  if (order3) {
    await db.inspectionQuote.upsert({
      where: { workOrderId: order3.id },
      update: {},
      create: {
        workOrderId: order3.id,
        faultDiagnosis: "电池健康度仅 62%，存在明显老化。主板功耗检测正常，排除漏电因素。",
        keyJudgments: "1. 确认电池为原装且无鼓包现象；\n2. 主板供电电路检测正常，无短路漏电；\n3. 建议更换原装电池，维修后预计续航恢复 90% 以上。",
        repairSolution: "更换原厂正品电池，进行电池健康校准。",
        estimatedDuration: "约 40 分钟",
        riskWarning: "无明显风险，电池更换为常规操作。",
        laborCost: 80,
        partsTotal: 399,
        totalAmount: 479,
        createdById: technician.id,
        parts: {
          create: [
            {
              partName: "小米14 Ultra 原装电池",
              partNumber: "BP48",
              quantity: 1,
              unitPrice: 399,
              inStock: true,
              stockLocation: "A区-03-12",
            },
          ],
        },
      },
    });
    console.log(`已为工单 ${order3.orderNo} 创建检测报价`);

    await db.timelineEvent.create({
      data: {
        workOrderId: order3.id,
        fromStatus: WorkOrderStatus.INSPECTION_IN_PROGRESS,
        toStatus: WorkOrderStatus.QUOTE_READY,
        eventType: "QUOTE_CREATED",
        description: "维修师完成检测，已提交报价单，等待客户确认。",
        responsibleId: technician.id,
      },
    });
  }

  const order4 = await db.workOrder.findUnique({ where: { orderNo: "WO20260615004" } });
  if (order4) {
    await db.inspectionQuote.upsert({
      where: { workOrderId: order4.id },
      update: {},
      create: {
        workOrderId: order4.id,
        faultDiagnosis: "后置摄像头排线接口松动，摄像头模组本身检测正常。",
        keyJudgments: "1. 前置摄像头功能正常，排除系统级相机故障；\n2. 拆解后发现后置摄像头排线卡扣松脱；\n3. 非硬件损坏，无需更换摄像头模组。",
        repairSolution: "重新插拔并固定摄像头排线，清理内部灰尘。",
        estimatedDuration: "约 30 分钟",
        riskWarning: "拆机过程注意避免触碰 Face ID 点阵模块。",
        laborCost: 120,
        partsTotal: 0,
        totalAmount: 120,
        createdById: technician2.id,
      },
    });

    await db.customerConfirmation.upsert({
      where: { workOrderId: order4.id },
      update: {},
      create: {
        workOrderId: order4.id,
        decision: "APPROVED",
        customerName: "张女士",
        customerPhone: "13800000004",
        customerSignature: "zhang_nvshi_sign_001",
        confirmedById: receptionist.id,
      },
    });

    await db.timelineEvent.createMany({
      data: [
        {
          workOrderId: order4.id,
          fromStatus: WorkOrderStatus.INSPECTION_IN_PROGRESS,
          toStatus: WorkOrderStatus.QUOTE_READY,
          eventType: "QUOTE_CREATED",
          description: "维修师完成检测并提交报价。",
          responsibleId: technician2.id,
          createdAt: new Date(Date.now() - 3600000),
        },
        {
          workOrderId: order4.id,
          fromStatus: WorkOrderStatus.QUOTE_READY,
          toStatus: WorkOrderStatus.CUSTOMER_CONFIRMED,
          eventType: "CUSTOMER_APPROVED",
          description: "客户签字确认同意维修方案及报价。",
          responsibleId: receptionist.id,
        },
      ],
    });
    console.log(`已为工单 ${order4.orderNo} 创建报价和客户确认记录`);
  }

  const order5 = await db.workOrder.findUnique({ where: { orderNo: "WO20260615005" } });
  if (order5) {
    await db.inspectionQuote.upsert({
      where: { workOrderId: order5.id },
      update: {},
      create: {
        workOrderId: order5.id,
        faultDiagnosis: "充电接口内部金属触点氧化磨损，导致接触不良。",
        keyJudgments: "1. 更换充电线测试确认故障在尾插而非线材；\n2. 主板充电管理芯片检测正常；\n3. 更换尾插小板即可解决。",
        repairSolution: "更换尾插排线组件。",
        estimatedDuration: "约 50 分钟",
        riskWarning: "无。",
        laborCost: 100,
        partsTotal: 180,
        totalAmount: 280,
        createdById: technician.id,
        parts: {
          create: [
            {
              partName: "OPPO Find X7 Ultra 尾插排线",
              partNumber: "OP-FX7U-TC",
              quantity: 1,
              unitPrice: 180,
              inStock: true,
              stockLocation: "B区-02-08",
            },
          ],
        },
      },
    });

    await db.customerConfirmation.upsert({
      where: { workOrderId: order5.id },
      update: {},
      create: {
        workOrderId: order5.id,
        decision: "APPROVED",
        customerName: "孙先生",
        customerPhone: "13800000005",
        customerSignature: "sun_xiansheng_sign_005",
        confirmedById: receptionist.id,
      },
    });

    await db.timelineEvent.createMany({
      data: [
        {
          workOrderId: order5.id,
          fromStatus: WorkOrderStatus.PENDING_INSPECTION,
          toStatus: WorkOrderStatus.INSPECTION_IN_PROGRESS,
          eventType: "ASSIGNED",
          description: "工单已分配给维修师。",
          responsibleId: receptionist.id,
          createdAt: new Date(Date.now() - 86400000),
        },
        {
          workOrderId: order5.id,
          fromStatus: WorkOrderStatus.INSPECTION_IN_PROGRESS,
          toStatus: WorkOrderStatus.QUOTE_READY,
          eventType: "QUOTE_CREATED",
          description: "维修师完成检测并提交报价。",
          responsibleId: technician.id,
          createdAt: new Date(Date.now() - 82800000),
        },
        {
          workOrderId: order5.id,
          fromStatus: WorkOrderStatus.QUOTE_READY,
          toStatus: WorkOrderStatus.CUSTOMER_CONFIRMED,
          eventType: "CUSTOMER_APPROVED",
          description: "客户确认报价。",
          responsibleId: receptionist.id,
          createdAt: new Date(Date.now() - 79200000),
        },
        {
          workOrderId: order5.id,
          fromStatus: WorkOrderStatus.CUSTOMER_CONFIRMED,
          toStatus: WorkOrderStatus.REPAIR_IN_PROGRESS,
          eventType: "REPAIR_STARTED",
          description: "维修师开始维修。",
          responsibleId: technician.id,
          createdAt: new Date(Date.now() - 75600000),
        },
        {
          workOrderId: order5.id,
          fromStatus: WorkOrderStatus.REPAIR_IN_PROGRESS,
          toStatus: WorkOrderStatus.COMPLETED,
          eventType: "REPAIR_COMPLETED",
          description: "维修完成，质检通过，等待取机。",
          responsibleId: technician.id,
          createdAt: new Date(Date.now() - 36000000),
        },
      ],
    });
    console.log(`已为工单 ${order5.orderNo} 创建完整流程记录`);
  }

  const order6 = await db.workOrder.findUnique({ where: { orderNo: "WO20260615006" } });
  if (order6) {
    await db.inspectionQuote.upsert({
      where: { workOrderId: order6.id },
      update: {},
      create: {
        workOrderId: order6.id,
        faultDiagnosis: "主板 CPU 虚焊导致系统不稳定，可能需要重植或更换主板。",
        keyJudgments: "1. 软件刷机后故障依旧，排除系统问题；\n2. 检测到 CPU 周边电流异常波动；\n3. 重植成功率约 70%，失败则需更换主板。",
        repairSolution: "方案A：CPU 重植（成功率约70%）；方案B：直接更换主板。",
        estimatedDuration: "约 3-4 小时",
        riskWarning: "重植失败可能导致主板彻底报废，需客户明确知晓风险。",
        laborCost: 500,
        partsTotal: 0,
        totalAmount: 500,
        createdById: technician2.id,
      },
    });

    await db.customerConfirmation.upsert({
      where: { workOrderId: order6.id },
      update: {},
      create: {
        workOrderId: order6.id,
        decision: "REJECTED",
        customerName: "周先生",
        customerPhone: "13800000006",
        rejectReason: "维修价格太高，而且风险太大，不修了。",
        confirmedById: receptionist.id,
      },
    });

    await db.alert.create({
      data: {
        workOrderId: order6.id,
        alertType: "CUSTOMER_REJECTED_ALERT",
        title: "客户拒绝报价",
        message: "周先生的 VIVO X100 Pro 工单客户已拒绝维修，原因是价格过高且风险较大。请安排处理退回。",
        assignedToId: manager.id,
      },
    });

    await db.timelineEvent.createMany({
      data: [
        {
          workOrderId: order6.id,
          fromStatus: WorkOrderStatus.PENDING_INSPECTION,
          toStatus: WorkOrderStatus.INSPECTION_IN_PROGRESS,
          eventType: "ASSIGNED",
          description: "工单已分配给维修师。",
          responsibleId: receptionist.id,
          createdAt: new Date(Date.now() - 10800000),
        },
        {
          workOrderId: order6.id,
          fromStatus: WorkOrderStatus.INSPECTION_IN_PROGRESS,
          toStatus: WorkOrderStatus.QUOTE_READY,
          eventType: "QUOTE_CREATED",
          description: "维修师完成检测并提交报价。",
          responsibleId: technician2.id,
          createdAt: new Date(Date.now() - 7200000),
        },
        {
          workOrderId: order6.id,
          fromStatus: WorkOrderStatus.QUOTE_READY,
          toStatus: WorkOrderStatus.CUSTOMER_REJECTED,
          eventType: "CUSTOMER_REJECTED",
          description: "客户拒绝报价，原因：价格太高风险大。",
          responsibleId: receptionist.id,
          createdAt: new Date(Date.now() - 3600000),
        },
      ],
    });

    console.log(`已为工单 ${order6.orderNo} 创建客户拒绝记录和异常提醒`);
  }

  console.log("\n种子数据初始化完成！");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
