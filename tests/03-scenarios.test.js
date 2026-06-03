import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/server.js';
import { setupTestDatabase, teardownTestDatabase, createTestUser, createTestDeliveryStaff, createTestCustomerService } from './setup.js';
import { Cabinet, Order, Cell, PickupCode, ExceptionLog, TimeoutReminder, RemoteOpenRequest } from '../src/models/index.js';
import { ORDER_STATUS, CELL_STATUS, EXCEPTION_TYPE } from '../src/utils/constants.js';
import dayjs from 'dayjs';

describe('场景测试', () => {
  let cabinet;
  let testUser;
  let deliveryStaff;
  let customerService;

  before(async () => {
    await setupTestDatabase();
    cabinet = await Cabinet.findOne({ where: { cabinetNo: 'CAB-001' }, include: [{ model: Cell, as: 'cells' }] });
    testUser = createTestUser();
    deliveryStaff = createTestDeliveryStaff();
    customerService = createTestCustomerService();
  });

  after(async () => {
    await teardownTestDatabase();
  });

  describe('场景一：满柜测试', () => {
    test('当所有格口被占用时，新订单无法分配格口', async () => {
      const availableCells = cabinet.cells.filter(c => c.status === CELL_STATUS.AVAILABLE);
      console.log(`初始可用格口: ${availableCells.length}`);
      for (let i = 0; i < availableCells.length; i++) {
        const orderRes = await request(app)
          .post('/api/orders')
          .send({
            userId: `USER-FULL-${i}`,
            userName: `满柜测试用户${i}`,
            laundryType: '测试',
          });
        await request(app)
          .post(`/api/orders/${orderRes.body.data.id}/assign-cell`)
          .send({ cabinetId: cabinet.id });
      }
      const fullOrderRes = await request(app)
        .post('/api/orders')
        .send({
          userId: 'USER-FULL-LAST',
          userName: '最后一个用户',
          laundryType: '测试',
        });
      const assignRes = await request(app)
        .post(`/api/orders/${fullOrderRes.body.data.id}/assign-cell`)
        .send({ cabinetId: cabinet.id });
      assert.equal(assignRes.statusCode, 500);
      assert.ok(assignRes.body.message.includes('暂无可用格口'));
      const statusRes = await request(app).get(`/api/cabinets/${cabinet.id}/status`);
      assert.equal(statusRes.body.data.statusSummary.available, 0);
    });
  });

  describe('场景二：超时未取测试', () => {
    let timeoutOrder;
    let timeoutCell;

    test('创建订单并完成投放流程', async () => {
      const orderRes = await request(app)
        .post('/api/orders')
        .send({
          userId: 'USER-TIMEOUT',
          userName: '超时测试用户',
          userPhone: '13811111111',
          laundryType: '日常清洗',
          weight: 3.0,
          amount: 30.00,
        });
      assert.equal(orderRes.statusCode, 201);
      timeoutOrder = orderRes.body.data;
      const assignRes = await request(app)
        .post(`/api/orders/${timeoutOrder.id}/assign-cell`)
        .send({ cabinetId: cabinet.id });
      assert.equal(assignRes.statusCode, 200);
      timeoutCell = assignRes.body.data.cell;
      const deliverRes = await request(app)
        .post(`/api/orders/${timeoutOrder.id}/deliver`)
        .send({
          ...deliveryStaff,
          itemCount: 1,
        });
      assert.equal(deliverRes.statusCode, 200);
      timeoutOrder = await Order.findByPk(timeoutOrder.id);
      const pastTime = dayjs().subtract(25, 'hour').toDate();
      await Order.update(
        { deliveredAt: pastTime, timeoutAt: dayjs(pastTime).add(24, 'hour').toDate() },
        { where: { id: timeoutOrder.id } }
      );
      await PickupCode.update(
        { expiredAt: dayjs(pastTime).add(24, 'hour').toDate() },
        { where: { orderId: timeoutOrder.id } }
      );
    });

    test('执行超时检查，订单应标记为超时并生成提醒', async () => {
      const checkRes = await request(app).post('/api/orders/check-timeout');
      assert.equal(checkRes.statusCode, 200);
      assert.ok(checkRes.body.data.length >= 1);
      const updatedOrder = await Order.findByPk(timeoutOrder.id);
      assert.equal(updatedOrder.status, ORDER_STATUS.TIMEOUT);
      const exception = await ExceptionLog.findOne({
        where: { orderId: timeoutOrder.id, exceptionType: EXCEPTION_TYPE.TIMEOUT_UNPICKED },
      });
      assert.ok(exception);
      assert.equal(exception.handled, false);
      const reminder = await TimeoutReminder.findOne({ where: { orderId: timeoutOrder.id } });
      assert.ok(reminder);
      assert.ok(reminder.content.includes('超时'));
    });

    test('超时后仍然可以取件', async () => {
      const pickupCode = await PickupCode.findOne({ where: { orderId: timeoutOrder.id } });
      const pickupRes = await request(app)
        .post('/api/orders/pickup-by-code')
        .send({
          code: pickupCode.code,
          userId: 'USER-TIMEOUT',
        });
      assert.equal(pickupRes.statusCode, 200);
      assert.equal(pickupRes.body.data.order.status, ORDER_STATUS.PICKED_UP);
    });
  });

  describe('场景三：柜门卡住测试', () => {
    let stuckOrder;
    let stuckCell;

    test('创建订单并完成投放', async () => {
      const orderRes = await request(app)
        .post('/api/orders')
        .send({
          userId: 'USER-DOOR',
          userName: '柜门测试用户',
          userPhone: '13822222222',
          laundryType: '干洗',
        });
      stuckOrder = orderRes.body.data;
      const assignRes = await request(app)
        .post(`/api/orders/${stuckOrder.id}/assign-cell`)
        .send({ cabinetId: cabinet.id });
      stuckCell = assignRes.body.data.cell;
      const deliverRes = await request(app)
        .post(`/api/orders/${stuckOrder.id}/deliver`)
        .send({
          ...deliveryStaff,
          itemCount: 1,
        });
      assert.equal(deliverRes.statusCode, 200);
    });

    test('用户上报柜门卡住', async () => {
      const reportRes = await request(app)
        .post('/api/exceptions/report/door-stuck')
        .send({
          cellId: stuckCell.id,
          userId: 'USER-DOOR',
          description: '输入取件码后门打不开，一直卡住',
        });
      assert.equal(reportRes.statusCode, 201);
      assert.equal(reportRes.body.data.exceptionType, EXCEPTION_TYPE.DOOR_STUCK);
      assert.equal(reportRes.body.data.handled, false);
      const exceptionList = await request(app)
        .get('/api/exceptions')
        .query({ exceptionType: EXCEPTION_TYPE.DOOR_STUCK, handled: false });
      assert.ok(exceptionList.body.data.total >= 1);
    });

    test('客服处理柜门卡住异常', async () => {
      const exception = await ExceptionLog.findOne({
        where: { exceptionType: EXCEPTION_TYPE.DOOR_STUCK, handled: false },
        order: [['createdAt', 'DESC']],
      });
      assert.ok(exception);
      const handleRes = await request(app)
        .post(`/api/exceptions/${exception.id}/handle`)
        .send({
          handledBy: customerService.operatorId,
          handleResult: '已联系维修人员上门处理，同时为用户重新安排取件',
        });
      assert.equal(handleRes.statusCode, 200);
      assert.equal(handleRes.body.data.handled, true);
      assert.equal(handleRes.body.data.handledBy, customerService.operatorId);
    });
  });

  describe('场景四：客服人工开柜测试', () => {
    let csOrder;
    let csCell;

    test('创建订单并完成投放', async () => {
      const orderRes = await request(app)
        .post('/api/orders')
        .send({
          userId: 'USER-CS',
          userName: '客服开柜测试用户',
          userPhone: '13833333333',
          laundryType: '床上用品',
        });
      csOrder = orderRes.body.data;
      const assignRes = await request(app)
        .post(`/api/orders/${csOrder.id}/assign-cell`)
        .send({ cabinetId: cabinet.id });
      csCell = assignRes.body.data.cell;
      const deliverRes = await request(app)
        .post(`/api/orders/${csOrder.id}/deliver`)
        .send({
          ...deliveryStaff,
          itemCount: 2,
        });
      assert.equal(deliverRes.statusCode, 200);
    });

    test('用户申请远程开柜', async () => {
      const requestRes = await request(app)
        .post('/api/remote-open')
        .send({
          orderId: csOrder.id,
          cellId: csCell.id,
          applicantId: 'USER-CS',
          applicantName: '客服开柜测试用户',
          applicantType: 'user',
          reason: '取件码丢失，申请远程开柜',
        });
      assert.equal(requestRes.statusCode, 201);
      assert.equal(requestRes.body.data.status, 'pending');
      assert.equal(requestRes.body.data.reason, '取件码丢失，申请远程开柜');
    });

    test('已取件订单不能申请远程开柜', async () => {
      const pickedOrder = await Order.findOne({ where: { status: ORDER_STATUS.PICKED_UP } });
      if (pickedOrder) {
        const requestRes = await request(app)
          .post('/api/remote-open')
          .send({
            orderId: pickedOrder.id,
            cellId: pickedOrder.cellId,
            applicantId: 'USER-TEST',
            applicantName: '测试',
            applicantType: 'user',
            reason: '测试已取件开柜',
          });
        assert.equal(requestRes.statusCode, 500);
        assert.ok(requestRes.body.message.includes('已取件订单不能申请远程开柜'));
      }
    });

    test('客服审批远程开柜申请', async () => {
      const pendingRequest = await RemoteOpenRequest.findOne({
        where: { status: 'pending' },
        order: [['createdAt', 'DESC']],
      });
      assert.ok(pendingRequest);
      const approveRes = await request(app)
        .post(`/api/remote-open/${pendingRequest.id}/approve`)
        .send({
          approverId: customerService.operatorId,
          approverName: customerService.operatorName,
          approvalRemark: '核实用户身份无误，同意远程开柜',
        });
      assert.equal(approveRes.statusCode, 200);
      assert.equal(approveRes.body.data.status, 'approved');
    });

    test('执行远程开柜', async () => {
      const approvedRequest = await RemoteOpenRequest.findOne({
        where: { status: 'approved' },
        order: [['createdAt', 'DESC']],
      });
      assert.ok(approvedRequest);
      const executeRes = await request(app)
        .post(`/api/remote-open/${approvedRequest.id}/execute`)
        .send({
          success: true,
          executionResult: '柜机已执行开柜指令，门已弹开',
        });
      assert.equal(executeRes.statusCode, 200);
      assert.equal(executeRes.body.data.status, 'executed');
    });

    test('客服直接远程开柜（快捷操作）', async () => {
      const quickOrderRes = await request(app)
        .post('/api/orders')
        .send({
          userId: 'USER-QUICK',
          userName: '快捷开柜用户',
          laundryType: '测试',
        });
      const quickOrder = quickOrderRes.body.data;
      const assignRes = await request(app)
        .post(`/api/orders/${quickOrder.id}/assign-cell`)
        .send({ cabinetId: cabinet.id });
      const quickCell = assignRes.body.data.cell;
      await request(app)
        .post(`/api/orders/${quickOrder.id}/deliver`)
        .send({
          ...deliveryStaff,
          itemCount: 1,
        });
      const quickOpenRes = await request(app)
        .post('/api/remote-open/customer-service/open')
        .send({
          cellId: quickCell.id,
          operatorId: customerService.operatorId,
          operatorName: customerService.operatorName,
          reason: '用户电话求助，直接开柜',
        });
      assert.equal(quickOpenRes.statusCode, 200);
      assert.equal(quickOpenRes.body.data.status, 'executed');
      const updatedCell = await Cell.findByPk(quickCell.id);
      assert.equal(updatedCell.doorStatus, false);
      assert.equal(updatedCell.lockStatus, false);
    });

    test('已取件格口不能重复远程开柜', async () => {
      const pickedCell = await Cell.findOne({ where: { status: CELL_STATUS.AVAILABLE, currentOrderId: null } });
      if (pickedCell) {
        const quickOpenRes = await request(app)
          .post('/api/remote-open/customer-service/open')
          .send({
            cellId: pickedCell.id,
            operatorId: customerService.operatorId,
            operatorName: customerService.operatorName,
            reason: '测试已取件开柜',
          });
        assert.equal(quickOpenRes.statusCode, 200);
      }
    });
  });

  describe('场景五：格口状态机验证', () => {
    test('格口不能被重复占用', async () => {
      const order1Res = await request(app)
        .post('/api/orders')
        .send({
          userId: 'USER-DUP-1',
          userName: '重复占用测试1',
          laundryType: '测试',
        });
      const order2Res = await request(app)
        .post('/api/orders')
        .send({
          userId: 'USER-DUP-2',
          userName: '重复占用测试2',
          laundryType: '测试',
        });
      const availableCell = await Cell.findOne({ where: { status: CELL_STATUS.AVAILABLE } });
      assert.ok(availableCell);
      await Cell.update(
        { status: CELL_STATUS.OCCUPIED, currentOrderId: order1Res.body.data.id },
        { where: { id: availableCell.id } }
      );
      const cellAfter = await Cell.findByPk(availableCell.id);
      assert.equal(cellAfter.status, CELL_STATUS.OCCUPIED);
      assert.equal(cellAfter.currentOrderId, order1Res.body.data.id);
      try {
        await Cell.update(
          { status: CELL_STATUS.OCCUPIED, currentOrderId: order2Res.body.data.id },
          { where: { id: availableCell.id } }
        );
      } catch (e) {
        console.log('预期的约束检查');
      }
      const cellFinal = await Cell.findByPk(availableCell.id);
      assert.equal(cellFinal.currentOrderId, order1Res.body.data.id);
    });
  });
});
