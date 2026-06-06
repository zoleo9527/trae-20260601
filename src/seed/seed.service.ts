import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataStoreService } from '../common/data-store.service';
import { User } from '../common/interfaces/user.interface';
import { RepairOrder } from '../repair/interfaces/repair.interface';
import { DispatchRecord } from '../dispatch/interfaces/dispatch.interface';
import { HistoryNote } from '../common/interfaces/history-note.interface';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly dataStore: DataStoreService) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const users: User[] = [
      { id: 'dorm_1', name: '张宿管', role: 'dorm_manager', phone: '13800000001', department: '学生宿舍管理处' },
      { id: 'dorm_2', name: '李宿管', role: 'dorm_manager', phone: '13800000002', department: '学生宿舍管理处' },
      { id: 'logistics_1', name: '王主管', role: 'logistics_supervisor', phone: '13800000003', department: '后勤保障部' },
      { id: 'worker_1', name: '刘师傅', role: 'maintenance_worker', phone: '13800000004', department: '维修班组' },
      { id: 'worker_2', name: '陈师傅', role: 'maintenance_worker', phone: '13800000005', department: '维修班组' },
      { id: 'worker_3', name: '赵师傅', role: 'maintenance_worker', phone: '13800000006', department: '维修班组' },
    ];
    this.dataStore.setUsers(users);

    const baseTime = Date.now();

    const orders: RepairOrder[] = [
      {
        id: 'order_001',
        orderNo: 'BX20250601',
        title: '3号楼卫生间水管漏水',
        description: '3号楼2层男卫生间第三个隔间水管漏水，地面有积水',
        category: 'plumbing',
        urgency: 'high',
        location: '3号楼2层',
        dormitory: '3-205',
        reporterName: '张宿管',
        reporterPhone: '13800000001',
        reporterId: 'dorm_1',
        status: 'completed',
        hasUnclearResponsibility: false,
        assignedWorkerId: 'worker_1',
        assignedWorkerName: '刘师傅',
        createdAt: new Date(baseTime - 86400000 * 3),
        updatedAt: new Date(baseTime - 86400000),
        completedAt: new Date(baseTime - 86400000),
      },
      {
        id: 'order_002',
        orderNo: 'BX20250602',
        title: '5号楼走廊灯不亮',
        description: '5号楼3层走廊靠近楼梯口的灯不亮，晚上很暗',
        category: 'electrical',
        urgency: 'medium',
        location: '5号楼3层走廊',
        reporterName: '李宿管',
        reporterPhone: '13800000002',
        reporterId: 'dorm_2',
        status: 'in_progress',
        hasUnclearResponsibility: true,
        responsibilityNote: '不确定是灯泡问题还是线路问题，需要专业人员检查',
        assignedWorkerId: 'worker_2',
        assignedWorkerName: '陈师傅',
        createdAt: new Date(baseTime - 86400000 * 2),
        updatedAt: new Date(baseTime - 43200000),
      },
      {
        id: 'order_003',
        orderNo: 'BX20250603',
        title: '宿舍空调不制冷',
        description: '2号楼408宿舍空调开机后只出风不制冷，可能需要加氟',
        category: 'appliance',
        urgency: 'high',
        location: '2号楼4层',
        dormitory: '2-408',
        reporterName: '张宿管',
        reporterPhone: '13800000001',
        reporterId: 'dorm_1',
        status: 'dispatched',
        hasUnclearResponsibility: false,
        assignedWorkerId: 'worker_3',
        assignedWorkerName: '赵师傅',
        createdAt: new Date(baseTime - 86400000),
        updatedAt: new Date(baseTime - 43200000),
      },
      {
        id: 'order_004',
        orderNo: 'BX20250604',
        title: '1号楼门锁损坏',
        description: '1号楼102宿舍门把手松动，无法正常锁门',
        category: 'carpentry',
        urgency: 'urgent',
        location: '1号楼1层',
        dormitory: '1-102',
        reporterName: '李宿管',
        reporterPhone: '13800000002',
        reporterId: 'dorm_2',
        status: 'pending',
        hasUnclearResponsibility: true,
        responsibilityNote: '学生说是正常使用损坏，但有明显撞击痕迹，可能是人为损坏',
        createdAt: new Date(baseTime - 21600000),
        updatedAt: new Date(baseTime - 21600000),
      },
      {
        id: 'order_005',
        orderNo: 'BX20250605',
        title: '4号楼饮水机故障',
        description: '4号楼2层饮水机不出热水，冷水正常',
        category: 'appliance',
        urgency: 'medium',
        location: '4号楼2层茶水间',
        reporterName: '张宿管',
        reporterPhone: '13800000001',
        reporterId: 'dorm_1',
        status: 'pending',
        hasUnclearResponsibility: false,
        createdAt: new Date(baseTime - 7200000),
        updatedAt: new Date(baseTime - 7200000),
      },
    ];
    this.dataStore.setRepairOrders(orders);

    const dispatches: DispatchRecord[] = [
      {
        id: 'dispatch_001',
        repairOrderId: 'order_001',
        repairOrderNo: 'BX20250601',
        repairTitle: '3号楼卫生间水管漏水',
        dispatcherId: 'logistics_1',
        dispatcherName: '王主管',
        workerId: 'worker_1',
        workerName: '刘师傅',
        status: 'accepted',
        dispatchNote: '请尽快处理，漏水比较严重',
        createdAt: new Date(baseTime - 86400000 * 3 + 3600000),
        updatedAt: new Date(baseTime - 86400000 * 2),
      },
      {
        id: 'dispatch_002',
        repairOrderId: 'order_002',
        repairOrderNo: 'BX20250602',
        repairTitle: '5号楼走廊灯不亮',
        dispatcherId: 'logistics_1',
        dispatcherName: '王主管',
        workerId: 'worker_2',
        workerName: '陈师傅',
        status: 'accepted',
        dispatchNote: '注意安全，先断电再检查',
        createdAt: new Date(baseTime - 86400000 * 2 + 7200000),
        updatedAt: new Date(baseTime - 86400000),
      },
      {
        id: 'dispatch_003',
        repairOrderId: 'order_003',
        repairOrderNo: 'BX20250603',
        repairTitle: '宿舍空调不制冷',
        dispatcherId: 'logistics_1',
        dispatcherName: '王主管',
        workerId: 'worker_3',
        workerName: '赵师傅',
        status: 'dispatched',
        dispatchNote: '天气热，学生催得紧，请优先处理',
        createdAt: new Date(baseTime - 43200000),
        updatedAt: new Date(baseTime - 43200000),
      },
    ];
    this.dataStore.setDispatchRecords(dispatches);

    const historyNotes: { [key: string]: HistoryNote[] } = {
      order_001: [
        {
          id: 'note_001_1',
          orderId: 'order_001',
          operatorId: 'dorm_1',
          operatorName: '张宿管',
          operatorRole: 'dorm_manager',
          action: 'create',
          content: '提交报修单：3号楼卫生间水管漏水',
          timestamp: new Date(baseTime - 86400000 * 3),
        },
        {
          id: 'note_001_2',
          orderId: 'order_001',
          operatorId: 'logistics_1',
          operatorName: '王主管',
          operatorRole: 'logistics_supervisor',
          action: 'update_status_dispatched',
          content: '派单给 刘师傅，备注：请尽快处理，漏水比较严重',
          timestamp: new Date(baseTime - 86400000 * 3 + 3600000),
        },
        {
          id: 'note_001_3',
          orderId: 'order_001',
          operatorId: 'worker_1',
          operatorName: '刘师傅',
          operatorRole: 'maintenance_worker',
          action: 'update_status_accepted',
          content: '已接单，带上工具马上过去',
          timestamp: new Date(baseTime - 86400000 * 3 + 7200000),
        },
        {
          id: 'note_001_4',
          orderId: 'order_001',
          operatorId: 'worker_1',
          operatorName: '刘师傅',
          operatorRole: 'maintenance_worker',
          action: 'progress_note',
          content: '进度备注：检查发现是水管接头老化，需要更换接头',
          timestamp: new Date(baseTime - 86400000 * 2.5),
        },
        {
          id: 'note_001_5',
          orderId: 'order_001',
          operatorId: 'worker_1',
          operatorName: '刘师傅',
          operatorRole: 'maintenance_worker',
          action: 'update_status_completed',
          content: '维修完成，已更换水管接头，测试无漏水',
          timestamp: new Date(baseTime - 86400000),
        },
      ],
      order_002: [
        {
          id: 'note_002_1',
          orderId: 'order_002',
          operatorId: 'dorm_2',
          operatorName: '李宿管',
          operatorRole: 'dorm_manager',
          action: 'create',
          content: '提交报修单：5号楼走廊灯不亮',
          timestamp: new Date(baseTime - 86400000 * 2),
        },
        {
          id: 'note_002_2',
          orderId: 'order_002',
          operatorId: 'dorm_2',
          operatorName: '李宿管',
          operatorRole: 'dorm_manager',
          action: 'mark_responsibility',
          content: '标记责任不清：不确定是灯泡问题还是线路问题，需要专业人员检查',
          timestamp: new Date(baseTime - 86400000 * 2 + 1800000),
          isException: true,
          exceptionType: 'responsibility_unclear',
        },
        {
          id: 'note_002_3',
          orderId: 'order_002',
          operatorId: 'logistics_1',
          operatorName: '王主管',
          operatorRole: 'logistics_supervisor',
          action: 'update_status_dispatched',
          content: '派单给 陈师傅，备注：注意安全，先断电再检查',
          timestamp: new Date(baseTime - 86400000 * 2 + 7200000),
        },
        {
          id: 'note_002_4',
          orderId: 'order_002',
          operatorId: 'worker_2',
          operatorName: '陈师傅',
          operatorRole: 'maintenance_worker',
          action: 'update_status_accepted',
          content: '已接单',
          timestamp: new Date(baseTime - 86400000),
        },
        {
          id: 'note_002_5',
          orderId: 'order_002',
          operatorId: 'worker_2',
          operatorName: '陈师傅',
          operatorRole: 'maintenance_worker',
          action: 'update_status_in_progress',
          content: '开始维修，检查中',
          timestamp: new Date(baseTime - 43200000),
        },
        {
          id: 'note_002_6',
          orderId: 'order_002',
          operatorId: 'worker_2',
          operatorName: '陈师傅',
          operatorRole: 'maintenance_worker',
          action: 'report_exception',
          content: '异常上报[线路老化]：检查发现是线路老化，需要重新布线，预计明天才能完成',
          timestamp: new Date(baseTime - 21600000),
          isException: true,
          exceptionType: '线路老化',
        },
      ],
      order_003: [
        {
          id: 'note_003_1',
          orderId: 'order_003',
          operatorId: 'dorm_1',
          operatorName: '张宿管',
          operatorRole: 'dorm_manager',
          action: 'create',
          content: '提交报修单：宿舍空调不制冷',
          timestamp: new Date(baseTime - 86400000),
        },
        {
          id: 'note_003_2',
          orderId: 'order_003',
          operatorId: 'logistics_1',
          operatorName: '王主管',
          operatorRole: 'logistics_supervisor',
          action: 'update_status_dispatched',
          content: '派单给 赵师傅，备注：天气热，学生催得紧，请优先处理',
          timestamp: new Date(baseTime - 43200000),
        },
      ],
      order_004: [
        {
          id: 'note_004_1',
          orderId: 'order_004',
          operatorId: 'dorm_2',
          operatorName: '李宿管',
          operatorRole: 'dorm_manager',
          action: 'create',
          content: '提交报修单：1号楼门锁损坏',
          timestamp: new Date(baseTime - 21600000),
        },
        {
          id: 'note_004_2',
          orderId: 'order_004',
          operatorId: 'dorm_2',
          operatorName: '李宿管',
          operatorRole: 'dorm_manager',
          action: 'mark_exception',
          content: '标记责任不清：学生说是正常使用损坏，但有明显撞击痕迹，可能是人为损坏',
          timestamp: new Date(baseTime - 18000000),
          isException: true,
          exceptionType: 'responsibility_unclear',
        },
      ],
      order_005: [
        {
          id: 'note_005_1',
          orderId: 'order_005',
          operatorId: 'dorm_1',
          operatorName: '张宿管',
          operatorRole: 'dorm_manager',
          action: 'create',
          content: '提交报修单：4号楼饮水机故障',
          timestamp: new Date(baseTime - 7200000),
        },
      ],
    };

    for (const [orderId, notes] of Object.entries(historyNotes)) {
      this.dataStore.setHistoryNotes(orderId, notes);
    }

    console.log('种子数据已加载');
  }

  async reset() {
    await this.seed();
    return { message: '数据已重置' };
  }
}
