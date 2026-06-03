import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/server.js';
import { setupTestDatabase, teardownTestDatabase } from './setup.js';
import { Cabinet, Cell } from '../src/models/index.js';
import { sequelize } from '../src/models/index.js';

describe('基础功能测试', () => {
  before(async () => {
    await setupTestDatabase();
  });

  after(async () => {
    await teardownTestDatabase();
  });

  test('健康检查接口', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.code, 200);
    assert.equal(res.body.data.service, 'smart-laundry-cabinet');
  });

  test('获取柜机列表', async () => {
    const res = await request(app).get('/api/cabinets');
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.code, 200);
    assert.ok(res.body.data.total >= 3);
    assert.ok(Array.isArray(res.body.data.list));
  });

  test('创建柜机', async () => {
    const res = await request(app)
      .post('/api/cabinets')
      .send({
        cabinetNo: 'CAB-TEST-001',
        name: '测试柜机',
        location: '测试位置',
      });
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.code, 201);
    assert.equal(res.body.data.cabinetNo, 'CAB-TEST-001');
  });

  test('创建柜机缺少必填字段', async () => {
    const res = await request(app)
      .post('/api/cabinets')
      .send({ name: '测试柜机' });
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.message.includes('缺少必填字段'));
  });

  test('获取柜机详情', async () => {
    const cabinet = await Cabinet.findOne({ where: { cabinetNo: 'CAB-001' } });
    const res = await request(app).get(`/api/cabinets/${cabinet.id}`);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.code, 200);
    assert.equal(res.body.data.cabinetNo, 'CAB-001');
    assert.ok(Array.isArray(res.body.data.cells));
  });

  test('柜机心跳上报', async () => {
    const res = await request(app)
      .post('/api/cabinets/heartbeat')
      .send({
        cabinetNo: 'CAB-001',
        ipAddress: '10.0.0.1',
      });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.code, 200);
  });

  test('获取格口实时状态', async () => {
    const cabinet = await Cabinet.findOne({ where: { cabinetNo: 'CAB-001' } });
    const res = await request(app).get(`/api/cabinets/${cabinet.id}/status`);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.code, 200);
    assert.ok(res.body.data.statusSummary);
    assert.equal(res.body.data.statusSummary.total, 10);
  });

  test('柜机上传格口状态', async () => {
    const cabinet = await Cabinet.findOne({ where: { cabinetNo: 'CAB-001' } });
    const cells = await Cell.findAll({ where: { cabinetId: cabinet.id }, limit: 2 });
    const res = await request(app)
      .post('/api/cabinets/status/upload')
      .send({
        cabinetNo: 'CAB-001',
        cellStatuses: [
          { cellNo: cells[0].cellNo, lockStatus: false, doorStatus: false },
          { cellNo: cells[1].cellNo, lockStatus: true, doorStatus: true },
        ],
      });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.code, 200);
    assert.equal(res.body.data.results.length, 2);
    assert.ok(res.body.data.results.every(r => r.success));
  });

  test('更新格口状态', async () => {
    const cell = await Cell.findOne({ where: { status: 'available' } });
    const res = await request(app)
      .patch(`/api/cells/${cell.id}/status`)
      .send({ status: 'maintenance', remark: '测试维护' });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.code, 200);
    assert.equal(res.body.data.status, 'maintenance');
  });

  test('更新格口状态非法转换', async () => {
    const cell = await Cell.findOne({ where: { status: 'delivered' } });
    if (cell) {
      const res = await request(app)
        .patch(`/api/cells/${cell.id}/status`)
        .send({ status: 'occupied' });
      assert.equal(res.statusCode, 500);
      assert.ok(res.body.message.includes('无法从'));
    }
  });
});
