import { db } from "./db.server";
import bcrypt from "bcryptjs";
import type {
  User,
  Inspection,
  InspectionItem,
  Student,
  KeyRecord,
  Dorm,
  InspectionStatus,
  InspectionGrade,
  TimelineEventType,
} from "@prisma/client";

export async function findUserByUsername(username: string): Promise<User | null> {
  return db.user.findUnique({ where: { username } });
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash).catch(() => false);
}

const inspectionInclude = {
  dorm: true,
  inspector: true,
  maintenanceAssignee: true,
  items: true,
  rectifications: true,
  timelineEvents: {
    include: { user: true },
    orderBy: { createdAt: "asc" as const },
  },
};

export async function getAllInspections(statusFilter?: string): Promise<Inspection[]> {
  const where: any = {};
  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter as InspectionStatus;
  }
  return db.inspection.findMany({
    where,
    include: inspectionInclude,
    orderBy: { createdAt: "desc" as const },
  });
}

export async function getInspectionById(id: string): Promise<Inspection | null> {
  return db.inspection.findUnique({
    where: { id },
    include: inspectionInclude,
  });
}

export async function getInspectionStats(): Promise<Record<string, number>> {
  const inspections = await db.inspection.groupBy({
    by: ["status"],
    _count: { status: true },
  });
  const stats: Record<string, number> = {};
  inspections.forEach((i) => {
    stats[i.status] = i._count.status;
  });
  return stats;
}

export async function getInspectionCount(): Promise<number> {
  return db.inspection.count();
}

export async function getStudentsWithLateReturns(dormId?: string): Promise<Student[]> {
  const where: any = {};
  if (dormId) {
    where.dormId = dormId;
  }
  return db.student.findMany({
    where,
    include: { lateReturns: true },
    orderBy: { studentId: "asc" as const },
  });
}

export async function getAllStudents(): Promise<Student[]> {
  return db.student.findMany({
    include: { lateReturns: true, dorm: true },
    orderBy: { studentId: "asc" as const },
  });
}

export async function getAllKeyRecords(): Promise<KeyRecord[]> {
  return db.keyRecord.findMany({
    include: { dorm: true },
    orderBy: { createdAt: "desc" as const },
  });
}

export async function getDormById(id: string): Promise<Dorm | null> {
  return db.dorm.findUnique({ where: { id } });
}

export async function submitInspection(
  inspectionId: string,
  data: {
    items: Array<{
      id: string;
      isPassed: boolean;
      score?: number;
      issue?: string;
      needRepair: boolean;
    }>;
    overallGrade: InspectionGrade;
    deadline?: Date;
    remarks?: string;
    currentUser: User;
  }
): Promise<Inspection | null> {
  const inspection = await db.inspection.findUnique({ where: { id: inspectionId } });
  if (!inspection) return null;

  const hasFailedItems = data.items.some((item) => !item.isPassed);
  const hasRepairItems = data.items.some((item) => item.needRepair);
  const newStatus: InspectionStatus = hasFailedItems || hasRepairItems
    ? "NEEDS_RECTIFICATION"
    : "PASSED";

  await db.$transaction(async (tx) => {
    for (const item of data.items) {
      await tx.inspectionItem.update({
        where: { id: item.id },
        data: {
          isPassed: item.isPassed,
          score: item.score,
          issue: item.issue,
          needRepair: item.needRepair,
        },
      });
    }

    await tx.inspection.update({
      where: { id: inspectionId },
      data: {
        inspectorId: data.currentUser.id,
        overallGrade: data.overallGrade,
        inspectionDate: new Date(),
        deadline: data.deadline,
        remarks: data.remarks,
        status: newStatus,
      },
    });

    await tx.timelineEvent.create({
      data: {
        inspectionId,
        eventType: "INSPECTION_SUBMITTED" as TimelineEventType,
        description: `${data.currentUser.name}完成卫生检查，评定为${data.overallGrade}`,
        userId: data.currentUser.id,
        metadata: { grade: data.overallGrade },
      },
    });

    if (newStatus === "NEEDS_RECTIFICATION") {
      await tx.timelineEvent.create({
        data: {
          inspectionId,
          eventType: "NEEDS_RECTIFICATION_NOTIFIED" as TimelineEventType,
          description: "已通知需要整改的问题",
          userId: data.currentUser.id,
          metadata: { deadline: data.deadline?.toISOString() },
        },
      });
    } else {
      await tx.timelineEvent.create({
        data: {
          inspectionId,
          eventType: "PASSED" as TimelineEventType,
          description: "检查通过，无需整改",
          userId: data.currentUser.id,
        },
      });
    }
  });

  return getInspectionById(inspectionId);
}

export async function submitRectification(
  inspectionId: string,
  description: string,
  submittedBy: string,
  currentUser: User
): Promise<Inspection | null> {
  const inspection = await db.inspection.findUnique({ where: { id: inspectionId } });
  if (!inspection) return null;

  await db.$transaction(async (tx) => {
    await tx.rectification.create({
      data: {
        inspectionId,
        description,
        submittedBy,
        submittedAt: new Date(),
        photos: [],
      },
    });

    await tx.inspection.update({
      where: { id: inspectionId },
      data: { status: "RECTIFIED" as InspectionStatus },
    });

    await tx.timelineEvent.create({
      data: {
        inspectionId,
        eventType: "RECTIFICATION_SUBMITTED" as TimelineEventType,
        description: `${submittedBy}提交了整改材料，等待复查`,
        userId: currentUser.role === "DORM_MANAGER" ? currentUser.id : null,
        metadata: { submittedBy },
      },
    });
  });

  return getInspectionById(inspectionId);
}

export async function approveRectification(
  inspectionId: string,
  rectificationId: string,
  reviewComments: string,
  currentUser: User
): Promise<Inspection | null> {
  const inspection = await db.inspection.findUnique({ where: { id: inspectionId } });
  if (!inspection) return null;

  await db.$transaction(async (tx) => {
    await tx.rectification.update({
      where: { id: rectificationId },
      data: {
        reviewedBy: currentUser.name,
        reviewedAt: new Date(),
        reviewResult: "approved",
        reviewComments,
        isRejected: false,
      },
    });

    await tx.inspection.update({
      where: { id: inspectionId },
      data: { status: "RECTIFICATION_PASSED" as InspectionStatus },
    });

    await tx.timelineEvent.create({
      data: {
        inspectionId,
        eventType: "RECTIFICATION_APPROVED" as TimelineEventType,
        description: `辅导员${currentUser.name}复查通过，整改完成`,
        userId: currentUser.id,
        metadata: { comments: reviewComments },
      },
    });
  });

  return getInspectionById(inspectionId);
}

export async function rejectRectification(
  inspectionId: string,
  rectificationId: string,
  reviewComments: string,
  currentUser: User
): Promise<Inspection | null> {
  const inspection = await db.inspection.findUnique({
    where: { id: inspectionId },
    include: { rectifications: true },
  });
  if (!inspection) return null;

  const rect = inspection.rectifications.find((r) => r.id === rectificationId);
  const newRejectionCount = (rect?.rejectionCount || 0) + 1;

  await db.$transaction(async (tx) => {
    await tx.rectification.update({
      where: { id: rectificationId },
      data: {
        reviewedBy: currentUser.name,
        reviewedAt: new Date(),
        reviewResult: "rejected",
        reviewComments,
        isRejected: true,
        rejectionCount: newRejectionCount,
      },
    });

    await tx.inspection.update({
      where: { id: inspectionId },
      data: { status: "RECTIFICATION_REJECTED" as InspectionStatus },
    });

    await tx.timelineEvent.create({
      data: {
        inspectionId,
        eventType: "RECTIFICATION_REJECTED" as TimelineEventType,
        description: `辅导员${currentUser.name}复核不通过，要求重新整改`,
        userId: currentUser.id,
        metadata: { comments: reviewComments, rejectionCount: newRejectionCount },
      },
    });
  });

  return getInspectionById(inspectionId);
}

export async function assignMaintenance(
  inspectionId: string,
  maintenanceId: string,
  currentUser: User
): Promise<Inspection | null> {
  const inspection = await db.inspection.findUnique({ where: { id: inspectionId } });
  if (!inspection) return null;

  const maintenanceUser = await db.user.findUnique({ where: { id: maintenanceId } });

  await db.$transaction(async (tx) => {
    await tx.inspection.update({
      where: { id: inspectionId },
      data: {
        maintenanceId,
        status: "MAINTENANCE_ASSIGNED" as InspectionStatus,
      },
    });

    await tx.timelineEvent.create({
      data: {
        inspectionId,
        eventType: "MAINTENANCE_ASSIGNED" as TimelineEventType,
        description: `已指派${maintenanceUser?.name || "维修人员"}进行维修`,
        userId: currentUser.id,
        metadata: { maintenanceId, maintenanceName: maintenanceUser?.name },
      },
    });
  });

  return getInspectionById(inspectionId);
}

export async function completeMaintenance(
  inspectionId: string,
  currentUser: User
): Promise<Inspection | null> {
  const inspection = await db.inspection.findUnique({ where: { id: inspectionId } });
  if (!inspection) return null;

  await db.$transaction(async (tx) => {
    await tx.inspection.update({
      where: { id: inspectionId },
      data: { status: "MAINTENANCE_COMPLETED" as InspectionStatus },
    });

    await tx.timelineEvent.create({
      data: {
        inspectionId,
        eventType: "MAINTENANCE_COMPLETED" as TimelineEventType,
        description: `维修人员${currentUser.name}已完成维修工作`,
        userId: currentUser.id,
      },
    });
  });

  return getInspectionById(inspectionId);
}

export async function closeInspection(
  inspectionId: string,
  currentUser: User
): Promise<Inspection | null> {
  const inspection = await db.inspection.findUnique({ where: { id: inspectionId } });
  if (!inspection) return null;

  await db.$transaction(async (tx) => {
    await tx.inspection.update({
      where: { id: inspectionId },
      data: { status: "CLOSED" as InspectionStatus },
    });

    await tx.timelineEvent.create({
      data: {
        inspectionId,
        eventType: "CLOSED" as TimelineEventType,
        description: `${currentUser.name}已关闭检查单`,
        userId: currentUser.id,
      },
    });
  });

  return getInspectionById(inspectionId);
}

export function getMaintenanceUsers(): Promise<User[]> {
  return db.user.findMany({
    where: { role: "MAINTENANCE" },
  });
}

export async function getLateReturnRecords() {
  return db.lateReturnRecord.findMany({
    include: { student: true },
    orderBy: { date: "desc" as const },
  });
}

export async function getKeyRecordsByDormId(dormId: string) {
  return db.keyRecord.findMany({
    where: { dormId },
    orderBy: { createdAt: "desc" as const },
  });
}
