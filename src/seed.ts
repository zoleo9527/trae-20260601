import { initializeDatabase } from './database/index.js';
import { StaffRepository } from './repositories/index.js';
import { v4 as uuidv4 } from 'uuid';

initializeDatabase();

const staffRepo = new StaffRepository();

const staffMembers = [
  { name: '张伟', role: 'reservation_staff', phone: '13800138001' },
  { name: '李娜', role: 'reservation_staff', phone: '13800138002' },
  { name: '王强', role: 'bar_staff', phone: '13800138003' },
  { name: '陈静', role: 'bar_staff', phone: '13800138004' },
  { name: '刘经理', role: 'manager', phone: '13800138005' },
  { name: '赵经理', role: 'manager', phone: '13800138006' }
];

console.log('Seeding staff data...');
for (const staff of staffMembers) {
  try {
    staffRepo.create(staff as any);
    console.log(`Created staff: ${staff.name} (${staff.role})`);
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      console.log(`Staff already exists: ${staff.name}`);
    } else {
      console.error(`Error creating staff ${staff.name}:`, error);
    }
  }
}

console.log('Seed completed!');
