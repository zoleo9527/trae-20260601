const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  await prisma.inspectionLine.createMany({
    data: [
      { name: '检测线A', status: 'IDLE' },
      { name: '检测线B', status: 'IDLE' },
      { name: '检测线C', status: 'MAINTENANCE' },
      { name: '检测线D', status: 'IDLE' }
    ],
    skipDuplicates: true
  })

  const vehicles = await prisma.vehicle.createMany({
    data: [
      { licensePlate: '京A12345', vehicleType: 'CAR', ownerName: '张三', ownerPhone: '13800138001', vin: 'LSVAU2186N2123456' },
      { licensePlate: '京B67890', vehicleType: 'CAR', ownerName: '李四', ownerPhone: '13800138002', vin: 'LSVAU2186N2123457' },
      { licensePlate: '京C11111', vehicleType: 'TRUCK', ownerName: '王五', ownerPhone: '13800138003', vin: 'LSVAU2186N2123458' },
      { licensePlate: '京D22222', vehicleType: 'CAR', ownerName: '赵六', ownerPhone: '13800138004', vin: 'LSVAU2186N2123459' },
      { licensePlate: '京E33333', vehicleType: 'MOTORCYCLE', ownerName: '孙七', ownerPhone: '13800138005', vin: 'LSVAU2186N2123460' },
      { licensePlate: '京F44444', vehicleType: 'CAR', ownerName: '周八', ownerPhone: '13800138006', vin: 'LSVAU2186N2123461' },
      { licensePlate: '京G55555', vehicleType: 'CAR', ownerName: '吴九', ownerPhone: '13800138007', vin: 'LSVAU2186N2123462' },
      { licensePlate: '京H66666', vehicleType: 'TRUCK', ownerName: '郑十', ownerPhone: '13800138008', vin: 'LSVAU2186N2123463' }
    ],
    skipDuplicates: true
  })

  const vehicle1 = await prisma.vehicle.findUnique({ where: { licensePlate: '京A12345' } })
  const vehicle2 = await prisma.vehicle.findUnique({ where: { licensePlate: '京B67890' } })
  const vehicle3 = await prisma.vehicle.findUnique({ where: { licensePlate: '京C11111' } })
  const vehicle4 = await prisma.vehicle.findUnique({ where: { licensePlate: '京D22222' } })
  const vehicle5 = await prisma.vehicle.findUnique({ where: { licensePlate: '京E33333' } })
  const vehicle6 = await prisma.vehicle.findUnique({ where: { licensePlate: '京F44444' } })

  const lineA = await prisma.inspectionLine.findUnique({ where: { name: '检测线A' } })
  const lineB = await prisma.inspectionLine.findUnique({ where: { name: '检测线B' } })
  const lineD = await prisma.inspectionLine.findUnique({ where: { name: '检测线D' } })

  await prisma.inspectionRecord.create({
    data: {
      vehicleId: vehicle1.id,
      lineId: lineA.id,
      status: 'INSPECTING',
      queueNumber: 'Q0001',
      currentStep: 3,
      assignedAt: new Date(Date.now() - 40 * 60 * 1000),
      startedAt: new Date(Date.now() - 35 * 60 * 1000),
      items: {
        create: [
          { itemCode: 'L001', itemName: '外观检查', result: 'PASS', inspector: '张检测员', inspectedAt: new Date(Date.now() - 30 * 60 * 1000) },
          { itemCode: 'L002', itemName: '制动系统', result: 'PASS', inspector: '张检测员', inspectedAt: new Date(Date.now() - 25 * 60 * 1000) },
          { itemCode: 'L003', itemName: '灯光系统', result: 'PENDING' },
          { itemCode: 'L004', itemName: '尾气排放', result: 'PENDING' },
          { itemCode: 'L005', itemName: '底盘检查', result: 'PENDING' },
          { itemCode: 'L006', itemName: '综合判定', result: 'PENDING' }
        ]
      }
    }
  })

  await prisma.inspectionRecord.create({
    data: {
      vehicleId: vehicle2.id,
      lineId: lineB.id,
      status: 'INSPECTING',
      queueNumber: 'Q0002',
      currentStep: 5,
      assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
      items: {
        create: [
          { itemCode: 'L001', itemName: '外观检查', result: 'PASS', inspector: '李检测员', inspectedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000) },
          { itemCode: 'L002', itemName: '制动系统', result: 'PASS', inspector: '李检测员', inspectedAt: new Date(Date.now() - 1.2 * 60 * 60 * 1000) },
          { itemCode: 'L003', itemName: '灯光系统', result: 'PASS', inspector: '李检测员', inspectedAt: new Date(Date.now() - 0.9 * 60 * 60 * 1000) },
          { itemCode: 'L004', itemName: '尾气排放', result: 'FAIL', measuredValue: 'CO: 0.3%', referenceValue: '< 0.2%', inspector: '李检测员', inspectedAt: new Date(Date.now() - 0.6 * 60 * 60 * 1000) },
          { itemCode: 'L005', itemName: '底盘检查', result: 'PENDING' },
          { itemCode: 'L006', itemName: '综合判定', result: 'PENDING' }
        ]
      }
    }
  })

  await prisma.inspectionRecord.create({
    data: {
      vehicleId: vehicle3.id,
      status: 'QUEUING',
      queueNumber: 'Q0003'
    }
  })

  await prisma.inspectionRecord.create({
    data: {
      vehicleId: vehicle4.id,
      status: 'QUEUING',
      queueNumber: 'Q0004'
    }
  })

  await prisma.inspectionRecord.create({
    data: {
      vehicleId: vehicle5.id,
      status: 'QUEUING',
      queueNumber: 'Q0005'
    }
  })

  await prisma.inspectionRecord.create({
    data: {
      vehicleId: vehicle6.id,
      lineId: lineD.id,
      status: 'ASSIGNED',
      queueNumber: 'Q0006',
      assignedAt: new Date(Date.now() - 10 * 60 * 1000),
      items: {
        create: [
          { itemCode: 'L001', itemName: '外观检查' },
          { itemCode: 'L002', itemName: '制动系统' },
          { itemCode: 'L003', itemName: '灯光系统' },
          { itemCode: 'L004', itemName: '尾气排放' },
          { itemCode: 'L005', itemName: '底盘检查' },
          { itemCode: 'L006', itemName: '综合判定' }
        ]
      }
    }
  })

  const rejectedRecord = await prisma.inspectionRecord.create({
    data: {
      vehicleId: vehicle1.id,
      status: 'REJECTED',
      queueNumber: 'Q0000',
      rejectReason: '车辆改装，不符合检测标准',
      rejectedAt: new Date(Date.now() - 30 * 60 * 1000),
      items: {
        create: [
          { itemCode: 'L001', itemName: '外观检查', result: 'FAIL', inspector: '王检测员', inspectedAt: new Date(Date.now() - 45 * 60 * 1000) }
        ]
      }
    }
  })

  await prisma.anomalyRecord.create({
    data: {
      recordId: rejectedRecord.id,
      anomalyType: 'VEHICLE_ISSUE',
      description: '发现车辆轮毂改装，尺寸不符合原厂规格',
      operator: '王检测员'
    }
  })

  await prisma.inspectionLine.update({
    where: { id: lineA.id },
    data: { status: 'BUSY' }
  })

  await prisma.inspectionLine.update({
    where: { id: lineB.id },
    data: { status: 'BUSY' }
  })

  await prisma.inspectionLine.update({
    where: { id: lineD.id },
    data: { status: 'BUSY' }
  })

  console.log('Seed data created successfully')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })