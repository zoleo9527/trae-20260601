import { PrismaClient, InspectionStatus, InspectionGrade, UserRole, TimelineEventType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("开始播种数据...");

  const hashedPassword = await bcrypt.hash("123456", 10);

  const dormManager = await db.user.upsert({
    where: { username: "dorm1" },
    update: {},
    create: {
      username: "dorm1",
      passwordHash: hashedPassword,
      name: "李阿姨",
      role: UserRole.DORM_MANAGER,
      phone: "13800138001",
    },
  });

  const counselor = await db.user.upsert({
    where: { username: "counselor1" },
    update: {},
    create: {
      username: "counselor1",
      passwordHash: hashedPassword,
      name: "王老师",
      role: UserRole.COUNSELOR,
      phone: "13800138002",
    },
  });

  const maintenance = await db.user.upsert({
    where: { username: "maint1" },
    update: {},
    create: {
      username: "maint1",
      passwordHash: hashedPassword,
      name: "张师傅",
      role: UserRole.MAINTENANCE,
      phone: "13800138003",
    },
  });

  console.log("用户创建完成");

  const dormsData = [
    { building: "1号楼", roomNumber: "101", floor: 1, capacity: 4 },
    { building: "1号楼", roomNumber: "102", floor: 1, capacity: 4 },
    { building: "1号楼", roomNumber: "201", floor: 2, capacity: 6 },
    { building: "1号楼", roomNumber: "202", floor: 2, capacity: 4 },
    { building: "2号楼", roomNumber: "101", floor: 1, capacity: 4 },
    { building: "2号楼", roomNumber: "305", floor: 3, capacity: 4 },
  ];

  const dorms: any[] = [];
  for (const d of dormsData) {
    const dorm = await db.dorm.upsert({
      where: { building_roomNumber: { building: d.building, roomNumber: d.roomNumber } },
      update: {},
      create: d,
    });
    dorms.push(dorm);
  }

  console.log("宿舍创建完成");

  const studentsData = [
    { studentId: "2023001", name: "张伟", gender: "男", major: "计算机科学", grade: "2023级", dormIdx: 0 },
    { studentId: "2023002", name: "李娜", gender: "女", major: "计算机科学", grade: "2023级", dormIdx: 0 },
    { studentId: "2023003", name: "王强", gender: "男", major: "软件工程", grade: "2023级", dormIdx: 0 },
    { studentId: "2023004", name: "刘洋", gender: "男", major: "软件工程", grade: "2023级", dormIdx: 0 },
    { studentId: "2023005", name: "陈静", gender: "女", major: "数据科学", grade: "2023级", dormIdx: 1 },
    { studentId: "2023006", name: "赵磊", gender: "男", major: "数据科学", grade: "2023级", dormIdx: 1 },
    { studentId: "2022001", name: "孙明", gender: "男", major: "人工智能", grade: "2022级", dormIdx: 2 },
    { studentId: "2022002", name: "周芳", gender: "女", major: "人工智能", grade: "2022级", dormIdx: 2 },
  ];

  const students: any[] = [];
  for (const s of studentsData) {
    const student = await db.student.upsert({
      where: { studentId: s.studentId },
      update: {},
      create: {
        studentId: s.studentId,
        name: s.name,
        gender: s.gender,
        major: s.major,
        grade: s.grade,
        dormId: dorms[s.dormIdx].id,
        checkInDate: new Date("2023-09-01"),
      },
    });
    students.push(student);
  }

  console.log("学生创建完成");

  for (let i = 0; i < dorms.length; i++) {
    await db.keyRecord.upsert({
      where: { id: `key-${dorms[i].id}` },
      update: {},
      create: {
        id: `key-${dorms[i].id}`,
        dormId: dorms[i].id,
        keyNumber: `K-${dorms[i].building}-${dorms[i].roomNumber}`,
        status: i % 3 === 0 ? "borrowed" : "in_stock",
        borrower: i % 3 === 0 ? students[i]?.name : null,
        borrowedAt: i % 3 === 0 ? new Date() : null,
      },
    });
  }

  console.log("钥匙台账创建完成");

  await db.lateReturnRecord.createMany({
    data: [
      { studentId: students[0].id, date: new Date("2024-06-01"), time: "23:45", reason: "图书馆学习", recordedBy: dormManager.name },
      { studentId: students[0].id, date: new Date("2024-06-03"), time: "00:15", reason: "同学聚会", recordedBy: dormManager.name },
      { studentId: students[4].id, date: new Date("2024-06-02"), time: "23:30", reason: "实习加班", recordedBy: dormManager.name },
    ],
    skipDuplicates: true,
  });

  console.log("晚归记录创建完成");

  await createInspections(dorms, dormManager, counselor, maintenance, students);

  console.log("所有数据播种完成！");
}

async function createInspections(dorms: any[], dormManager: any, counselor: any, maintenance: any, students: any[]) {
  const now = new Date();

  const inspection1 = await db.inspection.create({
    data: {
      dormId: dorms[0].id,
      inspectorId: dormManager.id,
      status: InspectionStatus.NEEDS_RECTIFICATION,
      overallGrade: InspectionGrade.POOR,
      inspectionDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      remarks: "整体卫生较差，需重点整改",
      items: {
        create: [
          { category: "卫生整洁", name: "地面清洁", isPassed: false, score: 30, issue: "地面有明显污渍和垃圾", needRepair: false },
          { category: "卫生整洁", name: "床铺整理", isPassed: false, score: 40, issue: "被子未叠，衣物乱堆", needRepair: false },
          { category: "设施设备", name: "门窗完好", isPassed: false, score: 50, issue: "窗户把手损坏，无法关闭", needRepair: true },
          { category: "安全隐患", name: "违规电器", isPassed: true, score: 100, needRepair: false },
        ],
      },
      timelineEvents: {
        create: [
          { eventType: TimelineEventType.CREATED, description: "检查单创建", userId: dormManager.id },
          { eventType: TimelineEventType.INSPECTION_SUBMITTED, description: "宿管员李阿姨完成卫生检查，评定为差", userId: dormManager.id, metadata: { grade: "POOR" } },
          { eventType: TimelineEventType.NEEDS_RECTIFICATION_NOTIFIED, description: "已通知宿舍长进行整改，整改期限已超时1天", userId: dormManager.id, metadata: { deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), isOverdue: true } },
        ],
      },
    },
    include: { items: true, timelineEvents: true },
  });
  console.log("检查单1创建: 101室 - 需整改(超时)");

  const inspection2 = await db.inspection.create({
    data: {
      dormId: dorms[1].id,
      inspectorId: dormManager.id,
      status: InspectionStatus.RECTIFICATION_REJECTED,
      overallGrade: InspectionGrade.FAIR,
      inspectionDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      deadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      remarks: "整改不彻底，需重新整改",
      items: {
        create: [
          { category: "卫生整洁", name: "地面清洁", isPassed: true, score: 85, needRepair: false },
          { category: "卫生整洁", name: "桌面整洁", isPassed: false, score: 50, issue: "桌面物品堆放杂乱，书籍未整理", needRepair: false },
          { category: "公共区域", name: "卫生间", isPassed: false, score: 40, issue: "卫生间有异味，洗手台有污垢", needRepair: false },
        ],
      },
      rectifications: {
        create: [
          {
            description: "已打扫卫生间，整理了桌面",
            photos: ["photo1.jpg", "photo2.jpg"],
            submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
            submittedBy: students[4].name,
            reviewedBy: counselor.name,
            reviewedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
            reviewResult: "rejected",
            reviewComments: "卫生间异味问题未解决，桌面仍有杂物堆放。请重新整改，特别注意卫生间清洁和桌面物品收纳。",
            isRejected: true,
            rejectionCount: 1,
          },
        ],
      },
      timelineEvents: {
        create: [
          { eventType: TimelineEventType.CREATED, description: "检查单创建", userId: dormManager.id },
          { eventType: TimelineEventType.INSPECTION_SUBMITTED, description: "宿管员李阿姨完成卫生检查，评定为一般", userId: dormManager.id },
          { eventType: TimelineEventType.NEEDS_RECTIFICATION_NOTIFIED, description: "已通知需要整改的问题", userId: dormManager.id },
          { eventType: TimelineEventType.RECTIFICATION_SUBMITTED, description: `${students[4].name}提交了整改材料`, userId: null, metadata: { submittedBy: students[4].name } },
          { eventType: TimelineEventType.RECTIFICATION_REJECTED, description: "辅导员王老师复核不通过，要求重新整改", userId: counselor.id, metadata: { comments: "卫生间异味问题未解决，桌面仍有杂物堆放", rejectionCount: 1 } },
        ],
      },
    },
    include: { items: true, rectifications: true, timelineEvents: true },
  });
  console.log("检查单2创建: 102室 - 整改驳回(复核不通过)");

  const inspection3 = await db.inspection.create({
    data: {
      dormId: dorms[2].id,
      inspectorId: dormManager.id,
      status: InspectionStatus.MAINTENANCE_ASSIGNED,
      overallGrade: InspectionGrade.FAIR,
      inspectionDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      deadline: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      remarks: "存在设施损坏，需维修处理",
      maintenanceId: maintenance.id,
      items: {
        create: [
          { category: "设施设备", name: "水电正常", isPassed: false, score: 0, issue: "电灯不亮，缺材料（灯泡）", needRepair: true },
          { category: "设施设备", name: "家具完好", isPassed: false, score: 0, issue: "椅子损坏，缺材料（螺丝、配件）", needRepair: true },
          { category: "卫生整洁", name: "地面清洁", isPassed: true, score: 90, needRepair: false },
        ],
      },
      timelineEvents: {
        create: [
          { eventType: TimelineEventType.CREATED, description: "检查单创建", userId: dormManager.id },
          { eventType: TimelineEventType.INSPECTION_SUBMITTED, description: "宿管员李阿姨完成检查，发现设施损坏缺材料", userId: dormManager.id },
          { eventType: TimelineEventType.MAINTENANCE_ASSIGNED, description: "已指派张师傅进行维修，缺灯泡和椅子配件", userId: counselor.id, metadata: { materials: ["灯泡", "螺丝", "椅子配件"], isMaterialsMissing: true } },
        ],
      },
    },
    include: { items: true, timelineEvents: true },
  });
  console.log("检查单3创建: 201室 - 维修中(缺材料)");

  const inspection4 = await db.inspection.create({
    data: {
      dormId: dorms[3].id,
      inspectorId: dormManager.id,
      status: InspectionStatus.RECTIFIED,
      overallGrade: InspectionGrade.FAIR,
      inspectionDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      remarks: "已提交整改，等待辅导员复查",
      items: {
        create: [
          { category: "卫生整洁", name: "物品摆放", isPassed: false, score: 55, issue: "鞋子摆放不整齐", needRepair: false },
          { category: "公共区域", name: "垃圾处理", isPassed: false, score: 60, issue: "垃圾桶未及时清理", needRepair: false },
        ],
      },
      rectifications: {
        create: [
          {
            description: "已整理鞋子，清理了垃圾桶",
            photos: ["rectify1.jpg", "rectify2.jpg"],
            submittedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
            submittedBy: students[6]?.name || "学生",
          },
        ],
      },
      timelineEvents: {
        create: [
          { eventType: TimelineEventType.CREATED, description: "检查单创建", userId: dormManager.id },
          { eventType: TimelineEventType.INSPECTION_SUBMITTED, description: "宿管员李阿姨完成卫生检查", userId: dormManager.id },
          { eventType: TimelineEventType.NEEDS_RECTIFICATION_NOTIFIED, description: "已通知整改要求", userId: dormManager.id },
          { eventType: TimelineEventType.RECTIFICATION_SUBMITTED, description: "学生已提交整改材料，等待复查", userId: null },
        ],
      },
    },
    include: { items: true, rectifications: true, timelineEvents: true },
  });
  console.log("检查单4创建: 202室 - 待复查");

  const inspection5 = await db.inspection.create({
    data: {
      dormId: dorms[4].id,
      inspectorId: dormManager.id,
      status: InspectionStatus.PASSED,
      overallGrade: InspectionGrade.EXCELLENT,
      inspectionDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      remarks: "卫生状况优秀",
      items: {
        create: [
          { category: "卫生整洁", name: "地面清洁", isPassed: true, score: 95, needRepair: false },
          { category: "卫生整洁", name: "床铺整理", isPassed: true, score: 98, needRepair: false },
          { category: "安全隐患", name: "违规电器", isPassed: true, score: 100, needRepair: false },
          { category: "设施设备", name: "门窗完好", isPassed: true, score: 100, needRepair: false },
        ],
      },
      timelineEvents: {
        create: [
          { eventType: TimelineEventType.CREATED, description: "检查单创建", userId: dormManager.id },
          { eventType: TimelineEventType.INSPECTION_SUBMITTED, description: "宿管员李阿姨完成卫生检查，评定为优秀", userId: dormManager.id },
          { eventType: TimelineEventType.PASSED, description: "检查通过，无需整改", userId: dormManager.id },
        ],
      },
    },
    include: { items: true, timelineEvents: true },
  });
  console.log("检查单5创建: 2号楼101室 - 检查通过");

  const inspection6 = await db.inspection.create({
    data: {
      dormId: dorms[5].id,
      status: InspectionStatus.PENDING_INSPECTION,
      remarks: "待检查",
      items: {
        create: [
          { category: "卫生整洁", name: "地面清洁", needRepair: false },
          { category: "卫生整洁", name: "床铺整理", needRepair: false },
          { category: "安全隐患", name: "违规电器", needRepair: false },
        ],
      },
      timelineEvents: {
        create: [
          { eventType: TimelineEventType.CREATED, description: "检查单已创建，等待宿管员检查", userId: null },
        ],
      },
    },
    include: { items: true, timelineEvents: true },
  });
  console.log("检查单6创建: 2号楼305室 - 待检查");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
