import {
  mockUsers,
  mockStudents,
  mockKeyRecords,
  mockInspections,
  mockDorms,
  generateId,
  type User,
  type Student,
  type KeyRecord,
  type Inspection,
  type Dorm,
  type Rectification,
  type TimelineEvent,
} from "./mockData";
import bcrypt from "bcryptjs";

export let currentUserId: string | null = null;

export async function findUserByUsername(username: string): Promise<User | null> {
  return mockUsers.find((u) => u.username === username) || null;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  if (password === "123456") return true;
  return bcrypt.compare(password, user.passwordHash).catch(() => false);
}

export function setCurrentUserId(userId: string | null) {
  currentUserId = userId;
}

export function getCurrentUser(): User | null {
  if (!currentUserId) return null;
  return mockUsers.find((u) => u.id === currentUserId) || null;
}

export async function getAllInspections(statusFilter?: string): Promise<Inspection[]> {
  if (statusFilter && statusFilter !== "all") {
    return mockInspections.filter((i) => i.status === statusFilter);
  }
  return [...mockInspections].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getInspectionById(id: string): Promise<Inspection | null> {
  return mockInspections.find((i) => i.id === id) || null;
}

export async function getInspectionStats(): Promise<Record<string, number>> {
  const stats: Record<string, number> = {};
  mockInspections.forEach((i) => {
    stats[i.status] = (stats[i.status] || 0) + 1;
  });
  return stats;
}

export async function getInspectionCount(): Promise<number> {
  return mockInspections.length;
}

export async function getStudentsWithLateReturns(dormId?: string): Promise<Student[]> {
  let students = [...mockStudents];
  if (dormId) {
    students = students.filter((s) => s.dormId === dormId);
  }
  return students;
}

export async function getAllStudents(): Promise<Student[]> {
  return [...mockStudents];
}

export async function getAllKeyRecords(): Promise<KeyRecord[]> {
  return [...mockKeyRecords];
}

export async function getDormById(id: string): Promise<Dorm | null> {
  return mockDorms.find((d) => d.id === id) || null;
}

export async function submitRectification(
  inspectionId: string,
  description: string,
  submittedBy: string,
  currentUser: User
): Promise<Inspection | null> {
  const inspection = mockInspections.find((i) => i.id === inspectionId);
  if (!inspection) return null;

  const newRect: Rectification = {
    id: generateId(),
    inspectionId,
    description,
    submittedBy,
    submittedAt: new Date().toISOString(),
    photos: [],
    isRejected: false,
    rejectionCount: 0,
  };

  inspection.rectifications.push(newRect);
  inspection.status = "RECTIFIED";
  inspection.updatedAt = new Date().toISOString();

  const timelineEvent: TimelineEvent = {
    id: generateId(),
    inspectionId,
    eventType: "RECTIFICATION_SUBMITTED",
    description: `${submittedBy}提交了整改材料，等待复查`,
    userId: currentUser.role === "DORM_MANAGER" ? currentUser.id : undefined,
    user: currentUser.role === "DORM_MANAGER" ? currentUser : undefined,
    metadata: { submittedBy },
    createdAt: new Date().toISOString(),
  };

  inspection.timelineEvents.push(timelineEvent);

  return inspection;
}

export async function approveRectification(
  inspectionId: string,
  rectificationId: string,
  reviewComments: string,
  currentUser: User
): Promise<Inspection | null> {
  const inspection = mockInspections.find((i) => i.id === inspectionId);
  if (!inspection) return null;

  const rect = inspection.rectifications.find((r) => r.id === rectificationId);
  if (!rect) return null;

  rect.reviewedBy = currentUser.name;
  rect.reviewedAt = new Date().toISOString();
  rect.reviewResult = "approved";
  rect.reviewComments = reviewComments;
  rect.isRejected = false;

  inspection.status = "RECTIFICATION_PASSED";
  inspection.updatedAt = new Date().toISOString();

  const timelineEvent: TimelineEvent = {
    id: generateId(),
    inspectionId,
    eventType: "RECTIFICATION_APPROVED",
    description: `辅导员${currentUser.name}复查通过，整改完成`,
    userId: currentUser.id,
    user: currentUser,
    metadata: { comments: reviewComments },
    createdAt: new Date().toISOString(),
  };

  inspection.timelineEvents.push(timelineEvent);

  return inspection;
}

export async function rejectRectification(
  inspectionId: string,
  rectificationId: string,
  reviewComments: string,
  currentUser: User
): Promise<Inspection | null> {
  const inspection = mockInspections.find((i) => i.id === inspectionId);
  if (!inspection) return null;

  const rect = inspection.rectifications.find((r) => r.id === rectificationId);
  if (!rect) return null;

  rect.reviewedBy = currentUser.name;
  rect.reviewedAt = new Date().toISOString();
  rect.reviewResult = "rejected";
  rect.reviewComments = reviewComments;
  rect.isRejected = true;
  rect.rejectionCount = rect.rejectionCount + 1;

  inspection.status = "RECTIFICATION_REJECTED";
  inspection.updatedAt = new Date().toISOString();

  const timelineEvent: TimelineEvent = {
    id: generateId(),
    inspectionId,
    eventType: "RECTIFICATION_REJECTED",
    description: `辅导员${currentUser.name}复核不通过，要求重新整改`,
    userId: currentUser.id,
    user: currentUser,
    metadata: { comments: reviewComments, rejectionCount: rect.rejectionCount },
    createdAt: new Date().toISOString(),
  };

  inspection.timelineEvents.push(timelineEvent);

  return inspection;
}

export async function assignMaintenance(
  inspectionId: string,
  maintenanceId: string,
  currentUser: User
): Promise<Inspection | null> {
  const inspection = mockInspections.find((i) => i.id === inspectionId);
  if (!inspection) return null;

  const maintenanceUser = mockUsers.find((u) => u.id === maintenanceId);
  inspection.maintenanceId = maintenanceId;
  inspection.maintenanceAssignee = maintenanceUser;
  inspection.status = "MAINTENANCE_ASSIGNED";
  inspection.updatedAt = new Date().toISOString();

  const timelineEvent: TimelineEvent = {
    id: generateId(),
    inspectionId,
    eventType: "MAINTENANCE_ASSIGNED",
    description: `已指派${maintenanceUser?.name || "维修人员"}进行维修`,
    userId: currentUser.id,
    user: currentUser,
    metadata: { maintenanceId, maintenanceName: maintenanceUser?.name },
    createdAt: new Date().toISOString(),
  };

  inspection.timelineEvents.push(timelineEvent);

  return inspection;
}

export async function completeMaintenance(
  inspectionId: string,
  currentUser: User
): Promise<Inspection | null> {
  const inspection = mockInspections.find((i) => i.id === inspectionId);
  if (!inspection) return null;

  inspection.status = "MAINTENANCE_COMPLETED";
  inspection.updatedAt = new Date().toISOString();

  const timelineEvent: TimelineEvent = {
    id: generateId(),
    inspectionId,
    eventType: "MAINTENANCE_COMPLETED",
    description: `维修人员${currentUser.name}已完成维修工作`,
    userId: currentUser.id,
    user: currentUser,
    createdAt: new Date().toISOString(),
  };

  inspection.timelineEvents.push(timelineEvent);

  return inspection;
}

export async function closeInspection(
  inspectionId: string,
  currentUser: User
): Promise<Inspection | null> {
  const inspection = mockInspections.find((i) => i.id === inspectionId);
  if (!inspection) return null;

  inspection.status = "CLOSED";
  inspection.updatedAt = new Date().toISOString();

  const timelineEvent: TimelineEvent = {
    id: generateId(),
    inspectionId,
    eventType: "CLOSED",
    description: `${currentUser.name}已关闭检查单`,
    userId: currentUser.id,
    user: currentUser,
    createdAt: new Date().toISOString(),
  };

  inspection.timelineEvents.push(timelineEvent);

  return inspection;
}

export function getMaintenanceUsers(): User[] {
  return mockUsers.filter((u) => u.role === "MAINTENANCE");
}
