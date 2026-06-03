import { initDatabase } from './src/config/database.js';
import { sequelize, Cabinet, Cell, Order, DeliveryRecord, PickupCode, ExceptionLog } from './src/models/index.js';
import { CABINET_STATUS, CELL_STATUS, ORDER_STATUS, PICKUP_CODE_STATUS } from './src/utils/constants.js';
import { getDeliveryRecordList, getDeliveryRecordDetail } from './src/services/DeliveryRecordService.js';
import { getPickupCodeList, getPickupCodeDetail, invalidateAndRegenerateCode } from './src/services/PickupCodeService.js';

async function test() {
  try {
    await initDatabase();
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    const cabinet = await Cabinet.create({ cabinetNo: 'T-001', name: 'Test', location: 'Test', status: CABINET_STATUS.ONLINE });
    console.log('cabinet.id:', cabinet.id);

    const cell = await Cell.create({ cellNo: 'A001', cabinetId: cabinet.id, status: CELL_STATUS.AVAILABLE, size: 'medium' });
    console.log('cell.id:', cell.id);

    const order = await Order.create({
      orderNo: 'ORD-TEST-001',
      userId: 'USER-001',
      cabinetId: cabinet.id,
      cellId: cell.id,
      status: ORDER_STATUS.DELIVERED,
      deliveredAt: new Date(),
    });
    console.log('order.id:', order.id);

    const delivery = await DeliveryRecord.create({
      orderId: order.id,
      cellId: cell.id,
      cabinetId: cabinet.id,
      deliveryStaffId: 'STAFF-001',
      deliveryStaffName: '配送员张三',
    });
    console.log('delivery.id:', delivery.id);

    const code = await PickupCode.create({
      orderId: order.id,
      cellId: cell.id,
      cabinetId: cabinet.id,
      code: '123456',
      status: PICKUP_CODE_STATUS.ACTIVE,
      expiredAt: new Date(Date.now() + 86400000),
    });
    console.log('pickupCode.id:', code.id);

    const list = await getDeliveryRecordList({ orderId: order.id });
    console.log('delivery list total:', list.total);

    const detail = await getDeliveryRecordDetail(delivery.id);
    console.log('delivery detail orderId:', detail.orderId);

    const codeList = await getPickupCodeList({ orderId: order.id });
    console.log('pickup code list total:', codeList.total);

    const codeDetail = await getPickupCodeDetail(code.id);
    console.log('pickup code detail code:', codeDetail.code);

    const newCode = await invalidateAndRegenerateCode(order.id, 'CS-001', '用户反馈取件码无法使用');
    console.log('new code:', newCode.code, 'status:', newCode.status);
    console.log('invalidated codes:', newCode.invalidatedCodes);

    const codeList2 = await getPickupCodeList({ orderId: order.id });
    console.log('pickup code list after invalidate total:', codeList2.total);
    const activeCodesList = codeList2.list.filter(c => c.status === 'active');
    const expiredCodesList = codeList2.list.filter(c => c.status === 'expired');
    console.log('active codes:', activeCodesList.length, 'expired codes:', expiredCodesList.length);

    const expList = await ExceptionLog.findAll({ where: { orderId: order.id } });
    const expLog = expList[0];
    console.log('exception log handled:', expLog.handled, 'handleResult:', expLog.handleResult);

    console.log('\nAll tests passed!');
  } catch (err) {
    console.error('Error:', err.message, err.stack);
  }
  process.exit(0);
}

test();
