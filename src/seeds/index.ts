import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Attendance } from '../entities/Attendance';
import { Certificate } from '../entities/Certificate';
import { Class } from '../entities/Class';
import { MakeupRequest } from '../entities/MakeupRequest';
import { Note } from '../entities/Note';
import { Session } from '../entities/Session';
import { Shipment } from '../entities/Shipment';
import { Student } from '../entities/Student';

export async function seedDatabase(dataSource: DataSource) {
  const classRepository = dataSource.getRepository(Class);
  const studentRepository = dataSource.getRepository(Student);
  const sessionRepository = dataSource.getRepository(Session);
  const attendanceRepository = dataSource.getRepository(Attendance);
  const makeupRepository = dataSource.getRepository(MakeupRequest);
  const certificateRepository = dataSource.getRepository(Certificate);
  const shipmentRepository = dataSource.getRepository(Shipment);
  const noteRepository = dataSource.getRepository(Note);

  console.log('Creating classes...');
  const class1 = classRepository.create({
    name: 'UI/UX设计实战班2026春',
    courseName: 'UI/UX设计师认证课程',
    description: '系统学习UI/UX设计，掌握Figma、Sketch等工具',
    totalHours: 120,
    status: 'ongoing',
    startDate: '2026-03-01',
    endDate: '2026-06-30',
    teacherName: '李明老师',
  });
  const class2 = classRepository.create({
    name: 'Python全栈开发班',
    courseName: 'Python全栈工程师认证',
    description: '从零基础到全栈开发，掌握Django、Flask框架',
    totalHours: 160,
    status: 'completed',
    startDate: '2025-09-01',
    endDate: '2026-02-28',
    teacherName: '张伟老师',
  });
  const class3 = classRepository.create({
    name: '产品经理入门班',
    courseName: '产品经理职业培训',
    description: '产品思维、需求分析、原型设计、项目管理',
    totalHours: 80,
    status: 'recruiting',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    teacherName: '王芳老师',
  });
  await classRepository.save([class1, class2, class3]);
  console.log('Classes created');

  console.log('Creating students...');
  const studentEntities: Student[] = [];
  const studentDataList = [
    { name: '张三', studentNo: 'STU2026001', phone: '13800138001', email: 'zhangsan@example.com', address: '北京市朝阳区xxx路123号', idCard: '110101199501011234', status: 'studying' as const, classId: class1.id },
    { name: '李四', studentNo: 'STU2026002', phone: '13800138002', email: 'lisi@example.com', address: '北京市海淀区xxx路456号', idCard: '110102199602022345', status: 'studying' as const, classId: class1.id },
    { name: '王五', studentNo: 'STU2026003', phone: '13800138003', email: 'wangwu@example.com', address: '上海市浦东新区xxx路789号', idCard: '310101199703033456', status: 'graduated' as const, classId: class2.id },
    { name: '赵六', studentNo: 'STU2026004', phone: '13800138004', email: 'zhaoliu@example.com', address: '广州市天河区xxx路321号', idCard: '440101199804044567', status: 'graduated' as const, classId: class2.id },
    { name: '孙七', studentNo: 'STU2026005', phone: '13800138005', email: 'sunqi@example.com', address: '深圳市南山区xxx路654号', idCard: '440301199905055678', status: 'studying' as const, classId: class1.id },
    { name: '周八', studentNo: 'STU2026006', phone: '13800138006', email: 'zhouba@example.com', address: '杭州市西湖区xxx路987号', idCard: '330101200006066789', status: 'suspended' as const, classId: class1.id },
    { name: '吴九', studentNo: 'STU2026007', phone: '13800138007', email: 'wujiu@example.com', address: '成都市武侯区xxx路147号', idCard: '510101200107077890', status: 'graduated' as const, classId: class2.id },
    { name: '郑十', studentNo: 'STU2026008', phone: '13800138008', email: 'zhengshi@example.com', address: '武汉市江汉区xxx路258号', idCard: '420101200208088901', status: 'studying' as const, classId: class1.id },
  ];
  
  for (const data of studentDataList) {
    const student = studentRepository.create(data);
    studentEntities.push(student);
  }
  const savedStudents = await studentRepository.save(studentEntities);
  console.log('Students created');

  console.log('Creating sessions...');
  const sessions: Session[] = [];
  for (let i = 1; i <= 15; i++) {
    const session = sessionRepository.create({
      name: `UI/UX课程第${i}讲`,
      startTime: new Date(2026, 2, 1 + i * 2, 9, 0, 0),
      endTime: new Date(2026, 2, 1 + i * 2, 17, 0, 0),
      hours: 8,
      status: i <= 12 ? 'completed' : 'scheduled',
      location: 'A座302教室',
      teacherName: '李明老师',
      content: `第${i}讲内容：${['UI设计基础', '色彩理论', '排版设计', 'Figma入门', '原型设计', '交互设计', '用户研究', '可用性测试', '设计系统', '动效设计', '产品思维', '作品集', '实战项目1', '实战项目2', '答辩'][i - 1]}`,
      classId: class1.id,
    });
    sessions.push(session);
  }
  for (let i = 1; i <= 20; i++) {
    const session = sessionRepository.create({
      name: `Python开发第${i}讲`,
      startTime: new Date(2025, 8, 1 + i * 2, 9, 0, 0),
      endTime: new Date(2025, 8, 1 + i * 2, 17, 0, 0),
      hours: 8,
      status: 'completed',
      location: 'B座201教室',
      teacherName: '张伟老师',
      content: `Python开发第${i}讲`,
      classId: class2.id,
    });
    sessions.push(session);
  }
  const savedSessions = await sessionRepository.save(sessions);
  console.log('Sessions created');

  console.log('Creating attendance records...');
  const attendances: Attendance[] = [];
  savedStudents.filter(s => s.classId === class1.id).forEach(student => {
    savedSessions.filter(s => s.classId === class1.id).slice(0, 12).forEach((session, idx) => {
      let status: any = 'present';
      if (student.name === '李四' && (idx === 3 || idx === 7 || idx === 10)) {
        status = 'absent';
      }
      if (student.name === '郑十' && idx === 5) {
        status = 'late';
      }
      if (student.name === '周八' && idx >= 4) {
        status = 'absent';
      }
      
      const attendance = attendanceRepository.create({
        studentId: student.id,
        sessionId: session.id,
        status,
        makeupApplied: student.name === '李四' && idx === 3,
        makeupCompleted: false,
      });
      attendances.push(attendance);
    });
  });
  
  savedStudents.filter(s => s.classId === class2.id).forEach(student => {
    savedSessions.filter(s => s.classId === class2.id).forEach((session, idx) => {
      let status: any = 'present';
      if (student.name === '赵六' && idx === 5) {
        status = 'leave';
      }
      
      const attendance = attendanceRepository.create({
        studentId: student.id,
        sessionId: session.id,
        status,
      });
      attendances.push(attendance);
    });
  });
  
  const savedAttendances = await attendanceRepository.save(attendances);
  console.log('Attendance records created');

  console.log('Recalculating student hours from attendance...');
  const { recalcStudentHours } = await import('../utils/hours');
  for (const student of savedStudents) {
    await recalcStudentHours(student.id);
  }
  console.log('Student hours recalculated');

  console.log('Creating makeup requests...');
  const lisi = savedStudents.find(s => s.name === '李四');
  const lisiAbsentAttendances = savedAttendances.filter(a => 
    a.studentId === lisi?.id && a.status === 'absent'
  );
  
  const makeupRequests = [
    makeupRepository.create({
      studentId: lisi!.id,
      originalAttendanceId: lisiAbsentAttendances[0].id,
      status: 'pending',
      reason: '生病请假，申请补课',
      preferredDate: new Date(2026, 5, 15, 14, 0, 0),
    }),
  ];
  await makeupRepository.save(makeupRequests);
  console.log('Makeup requests created');

  console.log('Creating certificates...');
  const graduatedStudents = savedStudents.filter(s => s.status === 'graduated');
  
  const certificates = [
    certificateRepository.create({
      studentId: graduatedStudents[0].id,
      certificateNo: 'CERT20260001',
      certificateType: 'Python全栈工程师认证',
      status: 'delivered',
      addressConfirmed: true,
      shippingAddress: graduatedStudents[0].address,
      shippingName: graduatedStudents[0].name,
      shippingPhone: graduatedStudents[0].phone,
      reviewedBy: 'admin',
      reviewedAt: new Date(2026, 2, 15),
      printedAt: new Date(2026, 2, 16),
    }),
    certificateRepository.create({
      studentId: graduatedStudents[1].id,
      certificateNo: 'CERT20260002',
      certificateType: 'Python全栈工程师认证',
      status: 'pending',
      addressConfirmed: false,
      remark: '学员未确认地址，无法寄送',
    }),
    certificateRepository.create({
      studentId: graduatedStudents[2].id,
      certificateNo: 'CERT20260003',
      certificateType: 'Python全栈工程师认证',
      status: 'printed',
      addressConfirmed: true,
      shippingAddress: graduatedStudents[2].address,
      shippingName: graduatedStudents[2].name,
      shippingPhone: graduatedStudents[2].phone,
      reviewedBy: 'admin',
      reviewedAt: new Date(2026, 2, 20),
      printedAt: new Date(2026, 2, 21),
    }),
  ];
  const savedCertificates = await certificateRepository.save(certificates);
  console.log('Certificates created');

  console.log('Creating shipments...');
  const shipments = [
    shipmentRepository.create({
      certificateId: savedCertificates[0].id,
      studentId: savedCertificates[0].studentId,
      trackingNo: 'SF1234567890123',
      courier: '顺丰速运',
      recipientName: savedCertificates[0].shippingName!,
      recipientPhone: savedCertificates[0].shippingPhone!,
      recipientAddress: savedCertificates[0].shippingAddress!,
      status: 'delivered',
      currentLocation: '已签收',
      shippedAt: new Date(2026, 2, 17),
      deliveredAt: new Date(2026, 2, 18),
    }),
    shipmentRepository.create({
      certificateId: savedCertificates[2].id,
      studentId: savedCertificates[2].studentId,
      trackingNo: 'YT9876543210987',
      courier: '圆通速递',
      recipientName: savedCertificates[2].shippingName!,
      recipientPhone: '13800138007',
      recipientAddress: '成都市武侯区旧地址xxx路',
      status: 'returned',
      currentLocation: '已退回发件方',
      returnReason: '地址错误，无法联系收件人，电话空号',
      shippedAt: new Date(2026, 2, 22),
      returnedAt: new Date(2026, 2, 28),
    }),
  ];
  await shipmentRepository.save(shipments);
  console.log('Shipments created');

  console.log('Creating notes...');
  const notes = [
    noteRepository.create({
      studentId: lisi!.id,
      content: '学员多次缺勤，已电话沟通，需要补课才能达到发证条件',
      createdBy: '教务-王老师',
      category: 'attendance',
    }),
    noteRepository.create({
      studentId: savedStudents.find(s => s.name === '赵六')!.id,
      content: '证书寄送地址未确认，多次电话未接，已发短信通知',
      createdBy: '证书管理员-小刘',
      category: 'certificate',
    }),
    noteRepository.create({
      studentId: savedStudents.find(s => s.name === '吴九')!.id,
      content: '快递因地址错误退回，需要联系学员确认新地址后重新寄送',
      createdBy: '客服-小陈',
      category: 'shipment',
    }),
    noteRepository.create({
      studentId: savedStudents.find(s => s.name === '周八')!.id,
      content: '学员因个人原因申请休学，已批准',
      createdBy: '教务-王老师',
      category: 'general',
    }),
  ];
  await noteRepository.save(notes);
  console.log('Notes created');

  console.log('Seed data completed!');
  console.log('=== 数据概览 ===');
  console.log(`班级: 3个`);
  console.log(`学员: ${savedStudents.length}人`);
  console.log(`实训场次: ${savedSessions.length}场`);
  console.log(`考勤记录: ${savedAttendances.length}条`);
  console.log(`补课申请: ${makeupRequests.length}条 (1条待处理)`);
  console.log(`证书: ${savedCertificates.length}张 (1张待确认地址)`);
  console.log(`寄送单: ${shipments.length}张 (1张已退回)`);
  console.log('\n=== 典型场景 ===');
  console.log('1. 缺勤未补: 李四 还有2次缺勤未补课');
  console.log('2. 证书信息待确认: 赵六 证书地址未确认');
  console.log('3. 快递退回: 吴九 证书因地址错误被退回');
  
  return { savedStudents, savedSessions, savedAttendances, savedCertificates, shipments };
}

async function seed() {
  const { AppDataSource } = await import('../data-source');
  await AppDataSource.initialize();
  console.log('Database connected');
  await seedDatabase(AppDataSource);
  await AppDataSource.destroy();
}

if (require.main === module) {
  seed().catch(console.error);
}
