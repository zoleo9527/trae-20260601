const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const initTables = require('../database/schema');
const db = require('../database/db');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const exportsDir = path.join(__dirname, '..', '..', 'exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

initTables();

const seedData = () => {
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (userCount > 0) {
    console.log('数据已存在，跳过初始化');
    return;
  }

  const hashPwd = (pwd) => bcrypt.hashSync(pwd, 8);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password, name, role, department, phone, brand_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    { username: 'zhaoshang1', password: hashPwd('123456'), name: '张伟', role: 'ROLE_MERCHANDISE_MANAGER', department: '招商一部', phone: '13800138001', brand_id: null },
    { username: 'zhaoshang2', password: hashPwd('123456'), name: '李娜', role: 'ROLE_MERCHANDISE_MANAGER', department: '招商二部', phone: '13800138002', brand_id: null },
    { username: 'yingyun1', password: hashPwd('123456'), name: '王强', role: 'ROLE_OPERATION_SUPERVISOR', department: '营运部', phone: '13800138003', brand_id: null },
    { username: 'yingyun2', password: hashPwd('123456'), name: '陈芳', role: 'ROLE_OPERATION_SUPERVISOR', department: '营运部', phone: '13800138004', brand_id: null },
    { username: 'dianzhang1', password: hashPwd('123456'), name: '刘洋', role: 'ROLE_STORE_MANAGER', department: '门店-耐克', phone: '13800138005', brand_id: 1 },
    { username: 'dianzhang2', password: hashPwd('123456'), name: '赵敏', role: 'ROLE_STORE_MANAGER', department: '门店-阿迪达斯', phone: '13800138006', brand_id: 2 },
    { username: 'zhuguan', password: hashPwd('123456'), name: '孙总', role: 'ROLE_SUPERVISOR', department: '总经办', phone: '13800138000', brand_id: null },
  ];

  const insertMany = db.transaction((list) => {
    for (const u of list) insertUser.run(u.username, u.password, u.name, u.role, u.department, u.phone, u.brand_id);
  });
  insertMany(users);

  const insertBrand = db.prepare(`
    INSERT INTO brands (brand_code, brand_name, category) VALUES (?, ?, ?)
  `);
  const brands = [
    { code: 'NK001', name: '耐克 Nike', category: '运动服饰' },
    { code: 'AD001', name: '阿迪达斯 Adidas', category: '运动服饰' },
    { code: 'LV001', name: '路易威登 LV', category: '奢侈品' },
    { code: 'CO001', name: '蔻驰 Coach', category: '箱包配饰' },
    { code: 'UN001', name: '优衣库 Uniqlo', category: '休闲服饰' },
  ];
  for (const b of brands) insertBrand.run(b.code, b.name, b.category);

  console.log('初始化完成！测试账号:');
  console.log('  招商经理: zhaoshang1 / 123456 (张伟)');
  console.log('  营运督导: yingyun1 / 123456 (王强)');
  console.log('  品牌店长: dianzhang1 / 123456 (刘洋)');
  console.log('  主管    : zhuguan / 123456 (孙总)');
};

seedData();
