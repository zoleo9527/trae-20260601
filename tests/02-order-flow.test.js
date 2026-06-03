import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/server.js';
import { setupTestDatabase, teardownTestDatabase, createTestUser, createTestDeliveryStaff } from './setup.js';
import { Cabinet, Order, Cell, PickupCode } from '../src/models/index.js';
import { ORDER_STATUS, CELL_STATUS } from '../src/utils/constants.js';

describe('订单流程测试', () => {
  let cabinet;
  let testUser;
  let deliveryStaff;

  before(async () => {
    await setupTestDatabase();
    cabinet = await Cabinet.findOne({ where: { cabinetNo: 'CAB-001' }, include: [{ model: Cell, as: 'cells' }] });
    testUser = createTestUser();
    deliveryStaff = createTestDeliveryStaff();
  });

  after(async () => {
    await teardownTestDatabase();
  });

  test('1. 创建订单', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        ...testUser,
        laundryType: '日常清洗',
        weight: 2.5,
        amount: 25.00,
      });
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.code, 201);
    assert.equal(res.body.data.status, ORDER_STATUS.CREATED);
    assert.ok(res.body.data.orderNo.startsWith('LD'));
  });

  test('2. 分配格口', async () => {
    const order = await Order.findOne({ where: { userId: testUser.userId, status: ORDER_STATUS.CREATED } });
    assert.ok(order, '测试订单不存在');
    const res = await request(app)
      .post(`/api/orders/${order.id}/assign-cell`)
      .send({
        cabinetId: cabinet.id,
        preferredSize: 'medium',
      });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.code, 200);
    assert.equal(res.body.data.order.status, ORDER_STATUS.CELL_ASSIGNED);
    assert.equal(res.body.data.cell.status, CELL_STATUS.OCCUPIED);
    assert.equal(res.body.data.cell.currentOrderId, order.id);
    const updatedCabinet = await Cabinet.findByPk(cabinet.id);
    assert.equal(updatedCabinet.availableCells, cabinet.totalCells - 1 - 1);
  });

  test('3. 配送员投放', async () => {
    const order = await Order.findOne({ where: { userId: testUser.userId, status: ORDER_STATUS.CELL_ASSIGNED } });
    assert.ok(order, '待投放订单不存在');
    const res = await request(app)
      .post(`/api/orders/${order.id}/deliver`)
      .send({
        ...deliveryStaff,
        itemCount: 1,
        remark: '正常投放',
      });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.code, 200);
    assert.equal(res.body.data.order.status, ORDER_STATUS.DELIVERED);
    assert.equal(res.body.data.cell.status, CELL_STATUS.DELIVERED);
    assert.ok(res.body.data.pickupCode);
    assert.equal(res.body.data.pickupCode.length, 6);
    const pickupCode = await PickupCode.findOne({ where: { orderId: order.id } });
    assert.ok(pickupCode);
    assert.equal(pickupCode.code, res.body.data.pickupCode);
  });

  test('4. 取件码取件', async () => {
    const order = await Order.findOne({ where: { userId: testUser.userId, status: ORDER_STATUS.DELIVERED } });
    assert.ok(order, '待取件订单不存在');
    const pickupCode = await PickupCode.findOne({ where: { orderId: order.id } });
    const res = await request(app)
      .post('/api/orders/pickup-by-code')
      .send({
        code: pickupCode.code,
        userId: testUser.userId,
      });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.code, 200);
    assert.equal(res.body.data.order.status, ORDER_STATUS.PICKED_UP);
    assert.equal(res.body.data.cell.status, CELL_STATUS.AVAILABLE);
    assert.equal(res.body.data.pickupCode.status, 'used');
    assert.equal(res.body.data.cell.currentOrderId, null);
  });

  test('5. 已取件订单不能重复取件', async () => {
    const order = await Order.findOne({ where: { userId: testUser.userId, status: ORDER_STATUS.PICKED_UP } });
    const res = await request(app)
      .post(`/api/orders/${order.id}/pickup`)
      .send({ userId: testUser.userId });
    assert.equal(res.statusCode, 500);
    assert.ok(res.body.message.includes('已取件'));
  });

  test('6. 错误的取件码应该记录异常', async () => {
    const res = await request(app)
      .post('/api/orders/pickup-by-code')
      .send({
        code: '000000',
        userId: testUser.userId,
      });
    assert.equal(res.statusCode, 500);
    assert.ok(res.body.message.includes('取件码无效'));
  });

  test('7. 取消订单（创建状态）', async () => {
    const orderRes = await request(app)
      .post('/api/orders')
      .send({
        userId: 'USER-CANCEL',
        userName: '取消测试',
        userPhone: '13900000000',
        laundryType: '测试',
      });
    const orderId = orderRes.body.data.id;
    const res = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .send({
        operatorId: 'OP-001',
        reason: '用户主动取消',
      });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.code, 200);
    assert.equal(res.body.data.status, ORDER_STATUS.CANCELLED);
  });

  test('8. 取消订单（已分配格口状态）', async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        userId: 'USER-CANCEL-2',
        userName: '取消测试2',
        userPhone: '13900000001',
        laundryType: '测试',
      });
    const orderId = createRes.body.data.id;
    await request(app)
      .post(`/api/orders/${orderId}/assign-cell`)
      .send({ cabinetId: cabinet.id });
    const cellBefore = await Cell.findOne({ where: { currentOrderId: orderId } });
    assert.ok(cellBefore);
    const res = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .send({
        operatorId: 'OP-001',
        reason: '用户主动取消',
      });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.status, ORDER_STATUS.CANCELLED);
    const cellAfter = await Cell.findByPk(cellBefore.id);
    assert.equal(cellAfter.status, CELL_STATUS.AVAILABLE);
    assert.equal(cellAfter.currentOrderId, null);
  });
});
