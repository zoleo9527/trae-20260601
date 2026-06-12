import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../database';
import {
  User,
  Property,
  ViewingRecord,
  Quotation,
  Contract,
  HandoverForm,
  DepositRecord,
  PropertyStatus,
} from '../types';
import { logOperation } from '../utils/operationLogger';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

const createUser = async (
  username: string,
  name: string,
  role: User['role'],
  password: string
): Promise<User> => {
  const user: User = {
    id: uuidv4(),
    username,
    name,
    role,
    createdAt: new Date().toISOString(),
  };
  db.users.set(user.id, user);
  db.userPasswords.set(user.username, await hashPassword(password));
  return user;
};

const createProperty = (
  building: string,
  floor: string,
  roomNumber: string,
  area: number,
  unitPrice: number,
  decoration: Property['decoration'],
  orientation: string,
  status: PropertyStatus,
  facilities: string[],
  description?: string
): Property => {
  const now = new Date().toISOString();
  const property: Property = {
    id: uuidv4(),
    building,
    floor,
    roomNumber,
    area,
    unitPrice,
    decoration,
    orientation,
    status,
    facilities,
    description,
    createdAt: now,
    updatedAt: now,
  };
  db.properties.set(property.id, property);
  return property;
};

export const seedDatabase = async (): Promise<void> => {
  console.log('开始初始化演示数据...');

  db.users.clear();
  db.properties.clear();
  db.viewingRecords.clear();
  db.quotations.clear();
  db.contracts.clear();
  db.handoverForms.clear();
  db.depositRecords.clear();
  db.operationLogs = [];
  db.userPasswords.clear();

  const consultant = await createUser(
    'consultant',
    '张顾问',
    'rental_consultant',
    '123456'
  );
  const manager = await createUser(
    'manager',
    '李经理',
    'operation_manager',
    '123456'
  );
  const finance = await createUser(
    'finance',
    '王财务',
    'finance',
    '123456'
  );

  console.log('演示账号已创建:');
  console.log('  租赁顾问: consultant / 123456');
  console.log('  运营经理: manager / 123456');
  console.log('  财务: finance / 123456');

  const property1 = createProperty(
    '国贸中心A座',
    '15层',
    '1501',
    200,
    180,
    'fine',
    '南向',
    'vacant',
    ['中央空调', '独立卫生间', '24小时保安', '电梯直达', '地下车位'],
    '精装修，拎包入住，视野开阔'
  );

  const property2 = createProperty(
    '国贸中心A座',
    '18层',
    '1803',
    350,
    200,
    'standard',
    '东南向',
    'quotation_submitted',
    ['中央空调', '开放办公区', '会议室', '茶水间'],
    '标准装修，可灵活分隔，适合中型企业'
  );

  const property3 = createProperty(
    '国贸中心B座',
    '8层',
    '802',
    150,
    160,
    'fine',
    '西南向',
    'occupied',
    ['中央空调', '独立办公室', '24小时空调', '员工餐厅'],
    '精装修，位于核心商圈，交通便利'
  );

  const property4 = createProperty(
    '国贸中心B座',
    '12层',
    '1201',
    500,
    220,
    'raw',
    '南北通透',
    'contract_signed',
    ['中央空调', '可定制装修', '独立大堂', 'VIP电梯'],
    '毛坯房，可根据客户需求定制装修'
  );

  const property5 = createProperty(
    '金融中心C座',
    '22层',
    '2201',
    800,
    280,
    'fine',
    '360度全景',
    'handover_completed',
    ['总裁办公室', '独立董事会会议室', 'VIP接待区', '24小时管家服务'],
    '顶层豪华办公空间，360度城市景观'
  );

  const property6 = createProperty(
    '金融中心C座',
    '5层',
    '505',
    80,
    150,
    'standard',
    '东向',
    'viewing_completed',
    ['共享前台', '共享会议室', '24小时门禁'],
    '小型办公空间，适合创业团队'
  );

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const viewing1: ViewingRecord = {
    id: uuidv4(),
    propertyId: property2.id,
    customerName: '陈明',
    customerPhone: '13800138001',
    companyName: '科技创新有限公司',
    scheduledAt: yesterday.toISOString(),
    actualAt: yesterday.toISOString(),
    consultantId: consultant.id,
    consultantName: consultant.name,
    feedback: '客户对面积和装修满意，主要关注价格和免租期',
    interestLevel: 'high',
    needs: '需要350平米左右，能容纳40人办公，希望有独立会议室',
    status: 'completed',
    nextFollowUp: '明天发送报价单',
    createdAt: yesterday.toISOString(),
  };
  db.viewingRecords.set(viewing1.id, viewing1);

  const viewing2: ViewingRecord = {
    id: uuidv4(),
    propertyId: property6.id,
    customerName: '林小燕',
    customerPhone: '13900139002',
    companyName: '创意设计工作室',
    scheduledAt: yesterday.toISOString(),
    actualAt: yesterday.toISOString(),
    consultantId: consultant.id,
    consultantName: consultant.name,
    feedback: '空间有点小，但是地段好，正在考虑',
    interestLevel: 'medium',
    needs: '需要80-100平米，10人团队',
    status: 'completed',
    nextFollowUp: '一周后跟进',
    createdAt: yesterday.toISOString(),
  };
  db.viewingRecords.set(viewing2.id, viewing2);

  const viewing3: ViewingRecord = {
    id: uuidv4(),
    propertyId: property1.id,
    customerName: '赵强',
    customerPhone: '13700137003',
    companyName: '未来科技有限公司',
    scheduledAt: tomorrow.toISOString(),
    consultantId: consultant.id,
    consultantName: consultant.name,
    interestLevel: 'low',
    status: 'scheduled',
    createdAt: now.toISOString(),
  };
  db.viewingRecords.set(viewing3.id, viewing3);

  const quotation1: Quotation = {
    id: uuidv4(),
    quotationNo: `QO${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}0001`,
    propertyId: property2.id,
    customerName: '陈明',
    customerPhone: '13800138001',
    companyName: '科技创新有限公司',
    viewingRecordId: viewing1.id,
    consultantId: consultant.id,
    consultantName: consultant.name,
    leaseTerm: 36,
    rentFreePeriod: 2,
    paymentMethod: 'quarterly',
    depositMonths: 3,
    items: [
      { name: '租金', description: '350平米 x 200元/平米/月 x 36个月', quantity: 36, unit: '月', unitPrice: 70000, amount: 2520000 },
      { name: '物业费', description: '20元/平米/月', quantity: 36, unit: '月', unitPrice: 7000, amount: 252000 },
    ],
    totalAmount: 2772000,
    remarks: '首年租金可享受95折优惠，续租有优先选择权',
    status: 'submitted',
    validUntil: nextMonth.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  db.quotations.set(quotation1.id, quotation1);

  const contract1: Contract = {
    id: uuidv4(),
    contractNo: `CO${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}0001`,
    propertyId: property4.id,
    quotationId: uuidv4(),
    customerName: '刘建国',
    customerPhone: '13600136004',
    companyName: '国际金融投资集团',
    leaseStartDate: nextMonth.toISOString(),
    leaseEndDate: new Date(nextMonth.getTime() + 365 * 3 * 24 * 60 * 60 * 1000).toISOString(),
    leaseTerm: 36,
    monthlyRent: 110000,
    annualRent: 1320000,
    paymentMethod: '季度支付',
    depositAmount: 330000,
    rentFreePeriod: 3,
    clauses: [
      { id: uuidv4(), title: '租赁标的', content: '甲方将位于国贸中心B座12层1201室，建筑面积500平方米的房屋出租给乙方使用。', category: 'basic' },
      { id: uuidv4(), title: '租赁期限', content: '租赁期为3年，自2024年7月15日起至2027年7月14日止。', category: 'basic' },
      { id: uuidv4(), title: '租金及支付方式', content: '月租金为人民币110,000元整，按季度支付，乙方应于每季度首月5日前支付当季度租金。', category: 'payment' },
      { id: uuidv4(), title: '押金', content: '乙方应于签署本合同之日支付3个月租金作为押金，共计人民币330,000元整。', category: 'payment' },
      { id: uuidv4(), title: '违约责任', content: '任何一方违反本合同约定，应向守约方支付相当于3个月租金的违约金。', category: 'liability' },
      { id: uuidv4(), title: '合同终止', content: '租赁期满或合同解除后，乙方应于7日内将房屋恢复原状并交还甲方。', category: 'termination' },
    ],
    attachments: [],
    status: 'signed',
    createdBy: consultant.id,
    createdByName: consultant.name,
    reviewerId: manager.id,
    reviewerName: manager.name,
    reviewComment: '条款完整，同意签署',
    reviewedAt: now.toISOString(),
    signatoryPartyA: '国贸中心物业有限公司',
    signatoryPartyB: '国际金融投资集团',
    signedAt: now.toISOString(),
    createdAt: lastMonth.toISOString(),
    updatedAt: now.toISOString(),
  };
  db.contracts.set(contract1.id, contract1);

  const contract2: Contract = {
    id: uuidv4(),
    contractNo: `CO${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}0002`,
    propertyId: property3.id,
    quotationId: uuidv4(),
    customerName: '周华',
    customerPhone: '13500135005',
    companyName: '互联网科技有限公司',
    leaseStartDate: lastMonth.toISOString(),
    leaseEndDate: new Date(lastMonth.getTime() + 365 * 2 * 24 * 60 * 60 * 1000).toISOString(),
    leaseTerm: 24,
    monthlyRent: 24000,
    annualRent: 288000,
    paymentMethod: '月度支付',
    depositAmount: 72000,
    rentFreePeriod: 1,
    clauses: [
      { id: uuidv4(), title: '租赁标的', content: '甲方将位于国贸中心B座8层802室，建筑面积150平方米的房屋出租给乙方使用。', category: 'basic' },
      { id: uuidv4(), title: '租金及支付', content: '月租金24,000元，按月支付，每月5日前支付当月租金。', category: 'payment' },
    ],
    attachments: [],
    status: 'signed',
    createdBy: consultant.id,
    createdByName: consultant.name,
    reviewerId: manager.id,
    reviewerName: manager.name,
    reviewedAt: lastMonth.toISOString(),
    signatoryPartyA: '国贸中心物业有限公司',
    signatoryPartyB: '互联网科技有限公司',
    signedAt: lastMonth.toISOString(),
    createdAt: new Date(lastMonth.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: lastMonth.toISOString(),
  };
  db.contracts.set(contract2.id, contract2);

  const handover1: HandoverForm = {
    id: uuidv4(),
    handoverNo: `HO${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}0001`,
    propertyId: property5.id,
    contractId: uuidv4(),
    type: 'move_in',
    handoverDate: yesterday.toISOString(),
    items: [
      { id: uuidv4(), name: '入户门钥匙', description: '电子门禁卡3张', quantity: 3, condition: 'good' },
      { id: uuidv4(), name: '中央空调', description: '大金中央VRV系统', quantity: 1, condition: 'good' },
      { id: uuidv4(), name: '办公家具', description: '实木办公桌10张', quantity: 10, condition: 'good' },
      { id: uuidv4(), name: '照明系统', description: 'LED照明及智能控制', quantity: 1, condition: 'good' },
      { id: uuidv4(), name: '消防设施', description: '烟感、喷淋、灭火器', quantity: 1, condition: 'good' },
    ],
    remarks: '所有设施设备运行正常，客户无异议',
    status: 'completed',
    createdBy: manager.id,
    createdByName: manager.name,
    receiverName: '孙丽华',
    receiverSignAt: yesterday.toISOString(),
    delivererName: manager.name,
    delivererSignAt: yesterday.toISOString(),
    createdAt: yesterday.toISOString(),
    updatedAt: yesterday.toISOString(),
  };
  db.handoverForms.set(handover1.id, handover1);

  const deposit1: DepositRecord = {
    id: uuidv4(),
    depositNo: `DP${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}0001`,
    propertyId: property3.id,
    contractId: contract2.id,
    customerName: '周华',
    amount: 72000,
    type: 'rent_deposit',
    status: 'paid',
    paidAt: lastMonth.toISOString(),
    createdBy: finance.id,
    createdByName: finance.name,
    createdAt: lastMonth.toISOString(),
    updatedAt: lastMonth.toISOString(),
  };
  db.depositRecords.set(deposit1.id, deposit1);

  const deposit2: DepositRecord = {
    id: uuidv4(),
    depositNo: `DP${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}0002`,
    propertyId: property4.id,
    contractId: contract1.id,
    customerName: '刘建国',
    amount: 330000,
    type: 'rent_deposit',
    status: 'paid',
    paidAt: now.toISOString(),
    createdBy: finance.id,
    createdByName: finance.name,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  db.depositRecords.set(deposit2.id, deposit2);

  logOperation({
    entityType: 'property',
    entityId: property2.id,
    action: 'submit_quotation',
    description: '租赁顾问提交报价单，等待运营经理确认',
    operator: consultant,
    oldStatus: 'quotation_pending',
    newStatus: 'quotation_submitted',
  });

  logOperation({
    entityType: 'contract',
    entityId: contract1.id,
    action: 'sign_contract',
    description: '合同已由双方签署完成',
    operator: manager,
    oldStatus: 'approved',
    newStatus: 'signed',
  });

  logOperation({
    entityType: 'handover',
    entityId: handover1.id,
    action: 'complete_handover',
    description: '物业交接完成，双方确认签字',
    operator: manager,
    oldStatus: 'in_progress',
    newStatus: 'completed',
  });

  logOperation({
    entityType: 'deposit',
    entityId: deposit2.id,
    action: 'confirm_payment',
    description: '财务确认押金已到账',
    operator: finance,
    oldStatus: 'unpaid',
    newStatus: 'paid',
  });

  console.log(`已初始化 ${db.properties.size} 个房源`);
  console.log(`已初始化 ${db.viewingRecords.size} 条看房记录`);
  console.log(`已初始化 ${db.quotations.size} 份报价单`);
  console.log(`已初始化 ${db.contracts.size} 份合同`);
  console.log(`已初始化 ${db.handoverForms.size} 份交接单`);
  console.log(`已初始化 ${db.depositRecords.size} 条押金记录`);
  console.log(`已初始化 ${db.operationLogs.length} 条操作日志`);
  console.log('演示数据初始化完成！');
};
