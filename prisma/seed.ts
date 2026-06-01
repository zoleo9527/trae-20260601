import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.supplierFeedback.deleteMany()
  await prisma.exceptionAttachment.deleteMany()
  await prisma.inspectionItem.deleteMany()
  await prisma.inspection.deleteMany()
  await prisma.exception.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.drawing.deleteMany()
  await prisma.part.deleteMany()
  await prisma.user.deleteMany()
  await prisma.supplier.deleteMany()

  const purchaser = await prisma.user.create({
    data: {
      email: 'purchaser@example.com',
      name: '张采购',
      role: 'PURCHASER',
    },
  })

  const processEngineer = await prisma.user.create({
    data: {
      email: 'engineer@example.com',
      name: '李工',
      role: 'PROCESS_ENGINEER',
    },
  })

  const qualityInspector = await prisma.user.create({
    data: {
      email: 'quality@example.com',
      name: '王质检',
      role: 'QUALITY_INSPECTOR',
    },
  })

  const supplier = await prisma.supplier.create({
    data: {
      name: '华鑫精密机械有限公司',
      contactName: '陈经理',
      email: 'chen@huaxin.com',
      phone: '13800138000',
      address: '江苏省苏州市工业园区',
    },
  })

  const supplierUser = await prisma.user.create({
    data: {
      email: 'supplier@example.com',
      name: '陈经理',
      role: 'SUPPLIER',
      supplierId: supplier.id,
    },
  })

  const partA = await prisma.part.create({
    data: {
      partNumber: 'PART-001',
      name: '法兰盘组件',
      description: '精密机械加工件，用于液压系统',
    },
  })

  const partB = await prisma.part.create({
    data: {
      partNumber: 'PART-002',
      name: '连接轴套',
      description: '高精度配合件',
    },
  })

  const partC = await prisma.part.create({
    data: {
      partNumber: 'PART-003',
      name: '密封端盖',
      description: '防水密封组件',
    },
  })

  const drawingA_v1 = await prisma.drawing.create({
    data: {
      partId: partA.id,
      version: 'A',
      revision: '01',
      title: '法兰盘组件图纸',
      description: '初始版本',
      status: 'APPROVED',
      createdById: processEngineer.id,
      approvedBy: processEngineer.id,
      approvedAt: new Date('2026-05-01'),
      fileName: 'PART-001_A01.dwg',
      fileUrl: '/attachments/PART-001_A01.dwg',
    },
  })

  const drawingA_v2 = await prisma.drawing.create({
    data: {
      partId: partA.id,
      version: 'A',
      revision: '02',
      title: '法兰盘组件图纸 - 公差更新',
      description: '更新内孔公差从 H7 改为 H6',
      status: 'APPROVED',
      createdById: processEngineer.id,
      approvedBy: processEngineer.id,
      approvedAt: new Date('2026-05-15'),
      fileName: 'PART-001_A02.dwg',
      fileUrl: '/attachments/PART-001_A02.dwg',
      changeLog: '2026-05-15: 内孔公差由 H7(+0.035/0) 调整为 H6(+0.021/0)，表面粗糙度要求提高',
      canUseOldVersion: true,
    },
  })

  const drawingB_v1 = await prisma.drawing.create({
    data: {
      partId: partB.id,
      version: 'A',
      revision: '01',
      title: '连接轴套图纸',
      description: '初始版本',
      status: 'APPROVED',
      createdById: processEngineer.id,
      approvedBy: processEngineer.id,
      approvedAt: new Date('2026-05-05'),
      fileName: 'PART-002_A01.dwg',
      fileUrl: '/attachments/PART-002_A01.dwg',
    },
  })

  const drawingC_v1 = await prisma.drawing.create({
    data: {
      partId: partC.id,
      version: 'A',
      revision: '01',
      title: '密封端盖图纸',
      description: '初始版本',
      status: 'APPROVED',
      createdById: processEngineer.id,
      approvedBy: processEngineer.id,
      approvedAt: new Date('2026-05-10'),
      fileName: 'PART-003_A01.dwg',
      fileUrl: '/attachments/PART-003_A01.dwg',
    },
  })

  const order1 = await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'PO-2026-06-001',
      supplierId: supplier.id,
      drawingId: drawingA_v1.id,
      partId: partA.id,
      quantity: 100,
      unitPrice: 150,
      totalPrice: 15000,
      status: 'IN_PRODUCTION',
      createdById: purchaser.id,
      expectedDeliveryDate: new Date('2026-06-15'),
      drawingConfirmed: false,
      notes: '订单下发时使用 A01 版本图纸，后续工艺更新了公差版本，请供应商确认是否能按新版本执行',
    },
  })

  const order2 = await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'PO-2026-06-002',
      supplierId: supplier.id,
      drawingId: drawingB_v1.id,
      partId: partB.id,
      quantity: 200,
      unitPrice: 85,
      totalPrice: 17000,
      status: 'RECEIVED',
      createdById: purchaser.id,
      expectedDeliveryDate: new Date('2026-05-28'),
      actualDeliveryDate: new Date('2026-05-27'),
      drawingConfirmed: true,
      drawingConfirmedAt: new Date('2026-05-06'),
      drawingConfirmedBy: purchaser.id,
      notes: '正常订单',
    },
  })

  const order3 = await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'PO-2026-06-003',
      supplierId: supplier.id,
      drawingId: drawingC_v1.id,
      partId: partC.id,
      quantity: 150,
      unitPrice: 65,
      totalPrice: 9750,
      status: 'RECEIVED',
      createdById: purchaser.id,
      expectedDeliveryDate: new Date('2026-05-30'),
      actualDeliveryDate: new Date('2026-05-29'),
      drawingConfirmed: true,
      drawingConfirmedAt: new Date('2026-05-11'),
      drawingConfirmedBy: purchaser.id,
      notes: '让步接收后进入复检',
    },
  })

  const inspection2 = await prisma.inspection.create({
    data: {
      orderId: order2.id,
      inspectorId: qualityInspector.id,
      quantityReceived: 200,
      quantityInspected: 50,
      status: 'FAILED',
      inspectionDate: new Date('2026-05-28'),
      notes: '尺寸超差，外径实测 φ50.05mm，超出公差上限 0.03mm',
    },
  })

  await prisma.inspectionItem.createMany({
    data: [
      {
        inspectionId: inspection2.id,
        itemName: '外径尺寸',
        specification: 'φ50h6(0/-0.016)',
        actualValue: 'φ50.05',
        isConforming: false,
        remark: '超出公差上限 0.066mm',
      },
      {
        inspectionId: inspection2.id,
        itemName: '内孔尺寸',
        specification: 'φ30H7(+0.021/0)',
        actualValue: 'φ30.015',
        isConforming: true,
        remark: '合格',
      },
      {
        inspectionId: inspection2.id,
        itemName: '表面粗糙度',
        specification: 'Ra 1.6',
        actualValue: 'Ra 1.4',
        isConforming: true,
        remark: '合格',
      },
      {
        inspectionId: inspection2.id,
        itemName: '同轴度',
        specification: '≤0.02',
        actualValue: '0.015',
        isConforming: true,
        remark: '合格',
      },
    ],
  })

  const inspection3 = await prisma.inspection.create({
    data: {
      orderId: order3.id,
      inspectorId: qualityInspector.id,
      quantityReceived: 150,
      quantityInspected: 30,
      status: 'CONCESSION',
      inspectionDate: new Date('2026-05-30'),
      notes: '首次检验发现平面度超差，已申请让步接收并批准，现进入复检流程',
    },
  })

  await prisma.inspectionItem.createMany({
    data: [
      {
        inspectionId: inspection3.id,
        itemName: '平面度',
        specification: '≤0.05mm',
        actualValue: '0.08mm',
        isConforming: false,
        remark: '让步接收',
      },
      {
        inspectionId: inspection3.id,
        itemName: '密封槽深度',
        specification: '2.5±0.05',
        actualValue: '2.52',
        isConforming: true,
        remark: '合格',
      },
    ],
  })

  const exception1 = await prisma.exception.create({
    data: {
      exceptionNumber: 'EXC-2026-001',
      orderId: order1.id,
      reportedById: qualityInspector.id,
      title: '图纸版本未确认 - 公差变更风险',
      description: '订单 PO-2026-06-001 下发时使用图纸版本 A01，但工艺部门已于 5 月 15 日发布 A02 版本，更新了内孔公差要求。目前供应商未确认是否按新版本生产，存在版本不匹配风险。请采购协调供应商确认图纸版本。',
      status: 'ANALYZING',
      type: 'DRAWING_VERSION_MISMATCH',
      rootCause: '图纸更新与订单下发不同步，未建立版本确认机制',
    },
  })

  const exception2 = await prisma.exception.create({
    data: {
      exceptionNumber: 'EXC-2026-002',
      orderId: order2.id,
      inspectionId: inspection2.id,
      reportedById: qualityInspector.id,
      title: '来料尺寸超差 - 连接轴套外径',
      description: '订单 PO-2026-06-002 来料检验发现，连接轴套外径实测 φ50.05mm，超出图纸要求公差（φ50h6 0/-0.016）。抽样 50 件，不合格率 100%，整批判定不合格。',
      status: 'AWAITING_SUPPLIER_FEEDBACK',
      type: 'DIMENSION_OUT_OF_TOLERANCE',
      rootCause: '待供应商分析',
      disposition: 'CONCESSION',
      concessionDecision: 'PENDING',
    },
  })

  const exception3 = await prisma.exception.create({
    data: {
      exceptionNumber: 'EXC-2026-003',
      orderId: order3.id,
      inspectionId: inspection3.id,
      reportedById: qualityInspector.id,
      title: '平面度超差让步接收后复检',
      description: '订单 PO-2026-06-003 密封端盖平面度超差（实测 0.08mm，要求 ≤0.05mm）。鉴于该批次产品用于非关键部位，且超差值较小，已申请让步接收并获得批准。现进入复检流程，对让步接收批次进行二次抽样检验，确认装配可行性。',
      status: 'ANALYZING',
      type: 'DIMENSION_OUT_OF_TOLERANCE',
      rootCause: '供应商加工设备平面度未定期校准',
      disposition: 'CONCESSION',
      concessionDecision: 'APPROVED',
      reworkResponsible: '供应商',
      reworkCost: 0,
    },
  })

  await prisma.supplierFeedback.create({
    data: {
      exceptionId: exception3.id,
      supplierId: supplierUser.id,
      content: '我司已收到贵司的异常反馈。经内部排查，平面度超差原因为加工设备平面度校准过期。现已完成设备校准，并对后续批次进行全检。针对本批次，我们接受让步接收的处理方案。',
      rootCauseAnalysis: '设备平面度校准周期过长（3个月），导致加工精度下降。',
      correctiveAction: '1. 立即对该设备进行平面度校准，已完成\n2. 对本批次产品进行全检，确认超差范围\n3. 后续批次增加首件检验和过程巡检',
      preventiveAction: '1. 将设备校准周期缩短为 1 个月\n2. 建立设备维护预警机制\n3. 增加加工过程中的尺寸抽检频次',
      attachmentUrl: '/attachments/corrective-action-report.pdf',
    },
  })

  await prisma.exceptionAttachment.create({
    data: {
      exceptionId: exception2.id,
      fileName: 'inspection-report-PO-002.pdf',
      fileUrl: '/attachments/inspection-report-PO-002.pdf',
      fileType: 'application/pdf',
      uploadedById: qualityInspector.id,
    },
  })

  console.log('Seed data created successfully!')
  console.log('Users:')
  console.log('  采购 - purchaser@example.com')
  console.log('  工艺工程师 - engineer@example.com')
  console.log('  质检 - quality@example.com')
  console.log('  供应商 - supplier@example.com')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
