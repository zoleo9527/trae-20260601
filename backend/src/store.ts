import { v4 as uuidv4 } from 'uuid';
import { 
  Customer, 
  Formula, 
  CustomerOrder, 
  LoadingRecord, 
  ExceptionRecord,
  FeedBatch,
  FeedingRecord,
  OperationLog
} from './types';

class DataStore {
  private customers: Map<string, Customer> = new Map();
  private formulas: Map<string, Formula> = new Map();
  private orders: Map<string, CustomerOrder> = new Map();
  private batches: Map<string, FeedBatch> = new Map();
  private feedingRecords: Map<string, FeedingRecord> = new Map();
  private loadingRecords: Map<string, LoadingRecord> = new Map();
  private exceptions: Map<string, ExceptionRecord> = new Map();
  private operationLogs: OperationLog[] = [];

  constructor() {
    this.initMockData();
  }

  private initMockData() {
    const now = new Date().toISOString();

    const mockCustomers: Customer[] = [
      {
        customerId: 'C001',
        customerName: '兴旺养殖场',
        contact: '刘老板',
        phone: '13800138001',
        address: '山东省济南市章丘区畜牧产业园',
        type: 'FARM',
        scale: '大型',
        breedingType: '肉猪',
        createdAt: now
      },
      {
        customerId: 'C002',
        customerName: '富民饲料经销',
        contact: '张经理',
        phone: '13800138002',
        address: '河南省郑州市饲料批发市场',
        type: 'DEALER',
        scale: '中型',
        breedingType: '综合',
        createdAt: now
      },
      {
        customerId: 'C003',
        customerName: '红星养鸡场',
        contact: '王厂长',
        phone: '13800138003',
        address: '河北省石家庄市正定县',
        type: 'FARM',
        scale: '中型',
        breedingType: '蛋鸡',
        createdAt: now
      },
      {
        customerId: 'C004',
        customerName: '恒丰养殖集团',
        contact: '赵总',
        phone: '13800138004',
        address: '安徽省合肥市高新区',
        type: 'FARM',
        scale: '大型',
        breedingType: '肉牛',
        createdAt: now
      }
    ];

    mockCustomers.forEach(customer => this.customers.set(customer.customerId, customer));

    const mockFormulas: Formula[] = [
      {
        formulaId: 'F001',
        formulaName: '猪用育肥期配合饲料',
        targetAnimal: '猪',
        stage: '育肥期',
        ingredients: [
          { ingredientId: 'I001', ingredientName: '玉米', ratio: 60, unit: '%' },
          { ingredientId: 'I002', ingredientName: '豆粕', ratio: 20, unit: '%' },
          { ingredientId: 'I003', ingredientName: '麸皮', ratio: 10, unit: '%' },
          { ingredientId: 'I004', ingredientName: '预混料', ratio: 5, unit: '%' },
          { ingredientId: 'I005', ingredientName: '赖氨酸', ratio: 2, unit: '%' },
          { ingredientId: 'I006', ingredientName: '蛋氨酸', ratio: 1.5, unit: '%' },
          { ingredientId: 'I007', ingredientName: '食盐', ratio: 0.5, unit: '%' },
          { ingredientId: 'I008', ingredientName: '磷酸氢钙', ratio: 1, unit: '%' }
        ],
        totalRatio: 100,
        createdAt: now,
        updatedAt: now
      },
      {
        formulaId: 'F002',
        formulaName: '蛋鸡产蛋期配合饲料',
        targetAnimal: '蛋鸡',
        stage: '产蛋期',
        ingredients: [
          { ingredientId: 'I001', ingredientName: '玉米', ratio: 55, unit: '%' },
          { ingredientId: 'I002', ingredientName: '豆粕', ratio: 22, unit: '%' },
          { ingredientId: 'I009', ingredientName: '石粉', ratio: 8, unit: '%' },
          { ingredientId: 'I004', ingredientName: '预混料', ratio: 5, unit: '%' },
          { ingredientId: 'I010', ingredientName: '蛋氨酸', ratio: 0.8, unit: '%' },
          { ingredientId: 'I011', ingredientName: '赖氨酸', ratio: 0.7, unit: '%' },
          { ingredientId: 'I007', ingredientName: '食盐', ratio: 0.3, unit: '%' },
          { ingredientId: 'I012', ingredientName: '磷酸氢钙', ratio: 1.2, unit: '%' },
          { ingredientId: 'I013', ingredientName: '油脂', ratio: 7, unit: '%' }
        ],
        totalRatio: 100,
        createdAt: now,
        updatedAt: now
      },
      {
        formulaId: 'F003',
        formulaName: '肉牛育肥期精料补充料',
        targetAnimal: '牛',
        stage: '育肥期',
        ingredients: [
          { ingredientId: 'I001', ingredientName: '玉米', ratio: 50, unit: '%' },
          { ingredientId: 'I002', ingredientName: '豆粕', ratio: 15, unit: '%' },
          { ingredientId: 'I003', ingredientName: '麸皮', ratio: 18, unit: '%' },
          { ingredientId: 'I014', ingredientName: '棉籽粕', ratio: 8, unit: '%' },
          { ingredientId: 'I004', ingredientName: '预混料', ratio: 4, unit: '%' },
          { ingredientId: 'I015', ingredientName: '尿素', ratio: 2, unit: '%' },
          { ingredientId: 'I007', ingredientName: '食盐', ratio: 0.5, unit: '%' },
          { ingredientId: 'I012', ingredientName: '磷酸氢钙', ratio: 1.5, unit: '%' },
          { ingredientId: 'I016', ingredientName: '小苏打', ratio: 1, unit: '%' }
        ],
        totalRatio: 100,
        createdAt: now,
        updatedAt: now
      },
      {
        formulaId: 'F004',
        formulaName: '仔猪保育期配合饲料',
        targetAnimal: '猪',
        stage: '保育期',
        ingredients: [
          { ingredientId: 'I001', ingredientName: '玉米', ratio: 52, unit: '%' },
          { ingredientId: 'I002', ingredientName: '豆粕', ratio: 25, unit: '%' },
          { ingredientId: 'I017', ingredientName: '鱼粉', ratio: 5, unit: '%' },
          { ingredientId: 'I018', ingredientName: '乳清粉', ratio: 8, unit: '%' },
          { ingredientId: 'I004', ingredientName: '预混料', ratio: 5, unit: '%' },
          { ingredientId: 'I010', ingredientName: '蛋氨酸', ratio: 0.8, unit: '%' },
          { ingredientId: 'I011', ingredientName: '赖氨酸', ratio: 1.2, unit: '%' },
          { ingredientId: 'I007', ingredientName: '食盐', ratio: 0.3, unit: '%' },
          { ingredientId: 'I012', ingredientName: '磷酸氢钙', ratio: 1.2, unit: '%' },
          { ingredientId: 'I019', ingredientName: '酸化剂', ratio: 1.5, unit: '%' }
        ],
        totalRatio: 100,
        createdAt: now,
        updatedAt: now
      }
    ];

    mockFormulas.forEach(formula => this.formulas.set(formula.formulaId, formula));

    const mockBatches: FeedBatch[] = [
      {
        batchId: 'B001',
        formulaId: 'F001',
        formulaName: '猪用育肥期配合饲料',
        quantity: 5000,
        unit: 'kg',
        productionDate: '2026-06-08',
        expiryDate: '2026-12-08',
        status: 'STORED'
      },
      {
        batchId: 'B002',
        formulaId: 'F001',
        formulaName: '猪用育肥期配合饲料',
        quantity: 3000,
        unit: 'kg',
        productionDate: '2026-06-09',
        expiryDate: '2026-12-09',
        status: 'STORED'
      },
      {
        batchId: 'B003',
        formulaId: 'F002',
        formulaName: '蛋鸡产蛋期配合饲料',
        quantity: 4000,
        unit: 'kg',
        productionDate: '2026-06-07',
        expiryDate: '2026-12-07',
        status: 'STORED'
      },
      {
        batchId: 'B004',
        formulaId: 'F003',
        formulaName: '肉牛育肥期精料补充料',
        quantity: 2000,
        unit: 'kg',
        productionDate: '2026-06-08',
        expiryDate: '2026-12-08',
        status: 'STORED'
      },
      {
        batchId: 'B005',
        formulaId: 'F004',
        formulaName: '仔猪保育期配合饲料',
        quantity: 3500,
        unit: 'kg',
        productionDate: '2026-06-09',
        expiryDate: '2026-12-09',
        status: 'STORED'
      },
      {
        batchId: 'B006',
        formulaId: 'F001',
        formulaName: '猪用育肥期配合饲料',
        quantity: 2000,
        unit: 'kg',
        productionDate: '2026-06-10',
        expiryDate: '2026-12-10',
        status: 'PRODUCED'
      }
    ];

    mockBatches.forEach(batch => this.batches.set(batch.batchId, batch));

    const mockOrders: CustomerOrder[] = [
      {
        orderId: 'O001',
        orderNo: 'ORD-20260610-001',
        customerId: 'C001',
        customerName: '兴旺养殖场',
        items: [
          {
            itemId: 'OI001',
            formulaId: 'F001',
            formulaName: '猪用育肥期配合饲料',
            quantity: 4000,
            unit: 'kg',
            price: 2.8,
            totalAmount: 11200,
            batches: [mockBatches[0], mockBatches[1]]
          },
          {
            itemId: 'OI002',
            formulaId: 'F004',
            formulaName: '仔猪保育期配合饲料',
            quantity: 1500,
            unit: 'kg',
            price: 3.5,
            totalAmount: 5250,
            batches: [mockBatches[4]]
          }
        ],
        totalAmount: 16450,
        status: 'READY',
        createdAt: '2026-06-08T10:30:00.000Z',
        confirmedAt: '2026-06-08T11:00:00.000Z',
        createdBy: '仓库管理员',
        confirmedBy: '管理人员',
        deliveryAddress: '山东省济南市章丘区畜牧产业园兴旺养殖场',
        remarks: '急需，望尽快发货'
      },
      {
        orderId: 'O002',
        orderNo: 'ORD-20260610-002',
        customerId: 'C002',
        customerName: '富民饲料经销',
        items: [
          {
            itemId: 'OI003',
            formulaId: 'F002',
            formulaName: '蛋鸡产蛋期配合饲料',
            quantity: 3000,
            unit: 'kg',
            price: 3.2,
            totalAmount: 9600,
            batches: [mockBatches[2]]
          }
        ],
        totalAmount: 9600,
        status: 'CONFIRMED',
        createdAt: '2026-06-09T14:00:00.000Z',
        confirmedAt: '2026-06-09T15:30:00.000Z',
        createdBy: '仓库管理员',
        confirmedBy: '管理人员',
        deliveryAddress: '河南省郑州市饲料批发市场A区18号',
        remarks: '常规订单'
      },
      {
        orderId: 'O003',
        orderNo: 'ORD-20260610-003',
        customerId: 'C003',
        customerName: '红星养鸡场',
        items: [
          {
            itemId: 'OI004',
            formulaId: 'F002',
            formulaName: '蛋鸡产蛋期配合饲料',
            quantity: 2000,
            unit: 'kg',
            price: 3.2,
            totalAmount: 6400,
            batches: []
          }
        ],
        totalAmount: 6400,
        status: 'PRODUCING',
        createdAt: '2026-06-09T16:00:00.000Z',
        confirmedAt: '2026-06-09T16:30:00.000Z',
        createdBy: '仓库管理员',
        confirmedBy: '管理人员',
        deliveryAddress: '河北省石家庄市正定县红星养鸡场',
        remarks: ''
      },
      {
        orderId: 'O004',
        orderNo: 'ORD-20260610-004',
        customerId: 'C004',
        customerName: '恒丰养殖集团',
        items: [
          {
            itemId: 'OI005',
            formulaId: 'F003',
            formulaName: '肉牛育肥期精料补充料',
            quantity: 5000,
            unit: 'kg',
            price: 3.0,
            totalAmount: 15000,
            batches: [mockBatches[3]]
          }
        ],
        totalAmount: 15000,
        status: 'LOADED',
        createdAt: '2026-06-07T09:00:00.000Z',
        confirmedAt: '2026-06-07T09:30:00.000Z',
        loadingAt: '2026-06-08T14:00:00.000Z',
        createdBy: '仓库管理员',
        confirmedBy: '管理人员',
        loadedBy: '质检员',
        deliveryAddress: '安徽省合肥市高新区恒丰养殖集团',
        vehicleNo: '皖A-12345',
        driverName: '李师傅',
        driverPhone: '13900139001',
        remarks: '大客户订单，优先处理'
      }
    ];

    mockOrders.forEach(order => this.orders.set(order.orderId, order));

    const mockLoadingRecords: LoadingRecord[] = [
      {
        loadingId: 'L001',
        orderId: 'O004',
        orderNo: 'ORD-20260610-004',
        customerId: 'C004',
        customerName: '恒丰养殖集团',
        items: [
          {
            itemId: 'OI005',
            formulaName: '肉牛育肥期精料补充料',
            batchId: 'B004',
            batchNo: 'B004-20260608',
            quantity: 5000,
            unit: 'kg',
            checked: true
          }
        ],
        vehicleNo: '皖A-12345',
        driverName: '李师傅',
        driverPhone: '13900139001',
        loadingTime: '2026-06-08T14:00:00.000Z',
        checker: '质检员',
        status: 'PASSED',
        remarks: '复核通过，可以发货',
        discrepancies: []
      }
    ];

    mockLoadingRecords.forEach(record => this.loadingRecords.set(record.loadingId, record));

    const mockExceptions: ExceptionRecord[] = [
      {
        exceptionId: 'E001',
        orderId: 'O001',
        batchId: 'B001',
        customerId: 'C001',
        type: 'FORMULA_DEVIATION',
        title: '投料偏差异常',
        description: 'B001批次生产时，玉米投料量偏差超过5%，实际投入63%，配方要求60%',
        severity: 'HIGH',
        status: 'RESOLVED',
        reportedBy: '质检员',
        reportedAt: '2026-06-08T16:00:00.000Z',
        handledBy: '管理人员',
        handledAt: '2026-06-08T17:30:00.000Z',
        resolution: '已通知生产部门调整投料参数，后续批次已恢复正常。该批次已单独隔离检验，指标合格后放行',
        relatedOrders: ['O001'],
        relatedBatches: ['B001']
      },
      {
        exceptionId: 'E002',
        customerId: 'C003',
        type: 'WEIGHT_GAIN_COMPLAINT',
        title: '客户投诉增重慢',
        description: '红星养鸡场反馈使用我厂蛋鸡饲料后，蛋鸡增重速度较预期慢10-15%，影响产蛋率',
        severity: 'HIGH',
        status: 'PROCESSING',
        reportedBy: '销售部',
        reportedAt: '2026-06-09T10:00:00.000Z',
        relatedOrders: ['O003'],
        relatedBatches: ['B003']
      },
      {
        exceptionId: 'E003',
        batchId: 'B002',
        type: 'BATCH_LABEL_ERROR',
        title: '批次标签错误',
        description: 'B002批次包装袋标签打印错误，生产日期显示为2026-06-08，实际生产为2026-06-09',
        severity: 'MEDIUM',
        status: 'REPORTED',
        reportedBy: '仓库管理员',
        reportedAt: '2026-06-10T09:00:00.000Z',
        relatedBatches: ['B002']
      }
    ];

    mockExceptions.forEach(exception => this.exceptions.set(exception.exceptionId, exception));

    const mockFeedingRecords: FeedingRecord[] = [
      {
        recordId: 'FR001',
        orderId: 'O001',
        batchId: 'B001',
        formulaId: 'F001',
        actualIngredients: [
          { ingredientId: 'I001', ingredientName: '玉米', plannedAmount: 600, actualAmount: 630, deviation: 5, unit: 'kg' },
          { ingredientId: 'I002', ingredientName: '豆粕', plannedAmount: 200, actualAmount: 198, deviation: -1, unit: 'kg' },
          { ingredientId: 'I003', ingredientName: '麸皮', plannedAmount: 100, actualAmount: 102, deviation: 2, unit: 'kg' },
          { ingredientId: 'I004', ingredientName: '预混料', plannedAmount: 50, actualAmount: 50, deviation: 0, unit: 'kg' },
          { ingredientId: 'I005', ingredientName: '赖氨酸', plannedAmount: 20, actualAmount: 20, deviation: 0, unit: 'kg' },
          { ingredientId: 'I006', ingredientName: '蛋氨酸', plannedAmount: 15, actualAmount: 14.5, deviation: -3.3, unit: 'kg' },
          { ingredientId: 'I007', ingredientName: '食盐', plannedAmount: 5, actualAmount: 5, deviation: 0, unit: 'kg' },
          { ingredientId: 'I008', ingredientName: '磷酸氢钙', plannedAmount: 10, actualAmount: 10.5, deviation: 5, unit: 'kg' }
        ],
        operator: '操作工小王',
        operatedAt: '2026-06-08T08:00:00.000Z',
        remarks: '正常投料'
      }
    ];

    mockFeedingRecords.forEach(record => this.feedingRecords.set(record.recordId, record));
  }

  getAllCustomers(): Customer[] {
    return Array.from(this.customers.values());
  }

  getCustomerById(customerId: string): Customer | undefined {
    return this.customers.get(customerId);
  }

  getAllFormulas(): Formula[] {
    return Array.from(this.formulas.values());
  }

  getFormulaById(formulaId: string): Formula | undefined {
    return this.formulas.get(formulaId);
  }

  getAllOrders(): CustomerOrder[] {
    return Array.from(this.orders.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getOrderById(orderId: string): CustomerOrder | undefined {
    return this.orders.get(orderId);
  }

  getOrdersByStatus(status?: string): CustomerOrder[] {
    if (status) {
      return this.getAllOrders().filter(o => o.status === status);
    }
    return this.getAllOrders();
  }

  addOrder(order: CustomerOrder): void {
    this.orders.set(order.orderId, order);
  }

  updateOrder(orderId: string, updates: Partial<CustomerOrder>): CustomerOrder | undefined {
    const order = this.orders.get(orderId);
    if (order) {
      const updated = { ...order, ...updates, updatedAt: new Date().toISOString() };
      this.orders.set(orderId, updated);
      return updated;
    }
    return undefined;
  }

  getAllBatches(): FeedBatch[] {
    return Array.from(this.batches.values());
  }

  getBatchById(batchId: string): FeedBatch | undefined {
    return this.batches.get(batchId);
  }

  getBatchesByFormula(formulaId: string): FeedBatch[] {
    return this.getAllBatches().filter(b => b.formulaId === formulaId && b.status !== 'USED');
  }

  getAllFeedingRecords(): FeedingRecord[] {
    return Array.from(this.feedingRecords.values());
  }

  getFeedingRecordsByBatch(batchId: string): FeedingRecord[] {
    return this.getAllFeedingRecords().filter(r => r.batchId === batchId);
  }

  addFeedingRecord(record: FeedingRecord): void {
    this.feedingRecords.set(record.recordId, record);
  }

  getAllLoadingRecords(): LoadingRecord[] {
    return Array.from(this.loadingRecords.values()).sort((a, b) => 
      new Date(b.loadingTime).getTime() - new Date(a.loadingTime).getTime()
    );
  }

  getLoadingRecordById(loadingId: string): LoadingRecord | undefined {
    return this.loadingRecords.get(loadingId);
  }

  getLoadingRecordsByOrder(orderId: string): LoadingRecord[] {
    return this.getAllLoadingRecords().filter(l => l.orderId === orderId);
  }

  addLoadingRecord(record: LoadingRecord): void {
    this.loadingRecords.set(record.loadingId, record);
  }

  updateLoadingRecord(loadingId: string, updates: Partial<LoadingRecord>): LoadingRecord | undefined {
    const record = this.loadingRecords.get(loadingId);
    if (record) {
      const updated = { ...record, ...updates };
      this.loadingRecords.set(loadingId, updated);
      return updated;
    }
    return undefined;
  }

  getAllExceptions(): ExceptionRecord[] {
    return Array.from(this.exceptions.values()).sort((a, b) => 
      new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    );
  }

  getExceptionById(exceptionId: string): ExceptionRecord | undefined {
    return this.exceptions.get(exceptionId);
  }

  addException(exception: ExceptionRecord): void {
    this.exceptions.set(exception.exceptionId, exception);
  }

  updateException(exceptionId: string, updates: Partial<ExceptionRecord>): ExceptionRecord | undefined {
    const exception = this.exceptions.get(exceptionId);
    if (exception) {
      const updated = { ...exception, ...updates };
      this.exceptions.set(exceptionId, updated);
      return updated;
    }
    return undefined;
  }

  addOperationLog(log: OperationLog): void {
    this.operationLogs.push(log);
  }

  getOperationLogs(targetId?: string): OperationLog[] {
    let logs = [...this.operationLogs].reverse();
    if (targetId) {
      logs = logs.filter(l => l.targetId === targetId);
    }
    return logs;
  }
}

export const store = new DataStore();