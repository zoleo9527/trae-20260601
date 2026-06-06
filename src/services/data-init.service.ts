import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Staff } from '../entities/staff.entity';
import { Student } from '../entities/student.entity';
import { Bed } from '../entities/bed.entity';
import { CheckInAssignment } from '../entities/check-in-assignment.entity';
import { BedAdjustment } from '../entities/bed-adjustment.entity';
import { StaffRole, CheckInStatus, AdjustmentStatus, AdjustmentReason, OperationType } from '../common/enums';
import { OperationLogService } from './operation-log.service';

@Injectable()
export class DataInitService implements OnModuleInit {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Bed)
    private readonly bedRepository: Repository<Bed>,
    @InjectRepository(CheckInAssignment)
    private readonly checkInRepository: Repository<CheckInAssignment>,
    @InjectRepository(BedAdjustment)
    private readonly adjustmentRepository: Repository<BedAdjustment>,
    private readonly operationLogService: OperationLogService,
  ) {}

  async onModuleInit() {
    const staffCount = await this.staffRepository.count();
    if (staffCount > 0) {
      console.log('数据已初始化，跳过...');
      return;
    }

    console.log('开始初始化样例数据...');

    const staffs = await this.initStaff();
    const students = await this.initStudents();
    const beds = await this.initBeds();
    await this.initCheckInAssignments(staffs, students, beds);
    await this.initBedAdjustments(staffs, students, beds);

    console.log('样例数据初始化完成！');
  }

  private async initStaff(): Promise<Staff[]> {
    const staffs = [
      { id: 'staff-1', name: '张宿管', role: StaffRole.DORM_MANAGER, phone: '13800138001' },
      { id: 'staff-2', name: '李辅导员', role: StaffRole.COUNSELOR, phone: '13800138002' },
      { id: 'staff-3', name: '王维修', role: StaffRole.MAINTENANCE, phone: '13800138003' },
    ];

    const result = [];
    for (const s of staffs) {
      const staff = this.staffRepository.create(s);
      result.push(await this.staffRepository.save(staff));
    }
    return result;
  }

  private async initStudents(): Promise<Student[]> {
    const students = [
      { id: 'stu-1', name: '小明', studentNo: '2024001', gender: '男', department: '计算机学院', major: '软件工程', grade: '2024级', phone: '13900139001' },
      { id: 'stu-2', name: '小红', studentNo: '2024002', gender: '女', department: '计算机学院', major: '计算机科学', grade: '2024级', phone: '13900139002' },
      { id: 'stu-3', name: '小刚', studentNo: '2024003', gender: '男', department: '机械学院', major: '机械工程', grade: '2024级', phone: '13900139003' },
      { id: 'stu-4', name: '小丽', studentNo: '2024004', gender: '女', department: '文学院', major: '汉语言文学', grade: '2024级', phone: '13900139004' },
      { id: 'stu-5', name: '小华', studentNo: '2023001', gender: '男', department: '计算机学院', major: '软件工程', grade: '2023级', phone: '13900139005' },
    ];

    const result = [];
    for (const s of students) {
      const student = this.studentRepository.create(s);
      result.push(await this.studentRepository.save(student));
    }
    return result;
  }

  private async initBeds(): Promise<Bed[]> {
    const beds = [
      { id: 'bed-1', buildingNo: '1号楼', roomNo: '101', bedNo: 1, floor: 1, isOccupied: true, studentId: 'stu-5' },
      { id: 'bed-2', buildingNo: '1号楼', roomNo: '101', bedNo: 2, floor: 1, isOccupied: false },
      { id: 'bed-3', buildingNo: '1号楼', roomNo: '101', bedNo: 3, floor: 1, isOccupied: false },
      { id: 'bed-4', buildingNo: '1号楼', roomNo: '101', bedNo: 4, floor: 1, isOccupied: false },
      { id: 'bed-5', buildingNo: '1号楼', roomNo: '102', bedNo: 1, floor: 1, isOccupied: false },
      { id: 'bed-6', buildingNo: '1号楼', roomNo: '102', bedNo: 2, floor: 1, isOccupied: false },
      { id: 'bed-7', buildingNo: '2号楼', roomNo: '201', bedNo: 1, floor: 2, isOccupied: false },
      { id: 'bed-8', buildingNo: '2号楼', roomNo: '201', bedNo: 2, floor: 2, isOccupied: false, underMaintenance: true },
      { id: 'bed-9', buildingNo: '3号楼', roomNo: '301', bedNo: 1, floor: 3, isOccupied: false },
      { id: 'bed-10', buildingNo: '3号楼', roomNo: '301', bedNo: 2, floor: 3, isOccupied: false },
    ];

    const result = [];
    for (const b of beds) {
      const bed = this.bedRepository.create(b);
      result.push(await this.bedRepository.save(bed));
    }
    return result;
  }

  private async initCheckInAssignments(staffs: Staff[], students: Student[], beds: Bed[]) {
    const now = new Date();

    const case1 = this.checkInRepository.create({
      id: 'checkin-1',
      studentId: students[0].id,
      bedId: beds[1].id,
      status: CheckInStatus.COMPLETED,
      currentHandlerId: staffs[0].id,
      assignedToId: staffs[0].id,
      expectedCompleteAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    });
    await this.checkInRepository.save(case1);
    await this.operationLogService.createLog('check_in', case1.id, OperationType.CREATE, staffs[0].id, staffs[0].name, staffs[0].role, '创建入住分配', null, CheckInStatus.PENDING);
    await this.operationLogService.createLog('check_in', case1.id, OperationType.APPROVE, staffs[1].id, staffs[1].name, staffs[1].role, '辅导员审核通过', CheckInStatus.PENDING, CheckInStatus.APPROVED);
    await this.operationLogService.createLog('check_in', case1.id, OperationType.COMPLETE, staffs[0].id, staffs[0].name, staffs[0].role, '宿管员确认入住完成', CheckInStatus.APPROVED, CheckInStatus.COMPLETED);

    const case2 = this.checkInRepository.create({
      id: 'checkin-2',
      studentId: students[1].id,
      bedId: beds[4].id,
      status: CheckInStatus.RETURNED,
      currentHandlerId: staffs[1].id,
      assignedToId: staffs[1].id,
      returnReason: '缺少体检报告，请补充后重新提交',
      expectedCompleteAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    });
    await this.checkInRepository.save(case2);
    await this.operationLogService.createLog('check_in', case2.id, OperationType.CREATE, staffs[0].id, staffs[0].name, staffs[0].role, '创建入住分配', null, CheckInStatus.PENDING);
    await this.operationLogService.createLog('check_in', case2.id, OperationType.UPDATE, staffs[0].id, staffs[0].name, staffs[0].role, '宿管员初查，转辅导员审核', CheckInStatus.PENDING, CheckInStatus.IN_PROGRESS);
    await this.operationLogService.createLog('check_in', case2.id, OperationType.RETURN, staffs[1].id, staffs[1].name, staffs[1].role, '缺少体检报告，请补充后重新提交', CheckInStatus.IN_PROGRESS, CheckInStatus.RETURNED);

    const case3 = this.checkInRepository.create({
      id: 'checkin-3',
      studentId: students[2].id,
      bedId: beds[6].id,
      status: CheckInStatus.OVERDUE,
      currentHandlerId: staffs[0].id,
      assignedToId: staffs[0].id,
      expectedCompleteAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    });
    await this.checkInRepository.save(case3);
    await this.operationLogService.createLog('check_in', case3.id, OperationType.CREATE, staffs[0].id, staffs[0].name, staffs[0].role, '创建入住分配，分配给张宿管处理', null, CheckInStatus.PENDING);

    const case4 = this.checkInRepository.create({
      id: 'checkin-4',
      studentId: students[3].id,
      bedId: beds[8].id,
      status: CheckInStatus.DISPUTED,
      currentHandlerId: staffs[1].id,
      assignedToId: staffs[1].id,
      remark: '床位分配存在争议，需三方协商',
      expectedCompleteAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    });
    await this.checkInRepository.save(case4);
    await this.operationLogService.createLog('check_in', case4.id, OperationType.CREATE, staffs[0].id, staffs[0].name, staffs[0].role, '创建入住分配', null, CheckInStatus.PENDING);
    await this.operationLogService.createLog('check_in', case4.id, OperationType.TRANSFER, staffs[0].id, staffs[0].name, staffs[0].role, '转由李辅导员跟进处理', CheckInStatus.PENDING, CheckInStatus.IN_PROGRESS);
    await this.operationLogService.createLog('check_in', case4.id, OperationType.COMMENT, staffs[1].id, staffs[1].name, staffs[1].role, '学生对床位不满意，要求调换，与宿管有分歧，标记为责任争议', CheckInStatus.IN_PROGRESS, CheckInStatus.DISPUTED);

    const case5 = this.checkInRepository.create({
      id: 'checkin-5',
      studentId: students[2].id,
      bedId: beds[5].id,
      status: CheckInStatus.IN_PROGRESS,
      currentHandlerId: staffs[1].id,
      assignedToId: staffs[1].id,
      remark: '正在审核中',
      expectedCompleteAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    });
    await this.checkInRepository.save(case5);
    await this.operationLogService.createLog('check_in', case5.id, OperationType.CREATE, staffs[0].id, staffs[0].name, staffs[0].role, '创建入住分配', null, CheckInStatus.PENDING);
    await this.operationLogService.createLog('check_in', case5.id, OperationType.UPDATE, staffs[0].id, staffs[0].name, staffs[0].role, '提交辅导员审核', CheckInStatus.PENDING, CheckInStatus.IN_PROGRESS);
  }

  private async initBedAdjustments(staffs: Staff[], students: Student[], beds: Bed[]) {
    const now = new Date();

    const adj1 = this.adjustmentRepository.create({
      id: 'adj-1',
      studentId: students[4].id,
      sourceBedId: beds[0].id,
      targetBedId: beds[2].id,
      reason: AdjustmentReason.DORM_RELATION,
      reasonDetail: '与室友作息时间不一致，影响休息',
      status: AdjustmentStatus.COMPLETED,
      currentHandlerId: staffs[0].id,
      assignedToId: staffs[0].id,
      expectedCompleteAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    });
    await this.adjustmentRepository.save(adj1);
    await this.operationLogService.createLog('bed_adjustment', adj1.id, OperationType.CREATE, staffs[0].id, staffs[0].name, staffs[0].role, '学生申请床位调整：与室友作息不一致', null, AdjustmentStatus.PENDING);
    await this.operationLogService.createLog('bed_adjustment', adj1.id, OperationType.APPROVE, staffs[1].id, staffs[1].name, staffs[1].role, '辅导员核实情况，同意调整', AdjustmentStatus.PENDING, AdjustmentStatus.APPROVED);
    await this.operationLogService.createLog('bed_adjustment', adj1.id, OperationType.COMPLETE, staffs[0].id, staffs[0].name, staffs[0].role, '已完成床位调换，更新钥匙台账', AdjustmentStatus.APPROVED, AdjustmentStatus.COMPLETED);

    const adj2 = this.adjustmentRepository.create({
      id: 'adj-2',
      studentId: students[0].id,
      sourceBedId: beds[1].id,
      targetBedId: beds[3].id,
      reason: AdjustmentReason.PERSONAL,
      reasonDetail: '个人原因希望更换床位',
      status: AdjustmentStatus.RETURNED,
      currentHandlerId: staffs[0].id,
      assignedToId: staffs[0].id,
      returnReason: '调整理由不充分，请详细说明具体原因',
      expectedCompleteAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    });
    await this.adjustmentRepository.save(adj2);
    await this.operationLogService.createLog('bed_adjustment', adj2.id, OperationType.CREATE, staffs[0].id, staffs[0].name, staffs[0].role, '学生申请调整床位', null, AdjustmentStatus.PENDING);
    await this.operationLogService.createLog('bed_adjustment', adj2.id, OperationType.RETURN, staffs[1].id, staffs[1].name, staffs[1].role, '调整理由不充分，请详细说明具体原因', AdjustmentStatus.PENDING, AdjustmentStatus.RETURNED);

    const adj3 = this.adjustmentRepository.create({
      id: 'adj-3',
      studentId: students[1].id,
      sourceBedId: beds[4].id,
      targetBedId: beds[5].id,
      reason: AdjustmentReason.MAINTENANCE,
      reasonDetail: '床位旁边的插座坏了，需要维修',
      status: AdjustmentStatus.MAINTENANCE_REQUIRED,
      currentHandlerId: staffs[2].id,
      assignedToId: staffs[2].id,
      expectedCompleteAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    });
    await this.adjustmentRepository.save(adj3);
    await this.operationLogService.createLog('bed_adjustment', adj3.id, OperationType.CREATE, staffs[0].id, staffs[0].name, staffs[0].role, '申请调整床位，原因：插座损坏', null, AdjustmentStatus.PENDING);
    await this.operationLogService.createLog('bed_adjustment', adj3.id, OperationType.TRANSFER, staffs[0].id, staffs[0].name, staffs[0].role, '转维修人员检查处理', AdjustmentStatus.PENDING, AdjustmentStatus.MAINTENANCE_REQUIRED);

    const adj4 = this.adjustmentRepository.create({
      id: 'adj-4',
      studentId: students[2].id,
      sourceBedId: beds[6].id,
      targetBedId: beds[9].id,
      reason: AdjustmentReason.DORM_RELATION,
      reasonDetail: '宿舍矛盾，希望调换',
      status: AdjustmentStatus.DISPUTED,
      currentHandlerId: staffs[1].id,
      assignedToId: staffs[1].id,
      remark: '涉及多方，正在协调中',
      expectedCompleteAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    });
    await this.adjustmentRepository.save(adj4);
    await this.operationLogService.createLog('bed_adjustment', adj4.id, OperationType.CREATE, staffs[0].id, staffs[0].name, staffs[0].role, '申请床位调整，宿舍矛盾', null, AdjustmentStatus.PENDING);
    await this.operationLogService.createLog('bed_adjustment', adj4.id, OperationType.COMMENT, staffs[1].id, staffs[1].name, staffs[1].role, '双方各执一词，需进一步调解，标记为争议状态', AdjustmentStatus.PENDING, AdjustmentStatus.DISPUTED);

    const adj5 = this.adjustmentRepository.create({
      id: 'adj-5',
      studentId: students[4].id,
      sourceBedId: beds[2].id,
      targetBedId: beds[7].id,
      reason: AdjustmentReason.MAINTENANCE,
      reasonDetail: '原床位上方漏水，需临时调换',
      status: AdjustmentStatus.IN_PROGRESS,
      currentHandlerId: staffs[2].id,
      assignedToId: staffs[2].id,
      remark: '维修人员正在处理漏水问题',
      expectedCompleteAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    });
    await this.adjustmentRepository.save(adj5);
    await this.operationLogService.createLog('bed_adjustment', adj5.id, OperationType.CREATE, staffs[0].id, staffs[0].name, staffs[0].role, '紧急调整：床位漏水需维修', null, AdjustmentStatus.PENDING);
    await this.operationLogService.createLog('bed_adjustment', adj5.id, OperationType.UPDATE, staffs[2].id, staffs[2].name, staffs[2].role, '维修人员已接单，正在检查漏水原因', AdjustmentStatus.PENDING, AdjustmentStatus.IN_PROGRESS);
  }
}
