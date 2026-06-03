import { sequelize, Cabinet, Cell, Order } from '../models/index.js';
import { CABINET_STATUS, CELL_STATUS, ORDER_STATUS } from '../utils/constants.js';

const seedData = {
  cabinets: [
    {
      cabinetNo: 'CAB-001',
      name: '阳光花园1号柜',
      location: '北京市朝阳区阳光花园小区北门',
      status: CABINET_STATUS.ONLINE,
      ipAddress: '192.168.1.101',
      remark: '主柜机，24小时运营',
    },
    {
      cabinetNo: 'CAB-002',
      name: '中心广场2号柜',
      location: '北京市朝阳区中心广场东侧',
      status: CABINET_STATUS.ONLINE,
      ipAddress: '192.168.1.102',
      remark: '繁华地段，使用率高',
    },
    {
      cabinetNo: 'CAB-003',
      name: '科技园3号柜',
      location: '北京市海淀区科技园A座',
      status: CABINET_STATUS.MAINTENANCE,
      ipAddress: '192.168.1.103',
      remark: '维护中',
    },
  ],
};

function generateCells(cabinetId, count, startNo = 1) {
  const cells = [];
  for (let i = 0; i < count; i++) {
    const cellNo = `A${String(startNo + i).padStart(3, '0')}`;
    const sizes = ['small', 'medium', 'large'];
    cells.push({
      cellNo,
      cabinetId,
      status: CELL_STATUS.AVAILABLE,
      size: sizes[i % 3],
      lockStatus: true,
      doorStatus: true,
    });
  }
  return cells;
}

export async function seed() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    await sequelize.sync({ force: true });
    console.log('数据库重置完成');
    for (const cabinetData of seedData.cabinets) {
      const cabinet = await Cabinet.create(cabinetData);
      console.log(`创建柜机: ${cabinet.cabinetNo} - ${cabinet.name}`);
      const cellCount = cabinet.cabinetNo === 'CAB-001' ? 10 : 8;
      const cells = generateCells(cabinet.id, cellCount);
      await Cell.bulkCreate(cells);
      const totalCells = await Cell.count({ where: { cabinetId: cabinet.id } });
      const availableCells = await Cell.count({
        where: { cabinetId: cabinet.id, status: CELL_STATUS.AVAILABLE },
      });
      await cabinet.update({ totalCells, availableCells });
      console.log(`  添加 ${cellCount} 个格口`);
    }
    const cabinet1 = await Cabinet.findOne({ where: { cabinetNo: 'CAB-001' }, include: [{ model: Cell, as: 'cells' }] });
    const testOrders = [
      {
        orderNo: 'TEST-001',
        userId: 'USER-1001',
        userName: '张三',
        userPhone: '13800138001',
        cabinetId: cabinet1.id,
        cellId: cabinet1.cells[0].id,
        status: ORDER_STATUS.CREATED,
        laundryType: '日常清洗',
        weight: 3.5,
        amount: 35.00,
        remark: '用户下单，待分配格口',
      },
      {
        orderNo: 'TEST-002',
        userId: 'USER-1002',
        userName: '李四',
        userPhone: '13800138002',
        cabinetId: cabinet1.id,
        cellId: cabinet1.cells[1].id,
        status: ORDER_STATUS.CELL_ASSIGNED,
        laundryType: '干洗',
        weight: 2.0,
        amount: 60.00,
        assignedAt: new Date(),
        remark: '已分配格口，待配送员投放',
      },
    ];
    for (const orderData of testOrders) {
      const order = await Order.create(orderData);
      if (order.status === ORDER_STATUS.CELL_ASSIGNED) {
        await Cell.update(
          { status: CELL_STATUS.OCCUPIED, currentOrderId: order.id, lastStatusChange: new Date() },
          { where: { id: order.cellId } }
        );
      }
      console.log(`创建测试订单: ${order.orderNo} - ${order.status}`);
    }
    await cabinet1.reload();
    const availableCells = await Cell.count({
      where: { cabinetId: cabinet1.id, status: CELL_STATUS.AVAILABLE },
    });
    await cabinet1.update({ availableCells });
    console.log('\n种子数据初始化完成!');
    console.log(`\n柜机总数: ${await Cabinet.count()}`);
    console.log(`格口总数: ${await Cell.count()}`);
    console.log(`订单总数: ${await Order.count()}`);
    return true;
  } catch (error) {
    console.error('种子数据初始化失败:', error);
    throw error;
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seed;
