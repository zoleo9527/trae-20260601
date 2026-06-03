import { initDatabase } from './src/config/database.js';
import { sequelize } from './src/models/index.js';
import PickupCode from './src/models/PickupCode.js';
import { PICKUP_CODE_STATUS } from './src/utils/constants.js';

async function test() {
  await initDatabase();
  await sequelize.authenticate();
  await sequelize.sync({ force: true });

  await PickupCode.create({
    orderId: 1, cellId: 1, cabinetId: 1,
    code: '123456', status: PICKUP_CODE_STATUS.ACTIVE,
    expiredAt: new Date(Date.now() + 86400000),
  });

  try {
    const count = await PickupCode.count({ where: { orderId: 1 } });
    console.log('count result:', count);
  } catch (e) {
    console.error('count error:', e.message);
  }

  try {
    const all = await PickupCode.findAll({ where: { orderId: 1 } });
    console.log('findAll result length:', all.length);
  } catch (e) {
    console.error('findAll error:', e.message);
  }

  process.exit(0);
}

test();
