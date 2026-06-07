import { HandTagStatus, LockerStatus, PrismaClient, Role, TechnicianStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      name: "系统管理员",
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { username: "reception" },
    update: {},
    create: {
      username: "reception",
      password: hashedPassword,
      name: "前台小王",
      role: Role.RECEPTIONIST,
    },
  });

  await prisma.user.upsert({
    where: { username: "supervisor" },
    update: {},
    create: {
      username: "supervisor",
      password: hashedPassword,
      name: "楼层主管老李",
      role: Role.FLOOR_SUPERVISOR,
    },
  });

  await prisma.user.upsert({
    where: { username: "finance" },
    update: {},
    create: {
      username: "finance",
      password: hashedPassword,
      name: "财务张姐",
      role: Role.FINANCE,
    },
  });

  for (let i = 1; i <= 50; i++) {
    const tagData = {
      tagNumber: `HT${String(i).padStart(3, "0")}`,
      status: HandTagStatus.AVAILABLE,
      rfid: `RFID${String(i).padStart(6, "0")}`,
    };
    await prisma.handTag.upsert({
      where: { tagNumber: tagData.tagNumber },
      update: {},
      create: tagData,
    });
  }

  const areas = ["男宾区", "女宾区", "VIP区"];
  for (const area of areas) {
    for (let i = 1; i <= 20; i++) {
      const lockerData = {
        lockerNumber: `${area.charAt(0)}${String(i).padStart(3, "0")}`,
        area,
        status: LockerStatus.AVAILABLE,
      };
      await prisma.locker.upsert({
        where: { lockerNumber: lockerData.lockerNumber },
        update: {},
        create: lockerData,
      });
    }
  }

  const technicians = [
    { name: "技师A", employeeId: "TECH001", skills: ["足疗", "按摩"], phone: "13800138001" },
    { name: "技师B", employeeId: "TECH002", skills: ["推拿", "刮痧"], phone: "13800138002" },
    { name: "技师C", employeeId: "TECH003", skills: ["SPA", "精油推背"], phone: "13800138003" },
    { name: "技师D", employeeId: "TECH004", skills: ["采耳", "拔罐"], phone: "13800138004" },
    { name: "技师E", employeeId: "TECH005", skills: ["足疗", "修脚"], phone: "13800138005" },
  ];
  for (const tech of technicians) {
    await prisma.technician.upsert({
      where: { employeeId: tech.employeeId },
      update: {},
      create: {
        ...tech,
        status: TechnicianStatus.AVAILABLE,
      },
    });
  }

  console.log("种子数据已完成！");
  console.log("演示账号：");
  console.log("  管理员: admin / 123456");
  console.log("  前台: reception / 123456");
  console.log("  楼层主管: supervisor / 123456");
  console.log("  财务: finance / 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
