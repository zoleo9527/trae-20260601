import { sequelize } from '../src/models/index.js';
import { seed } from '../src/seeders/index.js';

export async function setupTestDatabase() {
  process.env.NODE_ENV = 'test';
  await sequelize.authenticate();
  await seed();
}

export async function teardownTestDatabase() {
  await sequelize.close();
}

export function createTestUser(id = 'USER-TEST') {
  return {
    userId: id,
    userName: '测试用户',
    userPhone: '13800000000',
  };
}

export function createTestDeliveryStaff(id = 'DS-TEST') {
  return {
    deliveryStaffId: id,
    deliveryStaffName: '测试配送员',
  };
}

export function createTestCustomerService(id = 'CS-TEST') {
  return {
    operatorId: id,
    operatorName: '测试客服',
  };
}
