import bcrypt from 'bcryptjs';
import { sequelize } from './config/database';
import { Store, User, Tire, WarrantyClaim, Compensation } from './models';
import Role from './models/Role';
import ClaimStatus from './models/ClaimStatus';
import CompensationStatus from './models/CompensationStatus';

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

  await User.create({
    username: 'frontdesk',
    password: hashedPassword,
    realName: '前台小王',
    role: Role.FRONT_DESK,
    storeId: store.id,
    phone: '13800138001',
  });

  await User.create({
    username: 'technician',
    password: hashedPassword,
    realName: '技师老李',
    role: Role.TECHNICIAN,
    storeId: store.id,
    phone: '13800138002',
  });

  await User.create({
    username: 'manager',
    password: hashedPassword,
    realName: '店长张经理',
    role: Role.STORE_MANAGER,
    storeId: store.id,
    phone: '13800138003',
  });

  const tire1 = await Tire.create({
    brand: '朝阳',
    model: 'RP76',
    size: '205/55R16',
    serialNumber: 'CY2023010001',
    productionDate: new Date('2023-01-15'),
    installationDate: new Date('2023-03-01'),
    vehiclePlate: '京A12345',
    storeId: store.id,
    warrantyEndDate: new Date('2025-03-01'),
  });

  const tire2 = await Tire.create({
    brand: '朝阳',
    model: 'RP58',
    size: '195/65R15',
    serialNumber: 'CY2023020002',
    productionDate: new Date('2023-02-20'),
    installationDate: new Date('2023-04-15'),
    vehiclePlate: '京B67890',
    storeId: store.id,
    warrantyEndDate: new Date('2025-04-15'),
  });

  const tire3 = await Tire.create({
    brand: '米其林',
    model: 'PRIMACY 4',
    size: '215/50R17',
    serialNumber: 'ML2023030003',
    productionDate: new Date('2023-03-10'),
    installationDate: new Date('2023-05-01'),
    vehiclePlate: '京C11111',
    storeId: store.id,
    warrantyEndDate: new Date('2025-05-01'),
  });

  const tire4 = await Tire.create({
    brand: '普利司通',
    model: 'TURANZA T005',
    size: '225/45R18',
    serialNumber: 'BS2023040004',
    productionDate: new Date('2023-04-05'),
    installationDate: new Date('2023-06-15'),
    vehiclePlate: '京D22222',
    storeId: store.id,
    warrantyEndDate: new Date('2025-06-15'),
  });

  const frontdesk = await User.findOne({ where: { username: 'frontdesk' } });
  const technician = await User.findOne({ where: { username: 'technician' } });
  const manager = await User.findOne({ where: { username: 'manager' } });

  await WarrantyClaim.create({
    tireId: tire1.id,
    customerName: '张三',
    customerPhone: '13900139001',
    issueDescription: '轮胎行驶3000公里后出现鼓包，要求质保索赔',
    status: ClaimStatus.PENDING,
    storeId: store.id,
    createdBy: frontdesk!.id,
    isRisk: false,
  });

  await WarrantyClaim.create({
    tireId: tire2.id,
    customerName: '李四',
    customerPhone: '13900139002',
    issueDescription: '轮胎侧面出现裂纹，怀疑是质量问题',
    status: ClaimStatus.TECHNICIAN_REVIEW,
    storeId: store.id,
    createdBy: frontdesk!.id,
    technicianId: technician!.id,
    isRisk: true,
    riskReason: '裂纹位置靠近胎侧受力点，存在安全隐患',
  });

  await WarrantyClaim.create({
    tireId: tire3.id,
    customerName: '王五',
    customerPhone: '13900139003',
    issueDescription: '轮胎磨损异常，行驶1万公里花纹已磨平',
    status: ClaimStatus.TECHNICIAN_APPROVED,
    storeId: store.id,
    createdBy: frontdesk!.id,
    technicianId: technician!.id,
    technicianComment: '经检测，轮胎磨损确实异常，建议予以质保',
    isRisk: false,
  });

  const claim4 = await WarrantyClaim.create({
    tireId: tire4.id,
    customerName: '赵六',
    customerPhone: '13900139004',
    issueDescription: '轮胎爆胎，车辆行驶中发生危险',
    status: ClaimStatus.MANAGER_REVIEW,
    storeId: store.id,
    createdBy: frontdesk!.id,
    technicianId: technician!.id,
    technicianComment: '初步判断为质量问题导致爆胎，建议批准补偿',
    isRisk: true,
    riskReason: '爆胎事故可能涉及安全责任',
  });

  const claim5 = await WarrantyClaim.create({
    tireId: tire1.id,
    customerName: '孙七',
    customerPhone: '13900139005',
    issueDescription: '轮胎气门嘴漏气，多次维修仍无法解决',
    status: ClaimStatus.APPROVED,
    storeId: store.id,
    createdBy: frontdesk!.id,
    technicianId: technician!.id,
    managerId: manager!.id,
    technicianComment: '气门嘴存在质量问题',
    managerComment: '同意质保申请',
    isRisk: false,
  });

  await Compensation.create({
    claimId: claim5.id,
    type: 'REPLACEMENT',
    amount: 850.00,
    description: '更换全新朝阳RP76轮胎一条',
    status: CompensationStatus.PENDING,
  });

  const claim6 = await WarrantyClaim.create({
    tireId: tire2.id,
    customerName: '周八',
    customerPhone: '13900139006',
    issueDescription: '轮胎出现异常噪音，影响驾驶体验',
    status: ClaimStatus.COMPENSATION_PROCESSING,
    storeId: store.id,
    createdBy: frontdesk!.id,
    technicianId: technician!.id,
    managerId: manager!.id,
    technicianComment: '轮胎确实存在异常噪音',
    managerComment: '同意补偿',
    isRisk: false,
  });

  const comp2 = await Compensation.create({
    claimId: claim6.id,
    type: 'DISCOUNT',
    amount: 200.00,
    description: '给予下次购买轮胎200元折扣优惠',
    status: CompensationStatus.APPROVED,
    approvedBy: manager!.id,
    approvalComment: '同意折扣补偿',
  });

  const claim7 = await WarrantyClaim.create({
    tireId: tire3.id,
    customerName: '吴九',
    customerPhone: '13900139007',
    issueDescription: '轮胎鼓包，要求退款',
    status: ClaimStatus.COMPLETED,
    storeId: store.id,
    createdBy: frontdesk!.id,
    technicianId: technician!.id,
    managerId: manager!.id,
    technicianComment: '符合质保条件',
    managerComment: '已处理完成',
    isRisk: false,
    resolvedAt: new Date('2024-01-15'),
  });

  await Compensation.create({
    claimId: claim7.id,
    type: 'REFUND',
    amount: 650.00,
    description: '全额退款',
    status: CompensationStatus.COMPLETED,
    approvedBy: manager!.id,
    paidBy: manager!.id,
    approvalComment: '同意退款',
    paymentDate: new Date('2024-01-15'),
  });

  await WarrantyClaim.create({
    tireId: tire4.id,
    customerName: '郑十',
    customerPhone: '13900139008',
    issueDescription: '轮胎安装后发现生产日期被篡改',
    status: ClaimStatus.REJECTED,
    storeId: store.id,
    createdBy: frontdesk!.id,
    technicianId: technician!.id,
    technicianComment: '经鉴定，轮胎为正品，日期未篡改',
    isRisk: true,
    riskReason: '客户可能存在恶意索赔倾向',
  });

  console.log('样例数据创建完成！');
  console.log('测试账户：');
  console.log('  管理员: admin / 123456');
  console.log('  前台: frontdesk / 123456');
  console.log('  技师: technician / 123456');
  console.log('  店长: manager / 123456');
};

createSampleData().catch(console.error);