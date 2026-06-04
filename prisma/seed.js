const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'ADMIN'
    }
  });

  const receptionist = await prisma.user.upsert({
    where: { username: 'receptionist' },
    update: {},
    create: {
      username: 'receptionist',
      password: hashedPassword,
      name: '李接待',
      role: 'RECEPTIONIST'
    }
  });

  const pharmacist = await prisma.user.upsert({
    where: { username: 'pharmacist' },
    update: {},
    create: {
      username: 'pharmacist',
      password: hashedPassword,
      name: '王药师',
      role: 'PHARMACIST'
    }
  });

  const dispenser = await prisma.user.upsert({
    where: { username: 'dispenser' },
    update: {},
    create: {
      username: 'dispenser',
      password: hashedPassword,
      name: '张煎药',
      role: 'DISPENSER'
    }
  });

  const courier = await prisma.user.upsert({
    where: { username: 'courier' },
    update: {},
    create: {
      username: 'courier',
      password: hashedPassword,
      name: '赵配送',
      role: 'COURIER'
    }
  });

  console.log('用户创建完成');

  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        name: '张三',
        phone: '13800138001',
        idCard: '110101199001011234',
        address: '北京市朝阳区某某街道1号',
        age: 35,
        gender: '男'
      }
    }),
    prisma.patient.create({
      data: {
        name: '李四',
        phone: '13800138002',
        idCard: '110101198502022345',
        address: '北京市海淀区某某街道2号',
        age: 40,
        gender: '女'
      }
    }),
    prisma.patient.create({
      data: {
        name: '王五',
        phone: '13800138003',
        idCard: '110101197803033456',
        address: '北京市西城区某某街道3号',
        age: 47,
        gender: '男'
      }
    }),
    prisma.patient.create({
      data: {
        name: '赵六',
        phone: '13800138004',
        idCard: '110101199504044567',
        address: '北京市东城区某某街道4号',
        age: 29,
        gender: '女'
      }
    }),
    prisma.patient.create({
      data: {
        name: '钱七',
        phone: '13800138005',
        idCard: '110101196505055678',
        address: '北京市丰台区某某街道5号',
        age: 59,
        gender: '男'
      }
    })
  ]);

  console.log('患者创建完成');

  const prescriptions = await Promise.all([
    prisma.prescription.create({
      data: {
        prescriptionNo: 'RX20240001',
        patientId: patients[0].id,
        department: '内科',
        doctor: '陈医生',
        diagnosis: '感冒发热',
        medicines: JSON.stringify([
          { name: '金银花', dosage: '10g', note: '' },
          { name: '连翘', dosage: '10g', note: '' },
          { name: '薄荷', dosage: '6g', note: '后下' }
        ]),
        dosage: '水煎服，每日1剂，分2次温服',
        quantity: 5,
        riskLevel: 'NORMAL',
        status: 'PENDING_RECEPTION'
      }
    }),
    prisma.prescription.create({
      data: {
        prescriptionNo: 'RX20240002',
        patientId: patients[1].id,
        department: '内科',
        doctor: '林医生',
        diagnosis: '高血压',
        medicines: JSON.stringify([
          { name: '天麻', dosage: '10g', note: '' },
          { name: '钩藤', dosage: '15g', note: '后下' },
          { name: '石决明', dosage: '30g', note: '先煎' }
        ]),
        dosage: '水煎服，每日1剂',
        quantity: 7,
        riskLevel: 'CAUTION',
        riskNotes: '注意监测血压',
        status: 'PENDING_RECEPTION'
      }
    }),
    prisma.prescription.create({
      data: {
        prescriptionNo: 'RX20240003',
        patientId: patients[2].id,
        department: '肿瘤科',
        doctor: '刘主任',
        diagnosis: '肿瘤术后调理',
        medicines: JSON.stringify([
          { name: '黄芪', dosage: '30g', note: '' },
          { name: '党参', dosage: '20g', note: '' },
          { name: '白术', dosage: '15g', note: '' },
          { name: '附子', dosage: '10g', note: '先煎1小时' }
        ]),
        dosage: '水煎服，每日1剂',
        quantity: 14,
        riskLevel: 'HIGH_RISK',
        riskNotes: '含附子，需久煎，注意观察',
        status: 'PENDING_REVIEW',
        receiverId: receptionist.id,
        receivedAt: new Date(Date.now() - 3600000)
      }
    }),
    prisma.prescription.create({
      data: {
        prescriptionNo: 'RX20240004',
        patientId: patients[3].id,
        department: '妇科',
        doctor: '周医生',
        diagnosis: '月经不调',
        medicines: JSON.stringify([
          { name: '当归', dosage: '15g', note: '' },
          { name: '白芍', dosage: '12g', note: '' },
          { name: '川芎', dosage: '10g', note: '' }
        ]),
        dosage: '水煎服，每日1剂',
        quantity: 7,
        riskLevel: 'NORMAL',
        status: 'PENDING_REVIEW',
        receiverId: receptionist.id,
        receivedAt: new Date(Date.now() - 7200000)
      }
    }),
    prisma.prescription.create({
      data: {
        prescriptionNo: 'RX20240005',
        patientId: patients[4].id,
        department: '内科',
        doctor: '陈医生',
        diagnosis: '糖尿病',
        medicines: JSON.stringify([
          { name: '黄芪', dosage: '30g', note: '' },
          { name: '山药', dosage: '20g', note: '' },
          { name: '天花粉', dosage: '15g', note: '' }
        ]),
        dosage: '水煎服，每日1剂',
        quantity: 10,
        riskLevel: 'HIGH_RISK',
        riskNotes: '糖尿病患者，注意低糖饮食',
        status: 'REVIEW_PASSED',
        receiverId: receptionist.id,
        receivedAt: new Date(Date.now() - 86400000)
      }
    }),
    prisma.prescription.create({
      data: {
        prescriptionNo: 'RX20240006',
        patientId: patients[0].id,
        department: '骨科',
        doctor: '孙医生',
        diagnosis: '腰腿痛',
        medicines: JSON.stringify([
          { name: '独活', dosage: '12g', note: '' },
          { name: '桑寄生', dosage: '15g', note: '' },
          { name: '杜仲', dosage: '12g', note: '' }
        ]),
        dosage: '水煎服，每日1剂',
        quantity: 7,
        riskLevel: 'NORMAL',
        status: 'SUPPLEMENT_REQUIRED',
        receiverId: receptionist.id,
        receivedAt: new Date(Date.now() - 172800000)
      }
    }),
    prisma.prescription.create({
      data: {
        prescriptionNo: 'RX20240007',
        patientId: patients[1].id,
        department: '皮肤科',
        doctor: '吴医生',
        diagnosis: '湿疹',
        medicines: JSON.stringify([
          { name: '苦参', dosage: '10g', note: '' },
          { name: '黄柏', dosage: '10g', note: '' },
          { name: '地肤子', dosage: '15g', note: '' }
        ]),
        dosage: '水煎服，每日1剂，第三煎外洗',
        quantity: 5,
        riskLevel: 'CAUTION',
        status: 'REVIEW_REJECTED',
        receiverId: receptionist.id,
        receivedAt: new Date(Date.now() - 259200000)
      }
    }),
    prisma.prescription.create({
      data: {
        prescriptionNo: 'RX20240008',
        patientId: patients[2].id,
        department: '内科',
        doctor: '林医生',
        diagnosis: '冠心病',
        medicines: JSON.stringify([
          { name: '丹参', dosage: '20g', note: '' },
          { name: '川芎', dosage: '12g', note: '' },
          { name: '红花', dosage: '10g', note: '' }
        ]),
        dosage: '水煎服，每日1剂',
        quantity: 7,
        riskLevel: 'HIGH_RISK',
        riskNotes: '心血管疾病患者，注意观察',
        status: 'DISPENSED',
        receiverId: receptionist.id,
        receivedAt: new Date(Date.now() - 345600000)
      }
    })
  ]);

  console.log('处方创建完成');

  await prisma.statusHistory.createMany({
    data: [
      {
        prescriptionId: prescriptions[2].id,
        fromStatus: 'PENDING_RECEPTION',
        toStatus: 'PENDING_REVIEW',
        operatorId: receptionist.id,
        remarks: '处方已接收，待审方'
      },
      {
        prescriptionId: prescriptions[3].id,
        fromStatus: 'PENDING_RECEPTION',
        toStatus: 'PENDING_REVIEW',
        operatorId: receptionist.id,
        remarks: '处方已接收，待审方'
      },
      {
        prescriptionId: prescriptions[4].id,
        fromStatus: 'PENDING_RECEPTION',
        toStatus: 'PENDING_REVIEW',
        operatorId: receptionist.id,
        remarks: '处方已接收，待审方'
      },
      {
        prescriptionId: prescriptions[4].id,
        fromStatus: 'PENDING_REVIEW',
        toStatus: 'REVIEW_PASSED',
        operatorId: pharmacist.id,
        remarks: '审方通过'
      },
      {
        prescriptionId: prescriptions[5].id,
        fromStatus: 'PENDING_RECEPTION',
        toStatus: 'PENDING_REVIEW',
        operatorId: receptionist.id,
        remarks: '处方已接收，待审方'
      },
      {
        prescriptionId: prescriptions[5].id,
        fromStatus: 'PENDING_REVIEW',
        toStatus: 'SUPPLEMENT_REQUIRED',
        operatorId: pharmacist.id,
        remarks: '需要补录：缺少具体剂量说明'
      },
      {
        prescriptionId: prescriptions[6].id,
        fromStatus: 'PENDING_RECEPTION',
        toStatus: 'PENDING_REVIEW',
        operatorId: receptionist.id,
        remarks: '处方已接收，待审方'
      },
      {
        prescriptionId: prescriptions[6].id,
        fromStatus: 'PENDING_REVIEW',
        toStatus: 'REVIEW_REJECTED',
        operatorId: pharmacist.id,
        remarks: '审方驳回：处方存在配伍禁忌'
      },
      {
        prescriptionId: prescriptions[7].id,
        fromStatus: 'PENDING_RECEPTION',
        toStatus: 'PENDING_REVIEW',
        operatorId: receptionist.id,
        remarks: '处方已接收，待审方'
      },
      {
        prescriptionId: prescriptions[7].id,
        fromStatus: 'PENDING_REVIEW',
        toStatus: 'REVIEW_PASSED',
        operatorId: pharmacist.id,
        remarks: '审方通过'
      },
      {
        prescriptionId: prescriptions[7].id,
        fromStatus: 'REVIEW_PASSED',
        toStatus: 'DISPENSING',
        operatorId: dispenser.id,
        remarks: '开始煎药'
      },
      {
        prescriptionId: prescriptions[7].id,
        fromStatus: 'DISPENSING',
        toStatus: 'DISPENSED',
        operatorId: dispenser.id,
        remarks: '煎药完成'
      }
    ]
  });

  console.log('状态历史创建完成');

  await prisma.review.createMany({
    data: [
      {
        prescriptionId: prescriptions[4].id,
        reviewerId: pharmacist.id,
        action: 'APPROVE',
        reviewNotes: '处方合理，审核通过'
      },
      {
        prescriptionId: prescriptions[5].id,
        reviewerId: pharmacist.id,
        action: 'REQUEST_SUPPLEMENT',
        reviewNotes: '请补充具体用法用量说明',
        supplementRequirements: JSON.stringify({
          fields: ['dosage'],
          notes: '需要明确每次服用的具体剂量和服用时间'
        })
      },
      {
        prescriptionId: prescriptions[6].id,
        reviewerId: pharmacist.id,
        action: 'REJECT',
        reviewNotes: '处方存在配伍禁忌，苦参与某些药物不宜同用，请医生确认'
      },
      {
        prescriptionId: prescriptions[7].id,
        reviewerId: pharmacist.id,
        action: 'APPROVE',
        reviewNotes: '处方合理，注意观察患者反应'
      }
    ]
  });

  console.log('审方记录创建完成');

  await prisma.supplement.create({
    data: {
      prescriptionId: prescriptions[5].id,
      requesterId: pharmacist.id,
      requirements: JSON.stringify({
        fields: ['dosage', 'medicines'],
        notes: '需要明确每味药的具体剂量和详细的服用方法'
      })
    }
  });

  console.log('补录记录创建完成');
  console.log('所有种子数据创建完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
