import { initDatabase } from './src/config/database.js';
import { sequelize, Cabinet } from './src/models/index.js';

async function test() {
  try {
    await initDatabase();
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    
    const cabinet = await Cabinet.create({
      cabinetNo: 'TEST-001',
      name: '测试柜',
      location: '测试位置',
      status: 'online',
    });
    console.log('cabinet.toJSON():', cabinet.toJSON());
    console.log('cabinet.id:', cabinet.id);
    console.log('cabinet.dataValues.id:', cabinet.dataValues.id);
    console.log('typeof cabinet.id:', typeof cabinet.id);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

test();
