import request from 'supertest';
import app from '../src/index';
import { sequelize } from '../src/config/database';
import { Store, User, Tire } from '../src/models';
import Role from '../src/models/Role';
import bcrypt from 'bcryptjs';

describe('Warranty Claim API', () => {
  let token: string;
  let store: Store;
  let frontdesk: User;
  let tire: Tire;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    store = await Store.create({
      name: '测试门店',
      address: '测试地址',
      phone: '010-99999999',
    });

    const hashedPassword = await bcrypt.hash('123456', 10);

    frontdesk = await User.create({
      username: 'test_frontdesk',
      password: hashedPassword,
      realName: '测试前台',
      role: Role.FRONT_DESK,
      storeId: store.id,
      phone: '13800138999',
    });

    await User.create({
      username: 'test_technician',
      password: hashedPassword,
      realName: '测试技师',
      role: Role.TECHNICIAN,
      storeId: store.id,
      phone: '13800138888',
    });

    await User.create({
      username: 'test_manager',
      password: hashedPassword,
      realName: '测试店长',
      role: Role.STORE_MANAGER,
      storeId: store.id,
      phone: '13800138777',
    });

    const today = new Date();
    const twoYearsLater = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());

    tire = await Tire.create({
      brand: '测试品牌',
      model: '测试型号',
      size: '205/55R16',
      serialNumber: 'TEST20260001',
      productionDate: new Date(today.getFullYear() - 1, 0, 1),
      installationDate: new Date(today.getFullYear() - 1, 1, 1),
      vehiclePlate: '京TEST01',
      storeId: store.id,
      warrantyEndDate: twoYearsLater,
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test_frontdesk', password: '123456' });
    
    token = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/claims', () => {
    it('should create a new warranty claim', async () => {
      const response = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tireId: tire.id,
          customerName: '测试客户',
          customerPhone: '13900139000',
          issueDescription: '轮胎出现裂纹',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customerName).toBe('测试客户');
      expect(response.body.data.status).toBe('PENDING');
    });

    it('should reject creating claim for expired tire', async () => {
      const expiredTire = await Tire.create({
        brand: '过期品牌',
        model: '过期型号',
        size: '205/55R16',
        serialNumber: 'EXPIRED001',
        productionDate: new Date('2020-01-01'),
        installationDate: new Date('2020-02-01'),
        vehiclePlate: '京EXPIRED',
        storeId: store.id,
        warrantyEndDate: new Date('2022-02-01'),
      });

      const response = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tireId: expiredTire.id,
          customerName: '测试客户',
          customerPhone: '13900139000',
          issueDescription: '轮胎问题',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('轮胎已过质保期');
    });
  });

  describe('GET /api/claims', () => {
    it('should return paginated claims', async () => {
      const response = await request(app)
        .get('/api/claims')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/claims/dashboard', () => {
    it('should return dashboard data', async () => {
      const response = await request(app)
        .get('/api/claims/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pendingClaims).toBeDefined();
      expect(response.body.data.riskClaims).toBeDefined();
      expect(response.body.data.recentChanges).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
    });
  });

  describe('PUT /api/claims/:id', () => {
    it('should update a pending claim', async () => {
      const claimResponse = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tireId: tire.id,
          customerName: '原客户',
          customerPhone: '13900139000',
          issueDescription: '原描述',
        });

      const claimId = claimResponse.body.data.id;

      const updateResponse = await request(app)
        .put(`/api/claims/${claimId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerName: '更新客户',
          issueDescription: '更新描述',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.customerName).toBe('更新客户');
      expect(updateResponse.body.data.issueDescription).toBe('更新描述');
    });
  });

  describe('technician workflow', () => {
    it('should allow technician to assign and review claim', async () => {
      const techLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test_technician', password: '123456' });
      
      const techToken = techLogin.body.data.token;

      const claimResponse = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tireId: tire.id,
          customerName: '技师审核测试',
          customerPhone: '13900139000',
          issueDescription: '需要技师审核',
        });

      const claimId = claimResponse.body.data.id;

      const assignResponse = await request(app)
        .post(`/api/claims/${claimId}/assign-technician`)
        .set('Authorization', `Bearer ${techToken}`);

      expect(assignResponse.status).toBe(200);
      expect(assignResponse.body.success).toBe(true);
      expect(assignResponse.body.data.status).toBe('TECHNICIAN_REVIEW');

      const reviewResponse = await request(app)
        .post(`/api/claims/${claimId}/technician-review`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          comment: '经检测，符合质保条件',
          approve: true,
        });

      expect(reviewResponse.status).toBe(200);
      expect(reviewResponse.body.success).toBe(true);
      expect(reviewResponse.body.data.status).toBe('TECHNICIAN_APPROVED');
    });

    it('should reject technician review without assignment', async () => {
      const techLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test_technician', password: '123456' });
      
      const techToken = techLogin.body.data.token;

      const claimResponse = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tireId: tire.id,
          customerName: '未领取审核测试',
          customerPhone: '13900139000',
          issueDescription: '未领取直接审核',
        });

      const claimId = claimResponse.body.data.id;

      const reviewResponse = await request(app)
        .post(`/api/claims/${claimId}/technician-review`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          comment: '直接审核',
          approve: true,
        });

      expect(reviewResponse.status).toBe(400);
      expect(reviewResponse.body.success).toBe(false);
      expect(reviewResponse.body.error).toBe('请先领取技师审核任务');
    });
  });

  describe('manager workflow', () => {
    it('should allow manager to assign and review claim', async () => {
      const techLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test_technician', password: '123456' });
      const techToken = techLogin.body.data.token;

      const managerLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test_manager', password: '123456' });
      const managerToken = managerLogin.body.data.token;

      const claimResponse = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tireId: tire.id,
          customerName: '店长审核测试',
          customerPhone: '13900139000',
          issueDescription: '需要店长审核',
        });

      const claimId = claimResponse.body.data.id;

      await request(app)
        .post(`/api/claims/${claimId}/assign-technician`)
        .set('Authorization', `Bearer ${techToken}`);

      await request(app)
        .post(`/api/claims/${claimId}/technician-review`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          comment: '技师通过',
          approve: true,
        });

      const assignResponse = await request(app)
        .post(`/api/claims/${claimId}/assign-manager`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(assignResponse.status).toBe(200);
      expect(assignResponse.body.success).toBe(true);
      expect(assignResponse.body.data.status).toBe('MANAGER_REVIEW');

      const reviewResponse = await request(app)
        .post(`/api/claims/${claimId}/manager-review`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          comment: '店长批准',
          approve: true,
        });

      expect(reviewResponse.status).toBe(200);
      expect(reviewResponse.body.success).toBe(true);
      expect(reviewResponse.body.data.status).toBe('APPROVED');
    });

    it('should reject manager review without assignment', async () => {
      const techLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test_technician', password: '123456' });
      const techToken = techLogin.body.data.token;

      const managerLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test_manager', password: '123456' });
      const managerToken = managerLogin.body.data.token;

      const claimResponse = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tireId: tire.id,
          customerName: '未领取店长审核测试',
          customerPhone: '13900139000',
          issueDescription: '未领取直接店长审核',
        });

      const claimId = claimResponse.body.data.id;

      await request(app)
        .post(`/api/claims/${claimId}/assign-technician`)
        .set('Authorization', `Bearer ${techToken}`);

      await request(app)
        .post(`/api/claims/${claimId}/technician-review`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          comment: '技师通过',
          approve: true,
        });

      const reviewResponse = await request(app)
        .post(`/api/claims/${claimId}/manager-review`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          comment: '未领取直接审核',
          approve: true,
        });

      expect(reviewResponse.status).toBe(400);
      expect(reviewResponse.body.success).toBe(false);
      expect(reviewResponse.body.error).toBe('请先领取店长审核任务');
    });
  });
});