import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from '../entities/staff.entity';
import { Customer } from '../entities/customer.entity';
import { DeliveryRoute } from '../entities/delivery-route.entity';
import { MilkChange } from '../entities/milk-change.entity';
import {
  StaffRole,
  MilkChangeStatus,
  MilkChangeType,
  OperationType,
  ReturnReason,
} from '../common/enums';
import { OperationLogService } from './operation-log.service';

@Injectable()
export class DataInitService implements OnModuleInit {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(DeliveryRoute)
    private readonly routeRepository: Repository<DeliveryRoute>,
    @InjectRepository(MilkChange)
    private readonly milkChangeRepository: Repository<MilkChange>,
    private readonly operationLogService: OperationLogService,
  ) {}

  async onModuleInit() {
    const staffCount = await this.staffRepository.count();
    if (staffCount > 0) {
      console.log('数据已初始化，跳过...');
      return;
    }
    console.log('开始初始化乳品配送站样例数据...');
    const staffs = await this.initStaff();
    const routes = await this.initRoutes(staffs);
    const customers = await this.initCustomers(routes);
    await this.initMilkChanges(staffs, customers, routes);
    console.log('样例数据初始化完成！');
  }

  async initStaff() {
    const staffs = [
      { id: 'staff-clerk-1', name: '王文员', role: StaffRole.STATION_CLERK, phone: '13800138001' },
      { id: 'staff-delivery-1', name: '李配送', role: StaffRole.DELIVERY_STAFF, phone: '13800138002' },
      { id: 'staff-delivery-2', name: '张配送', role: StaffRole.DELIVERY_STAFF, phone: '13800138003' },
      { id: 'staff-cs-1', name: '赵客服', role: StaffRole.CUSTOMER_SERVICE, phone: '13800138004' },
    ];
    const result = [];
    for (const s of staffs) {
      const staff = this.staffRepository.create(s);
      result.push(await this.staffRepository.save(staff));
    }
    return result;
  }

  async initRoutes(staffs: Staff[]) {
    const deliveryStaffs = staffs.filter(s => s.role === StaffRole.DELIVERY_STAFF);
    const routes = [
      { id: 'route-1', name: '城东A线', description: '城东片区早班配送', deliveryStaffId: deliveryStaffs[0].id, customerCount: 3 },
      { id: 'route-2', name: '城东B线', description: '城东片区晚班配送', deliveryStaffId: deliveryStaffs[1].id, customerCount: 2 },
      { id: 'route-3', name: '城西线', description: '城西片区配送', deliveryStaffId: deliveryStaffs[0].id, customerCount: 0 },
    ];
    const result = [];
    for (const r of routes) {
      const route = this.routeRepository.create(r);
      result.push(await this.routeRepository.save(route));
    }
    return result;
  }

  async initCustomers(routes: DeliveryRoute[]) {
    const customers = [
      {
        id: 'cust-1',
        name: '陈阿姨',
        phone: '13900139001',
        address: '城东区阳光花园1栋',
        addressDetail: '302室',
        currentProduct: '鲜牛奶',
        currentQuantity: 2,
        deliveryTime: '07:00',
        routeId: routes[0].id,
      },
      {
        id: 'cust-2',
        name: '刘大爷',
        phone: '13900139002',
        address: '城东区阳光花园2栋',
        addressDetail: '101室',
        currentProduct: '高钙奶',
        currentQuantity: 1,
        deliveryTime: '06:30',
        routeId: routes[0].id,
      },
      {
        id: 'cust-3',
        name: '张女士',
        phone: '13900139003',
        address: '城东区明珠苑5栋',
        addressDetail: '501室',
        currentProduct: '鲜牛奶',
        currentQuantity: 3,
        deliveryTime: '07:30',
        routeId: routes[0].id,
      },
      {
        id: 'cust-4',
        name: '王先生',
        phone: '13900139004',
        address: '城东区丽景花园3栋',
        addressDetail: '203室',
        currentProduct: '酸奶',
        currentQuantity: 1,
        deliveryTime: '18:00',
        routeId: routes[1].id,
      },
      {
        id: 'cust-5',
        name: '李奶奶',
        phone: '13900139005',
        address: '城东区丽景花园7栋',
        addressDetail: '402室',
        currentProduct: '高钙奶',
        currentQuantity: 2,
        deliveryTime: '18:30',
        routeId: routes[1].id,
      },
    ];
    const result = [];
    for (const c of customers) {
      const customer = this.customerRepository.create(c);
      result.push(await this.customerRepository.save(customer));
    }
    return result;
  }

  async initMilkChanges(staffs: Staff[], customers: Customer[], routes: DeliveryRoute[]) {
    const now = new Date();
    const clerk = staffs.find(s => s.role === StaffRole.STATION_CLERK);
    const delivery1 = staffs.find(s => s.role === StaffRole.DELIVERY_STAFF && s.name === '李配送');
    const delivery2 = staffs.find(s => s.role === StaffRole.DELIVERY_STAFF && s.name === '张配送');
    const cs = staffs.find(s => s.role === StaffRole.CUSTOMER_SERVICE);

    const change1 = this.milkChangeRepository.create({
      id: 'mc-1',
      customerId: customers[0].id,
      changeType: MilkChangeType.CHANGE_QUANTITY,
      changeDetail: '从2瓶增加到3瓶',
      oldProduct: '鲜牛奶',
      oldQuantity: 2,
      newProduct: '鲜牛奶',
      newQuantity: 3,
      oldRouteId: routes[0].id,
      oldRouteName: routes[0].name,
      newRouteId: routes[0].id,
      newRouteName: routes[0].name,
      routeAdjustReason: '',
      status: MilkChangeStatus.COMPLETED,
      currentHandlerId: clerk.id,
      assignedToId: clerk.id,
      remark: '客户要求增加订奶数量',
      supplementRemark: '客户家小孩开学，需要多一瓶',
      effectiveDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      expectedCompleteAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    });
    await this.milkChangeRepository.save(change1);
    await this.operationLogService.createLog(change1.id, OperationType.CREATE, clerk.id, clerk.name, null, MilkChangeStatus.PENDING_CLERK, '客户申请增加订奶数量');
    await this.operationLogService.createLog(change1.id, OperationType.UPDATE, clerk.id, clerk.name, MilkChangeStatus.PENDING_CLERK, MilkChangeStatus.CLERK_PROCESSING, '文员受理，核实客户信息');
    await this.operationLogService.createLog(change1.id, OperationType.TRANSFER, clerk.id, clerk.name, MilkChangeStatus.CLERK_PROCESSING, MilkChangeStatus.PENDING_DELIVERY, '转配送员确认路线');
    await this.operationLogService.createLog(change1.id, OperationType.UPDATE, delivery1.id, delivery1.name, MilkChangeStatus.PENDING_DELIVERY, MilkChangeStatus.DELIVERY_IN_PROGRESS, '配送员确认，可正常配送');
    await this.operationLogService.createLog(change1.id, OperationType.COMPLETE, delivery1.id, delivery1.name, MilkChangeStatus.DELIVERY_IN_PROGRESS, MilkChangeStatus.COMPLETED, '已完成变更，明日生效');

    const change2 = this.milkChangeRepository.create({
      id: 'mc-2',
      customerId: customers[1].id,
      changeType: MilkChangeType.CHANGE_ADDRESS,
      changeDetail: '从阳光花园2栋搬到3栋',
      oldAddress: '城东区阳光花园2栋101室',
      newAddress: '城东区阳光花园3栋202室',
      oldRouteId: routes[0].id,
      oldRouteName: routes[0].name,
      newRouteId: routes[0].id,
      newRouteName: routes[0].name,
      routeAdjustReason: '同小区内调整，路线不变',
      status: MilkChangeStatus.RETURNED,
      currentHandlerId: clerk.id,
      assignedToId: clerk.id,
      returnReason: ReturnReason.INSUFFICIENT_INFO,
      returnDetail: '新地址门牌号不完整，请补充具体单元号',
      remark: '客户搬家需要变更配送地址',
      expectedCompleteAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    });
    await this.milkChangeRepository.save(change2);
    await this.operationLogService.createLog(change2.id, OperationType.CREATE, clerk.id, clerk.name, null, MilkChangeStatus.PENDING_CLERK, '客户申请变更配送地址');
    await this.operationLogService.createLog(change2.id, OperationType.RETURN, delivery1.id, delivery1.name, MilkChangeStatus.PENDING_DELIVERY, MilkChangeStatus.RETURNED, '新地址门牌号不完整，请补充具体单元号');

    const change3 = this.milkChangeRepository.create({
      id: 'mc-3',
      customerId: customers[2].id,
      changeType: MilkChangeType.CHANGE_ADDRESS,
      changeDetail: '从城东区搬到城西区',
      oldAddress: '城东区明珠苑5栋501室',
      newAddress: '城西区幸福里小区8栋301室',
      oldRouteId: routes[0].id,
      oldRouteName: routes[0].name,
      status: MilkChangeStatus.PENDING_CLERK,
      currentHandlerId: clerk.id,
      assignedToId: clerk.id,
      remark: '客户工作调动，需要跨区变更配送地址',
      expectedCompleteAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    });
    await this.milkChangeRepository.save(change3);
    await this.operationLogService.createLog(change3.id, OperationType.CREATE, clerk.id, clerk.name, null, MilkChangeStatus.PENDING_CLERK, '客户申请跨区变更地址，需重新规划路线');

    const change4 = this.milkChangeRepository.create({
      id: 'mc-4',
      customerId: customers[3].id,
      changeType: MilkChangeType.PAUSE_DELIVERY,
      changeDetail: '外出旅游，暂停一周',
      status: MilkChangeStatus.PENDING_DELIVERY,
      currentHandlerId: delivery2.id,
      assignedToId: delivery2.id,
      remark: '客户下周外出旅游，暂停配送7天',
      supplementRemark: '从下周一（6月10日）开始暂停，6月17日恢复',
      effectiveDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      expectedCompleteAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    });
    await this.milkChangeRepository.save(change4);
    await this.operationLogService.createLog(change4.id, OperationType.CREATE, clerk.id, clerk.name, null, MilkChangeStatus.PENDING_CLERK, '客户申请暂停配送一周');
    await this.operationLogService.createLog(change4.id, OperationType.TRANSFER, clerk.id, clerk.name, MilkChangeStatus.PENDING_CLERK, MilkChangeStatus.PENDING_DELIVERY, '请配送员确认并安排库存调整');

    const change5 = this.milkChangeRepository.create({
      id: 'mc-5',
      customerId: customers[4].id,
      changeType: MilkChangeType.ADD_PRODUCT,
      changeDetail: '增加酸奶1瓶',
      oldProduct: '高钙奶',
      oldQuantity: 2,
      newProduct: '高钙奶+酸奶',
      newQuantity: 3,
      oldRouteId: routes[1].id,
      oldRouteName: routes[1].name,
      newRouteId: routes[1].id,
      newRouteName: routes[1].name,
      status: MilkChangeStatus.DELIVERY_IN_PROGRESS,
      currentHandlerId: delivery2.id,
      assignedToId: delivery2.id,
      remark: '客户想给孙子加订酸奶',
      expectedCompleteAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    });
    await this.milkChangeRepository.save(change5);
    await this.operationLogService.createLog(change5.id, OperationType.CREATE, cs.id, cs.name, null, MilkChangeStatus.PENDING_CLERK, '客服接到客户电话，申请加订酸奶');
    await this.operationLogService.createLog(change5.id, OperationType.TRANSFER, clerk.id, clerk.name, MilkChangeStatus.PENDING_CLERK, MilkChangeStatus.PENDING_DELIVERY, '转配送员确认并执行');
    await this.operationLogService.createLog(change5.id, OperationType.UPDATE, delivery2.id, delivery2.name, MilkChangeStatus.PENDING_DELIVERY, MilkChangeStatus.DELIVERY_IN_PROGRESS, '配送员已确认，今晚开始配送');

    const change6 = this.milkChangeRepository.create({
      id: 'mc-6',
      customerId: customers[0].id,
      changeType: MilkChangeType.CHANGE_DELIVERY_TIME,
      changeDetail: '从7:00改为6:30配送',
      oldDeliveryTime: '07:00',
      newDeliveryTime: '06:30',
      status: MilkChangeStatus.PENDING_CUSTOMER_SERVICE,
      currentHandlerId: cs.id,
      assignedToId: cs.id,
      remark: '客户需要更早收到牛奶',
      returnReason: ReturnReason.NEED_CLERK_CONFIRM,
      returnDetail: '时间变更可能影响路线，需文员确认',
      expectedCompleteAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
    });
    await this.milkChangeRepository.save(change6);
    await this.operationLogService.createLog(change6.id, OperationType.CREATE, clerk.id, clerk.name, null, MilkChangeStatus.PENDING_CLERK, '客户申请变更配送时间');
    await this.operationLogService.createLog(change6.id, OperationType.RETURN, delivery1.id, delivery1.name, MilkChangeStatus.PENDING_DELIVERY, MilkChangeStatus.RETURNED, '该时间点与路线冲突，需重新协调');
    await this.operationLogService.createLog(change6.id, OperationType.TRANSFER, clerk.id, clerk.name, MilkChangeStatus.RETURNED, MilkChangeStatus.PENDING_CUSTOMER_SERVICE, '请客服与客户沟通协调时间');
  }
}
