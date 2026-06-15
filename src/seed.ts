import bcrypt from 'bcryptjs';
import { sequelize } from './config/database';
import { Compensation, Store, Tire, User, WarrantyClaim } from './models';
import ClaimStatus from './models/ClaimStatus';
import CompensationStatus from './models/CompensationStatus';
import Role from './models/Role';

const createSampleData = async () => {
  await sequelize.sync({ force: true });

  const store = await Store.create({
    name: '朝阳轮胎门店',
    address: '北京市朝阳区建国路88号',
    phone: '010-12345678',
  });

  const hashedPassword = await bcrypt.hash('123456', 10);

  await User.create({
    username: 'admin',
    password: hashedPassword,
    realName: '管理员',
    role: Role.ADMIN,
    storeId: store.id,
    phone: '13800138000',
  });

  const frontdesk = await User.create({
    username: 'frontdesk',
    password: hashedPassword,
    realName: '前台小王',
    role: Role.FRONT_DESK,
    storeId: store.id,
    phone: '13800138001',
  });

  const technician = await User.create({
    username: 'technician',
    password: hashedPassword,
    realName: '技师老李',
    role: Role.TECHNICIAN,
    storeId: store.id,
    phone: '13800138002',
  });

  const manager = await User.create({
    username: 'manager',
    password: hashedPassword,
    realName: '店长张经理',
    role: Role.STORE_MANAGER,
    storeId: store.id,
    phone: '13800138003',
  });

  const today = new Date();
  const oneYearLater = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  const twoYearsLater = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());

  const tire1 = await Tire.create({
    brand: '朝阳',
    model: 'RP76',
    size: '205/55R16',
    serialNumber: 'CY2026010001',
    productionDate: new Date(today.getFullYear() - 1, 0, 15),
    installationDate: new Date(today.getFullYear() - 1, 2, 1),
    vehiclePlate: '京A12345',
    storeId: store.id,
    warrantyEndDate: twoYearsLater,
  });

  const tire2 = await Tire.create({
    brand: '朝阳',
    model: 'RP58',
    size: '195/65R15',
    serialNumber: 'CY2026020002',
    productionDate: new Date(today.getFullYear() - 1, 1, 20),
    installationDate: new Date(today.getFullYear() - 1, 3, 15),
    vehiclePlate: '京B67890',
    storeId: store.id,
    warrantyEndDate: twoYearsLater,
  });

  const tire3 = await Tire.create({
    brand: '米其林',
    model: 'PRIMACY 4',
    size: '215/50R17',
    serialNumber: 'ML2026030003',
    productionDate: new Date(today.getFullYear() - 1, 2, 10),
    installationDate: new Date(today.getFullYear() - 1, 4, 1),
    vehiclePlate: '京C11111',
    storeId: store.id,
    warrantyEndDate: twoYearsLater,
  });

  const tire4 = await Tire.create({
    brand: '普利司通',
    model: 'TURANZA T005',
    size: '225/45R18',
    serialNumber: 'BS2026040004',
    productionDate: new Date(today.getFullYear() - 1, 3, 5),
    installationDate: new Date(today.getFullYear() - 1, 5, 15),
    vehiclePlate: '京D22222',
    storeId: store.id,
    warrantyEndDate: twoYearsLater,
  });

  const tire5 = await Tire.create({
    brand: '马牌',
    model: 'CC6',
    size: '185/65R14',
    serialNumber: 'CP2026050005',
    productionDate: new Date(today.getFullYear(), 0, 10),
    installationDate: new Date(today.getFullYear(), 1, 1),
    vehiclePlate: '京E33333',
    storeId: store.id,
    warrantyEndDate: twoYearsLater,
  });

  const tire6 = await Tire.create({
    brand: '邓禄普',
    model: 'SP SPORT MAXX',
    size: '235/45R19',
    serialNumber: 'DL2026060006',
    productionDate: new Date(today.getFullYear(), 2, 1),
    installationDate: new Date(today.getFullYear(), 3, 15),
    vehiclePlate: '京F44444',
    storeId: store.id,
    warrantyEndDate: twoYearsLater,
  });

  await WarrantyClaim.create({
    tireId: tire1.id,
    customerName: '张三',
    customerPhone: '13900139001',
    issueDescription: '轮胎行驶3000公里后出现鼓包，要求质保索赔',
    status: ClaimStatus.PENDING,
    storeId: store.id,
    createdBy: frontdesk.id,
    isRisk: false,
  });

  await WarrantyClaim.create({
    tireId: tire2.id,
    customerName: '李四',
    customerPhone: '13900139002',
    issueDescription: '轮胎侧面出现裂纹，怀疑是质量问题',
    status: ClaimStatus.PENDING,
    storeId: store.id,
    createdBy: frontdesk.id,
    isRisk: true,
    riskReason: '裂纹位置靠近胎侧受力点，存在安全隐患',
  });

  await WarrantyClaim.create({
    tireId: tire3.id,
    customerName: '王五',
    customerPhone: '13900139003',
    issueDescription: '轮胎磨损异常，行驶1万公里花纹已磨平',
    status: ClaimStatus.TECHNICIAN_REVIEW,
    storeId: store.id,
    createdBy: frontdesk.id,
    technicianId: technician.id,
    isRisk: false,
  });

  await WarrantyClaim.create({
    tireId: tire4.id,
    customerName: '赵六',
    customerPhone: '13900139004',
    issueDescription: '轮胎爆胎，车辆行驶中发生危险',
    status: ClaimStatus.TECHNICIAN_APPROVED,
    storeId: store.id,
    createdBy: frontdesk.id,
    technicianId: technician.id,
    technicianComment: '初步判断为质量问题导致爆胎，建议批准补偿',
    isRisk: true,
    riskReason: '爆胎事故可能涉及安全责任',
  });

  await WarrantyClaim.create({
    tireId: tire5.id,
    customerName: '孙七',
    customerPhone: '13900139005',
    issueDescription: '轮胎气门嘴漏气，多次维修仍无法解决',
    status: ClaimStatus.MANAGER_REVIEW,
    storeId: store.id,
    createdBy: frontdesk.id,
    technicianId: technician.id,
    managerId: manager.id,
    technicianComment: '气门嘴存在质量问题',
    isRisk: false,
  });

  const claim6 = await WarrantyClaim.create({
    tireId: tire6.id,
    customerName: '周八',
    customerPhone: '13900139006',
    issueDescription: '轮胎出现异常噪音，影响驾驶体验',
    status: ClaimStatus.APPROVED,
    storeId: store.id,
    createdBy: frontdesk.id,
    technicianId: technician.id,
    managerId: manager.id,
    technicianComment: '轮胎确实存在异常噪音',
    managerComment: '同意质保申请',
    isRisk: false,
  });

  const comp1 = await Compensation.create({
    claimId: claim6.id,
    type: 'REPLACEMENT',
    amount: 850.00,
    description: '更换全新朝阳RP76轮胎一条',
    status: CompensationStatus.PENDING,
  });

  const claim7 = await WarrantyClaim.create({
    tireId: tire1.id,
    customerName: '吴九',
    customerPhone: '13900139007',
    issueDescription: '轮胎鼓包，要求退款',
    status: ClaimStatus.COMPENSATION_PROCESSING,
    storeId: store.id,
    createdBy: frontdesk.id,
    technicianId: technician.id,
    managerId: manager.id,
    technicianComment: '符合质保条件',
    managerComment: '同意补偿',
    isRisk: false,
  });

  const comp2 = await Compensation.create({
    claimId: claim7.id,
    type: 'REFUND',
    amount: 650.00,
    description: '全额退款',
    status: CompensationStatus.APPROVED,
    approvedBy: manager.id,
    approvalComment: '同意退款',
  });

  const claim8 = await WarrantyClaim.create({
    tireId: tire2.id,
    customerName: '郑十',
    customerPhone: '13900139008',
    issueDescription: '轮胎安装后发现生产日期被篡改',
    status: ClaimStatus.REJECTED,
    storeId: store.id,
    createdBy: frontdesk.id,
    technicianId: technician.id,
    technicianComment: '经鉴定，轮胎为正品，日期未篡改',
    isRisk: true,
    riskReason: '客户可能存在恶意索赔倾向',
  });

  const claim9 = await WarrantyClaim.create({
    tireId: tire3.id,
    customerName: '钱十一',
    customerPhone: '13900139009',
    issueDescription: '轮胎鼓包，已完成补偿',
    status: ClaimStatus.COMPLETED,
    storeId: store.id,
    createdBy: frontdesk.id,
    technicianId: technician.id,
    managerId: manager.id,
    technicianComment: '符合质保条件，已处理',
    managerComment: '已完成补偿',
    isRisk: false,
    resolvedAt: new Date(today.getFullYear(), today.getMonth() - 1, 15),
  });

  await Compensation.create({
    claimId: claim9.id,
    type: 'REFUND',
    amount: 700.00,
    description: '全额退款已完成',
    status: CompensationStatus.COMPLETED,
    approvedBy: manager.id,
    paidBy: manager.id,
    approvalComment: '同意退款',
    paymentDate: new Date(today.getFullYear(), today.getMonth() - 1, 15),
  });

  console.log('样例数据创建完成！');
  console.log('测试账户：');
  console.log('  管理员: admin / 123456');
  console.log('  前台: frontdesk / 123456');
  console.log('  技师: technician / 123456');
  console.log('  店长: manager / 123456');
  console.log('');
  console.log('样例数据状态分布：');
  console.log('  PENDING: 2条（待处理，等待领取）');
  console.log('  TECHNICIAN_REVIEW: 1条（技师已领取，待审核）');
  console.log('  TECHNICIAN_APPROVED: 1条（技师审核通过，等待店长领取）');
  console.log('  MANAGER_REVIEW: 1条（店长已领取，待审核）');
  console.log('  APPROVED: 1条（店长批准，待创建补偿）');
  console.log('  COMPENSATION_PROCESSING: 1条（补偿处理中）');
  console.log('  REJECTED: 1条（已拒绝）');
  console.log('  COMPLETED: 1条（已完成）');
};

createSampleData().catch(console.error);