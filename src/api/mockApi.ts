import type { Order, Location, DeliveryNote, OperationLog, LockRequest, AllocationRequest, PickRequest, LoadRequest, IdempotencyKey, TaskAssignment } from '@/types';
import { mockOrders, mockLocations, mockDeliveryNotes, mockOperationLogs, mockUsers, mockTaskAssignments } from '@/data/seedData';

let orders: Order[] = [...mockOrders];
let locations: Location[] = [...mockLocations];
let deliveryNotes: DeliveryNote[] = [...mockDeliveryNotes];
let operationLogs: OperationLog[] = [...mockOperationLogs];
let idempotencyKeys: IdempotencyKey[] = [];
let taskAssignments: TaskAssignment[] = [...mockTaskAssignments];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const checkIdempotency = (key: string) => {
  const existing = idempotencyKeys.find(k => k.key === key);
  if (existing) {
    const expiresAt = new Date(existing.expiresAt).getTime();
    if (Date.now() < expiresAt) {
      return JSON.parse(existing.responseBody);
    } else {
      idempotencyKeys = idempotencyKeys.filter(k => k.key !== key);
    }
  }
  return null;
};

const storeIdempotency = (key: string, requestBody: string, responseBody: string) => {
  idempotencyKeys.push({
    key,
    requestBody,
    responseBody,
    createdAt: new Date().toLocaleString('zh-CN'),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('zh-CN'),
  });
};

const validateStatusTransition = (currentStatus: string, targetStatus: string): boolean => {
  const validTransitions: Record<string, string[]> = {
    pending: ['locked', 'cancelled'],
    locked: ['allocated', 'pending', 'cancelled'],
    allocated: ['picked', 'locked', 'cancelled'],
    picked: ['loaded', 'allocated'],
    loaded: ['in_transit', 'picked'],
    in_transit: ['delivered', 'loaded'],
    delivered: ['signed', 'in_transit'],
    signed: ['completed', 'delivered'],
    completed: [],
    cancelled: [],
  };
  return validTransitions[currentStatus]?.includes(targetStatus) ?? false;
};

const validateRolePermission = (role: string, operationType: string): boolean => {
  const permissions: Record<string, string[]> = {
    warehouse_manager: ['lock', 'unlock', 'allocate', 'deallocate', 'pick'],
    driver: ['load', 'deliver'],
    customer_service: ['sign', 'complete'],
  };
  return permissions[role]?.includes(operationType) ?? false;
};

export const api = {
  orders: {
    list: async (status?: string, role?: string): Promise<Order[]> => {
      await delay(300);
      let result = orders;
      if (status) {
        result = result.filter(o => o.status === status);
      }
      if (role) {
        if (role === 'warehouse_manager') {
          result = result.filter(o => ['pending', 'locked', 'allocated', 'picked'].includes(o.status));
        } else if (role === 'driver') {
          result = result.filter(o => ['picked', 'loaded', 'in_transit'].includes(o.status));
        } else if (role === 'customer_service') {
          result = result.filter(o => ['delivered', 'signed'].includes(o.status));
        }
      }
      return result;
    },
    get: async (id: string): Promise<Order | undefined> => {
      await delay(200);
      return orders.find(o => o.id === id);
    },
    lock: async (request: LockRequest, idempotencyKey: string): Promise<{
      success: boolean;
      order: Order;
      message: string;
      idempotencyKey?: string;
    }> => {
      await delay(300);
      
      const cached = checkIdempotency(idempotencyKey);
      if (cached) {
        return { ...cached, idempotencyKey };
      }

      const order = orders.find(o => o.id === request.orderId);
      if (!order) {
        return { success: false, order: {} as Order, message: '订单不存在' };
      }

      if (!validateStatusTransition(order.status, 'locked')) {
        return { success: false, order, message: `订单当前状态(${order.status})不允许锁货操作` };
      }

      const operator = mockUsers.find(u => u.id === request.operatorId);
      if (!operator || !validateRolePermission(operator.role, 'lock')) {
        return { success: false, order, message: '当前用户没有锁货权限' };
      }

      let totalLocked = 0;
      let totalOrderQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
      
      request.items.forEach(item => {
        const orderItem = order.items.find(i => i.id === item.itemId);
        if (orderItem) {
          const availableToLock = orderItem.quantity - orderItem.lockedQuantity;
          orderItem.lockedQuantity += Math.min(item.quantity, availableToLock);
          totalLocked += orderItem.lockedQuantity;
        }
      });

      order.lockStatus = totalLocked === totalOrderQty ? 'locked' : 'partial';
      order.status = 'locked';
      order.lockedBy = request.operatorId;
      order.lockedAt = new Date().toLocaleString('zh-CN');
      order.updatedAt = new Date().toLocaleString('zh-CN');
      if (request.notes) {
        order.notes = request.notes;
      }

      if (order.lockStatus === 'partial') {
        order.riskLevel = 'high';
        order.riskReason = '部分商品未锁货，可能影响发货';
      }

      operationLogs.push({
        id: `log${Date.now()}`,
        orderId: order.id,
        orderNo: order.orderNo,
        operationType: 'lock',
        operatorId: request.operatorId,
        operatorName: operator.name,
        operatorRole: operator.role,
        description: totalLocked === totalOrderQty
          ? `锁定订单全部货物`
          : `部分锁定：已锁定${totalLocked}/${totalOrderQty}`,
        details: { items: request.items },
        createdAt: order.lockedAt,
      });

      const response = { success: true, order, message: totalLocked === totalOrderQty ? '锁货成功' : '部分锁货成功', idempotencyKey };
      storeIdempotency(idempotencyKey, JSON.stringify(request), JSON.stringify(response));
      
      return response;
    },
    allocate: async (request: AllocationRequest, idempotencyKey: string): Promise<{
      success: boolean;
      order: Order;
      message: string;
      idempotencyKey?: string;
    }> => {
      await delay(300);
      
      const cached = checkIdempotency(idempotencyKey);
      if (cached) {
        return { ...cached, idempotencyKey };
      }

      const order = orders.find(o => o.id === request.orderId);
      if (!order) {
        return { success: false, order: {} as Order, message: '订单不存在' };
      }

      if (!validateStatusTransition(order.status, 'allocated')) {
        return { success: false, order, message: `订单当前状态(${order.status})不允许分配库位` };
      }

      const lockTotal = order.items.reduce((sum, i) => sum + i.lockedQuantity, 0);
      if (lockTotal === 0) {
        return { success: false, order, message: '请先进行锁货操作' };
      }

      const operator = mockUsers.find(u => u.id === request.operatorId);
      if (!operator || !validateRolePermission(operator.role, 'allocate')) {
        return { success: false, order, message: '当前用户没有库位分配权限' };
      }

      const allocationDetails: string[] = [];
      request.items.forEach(item => {
        const orderItem = order.items.find(i => i.id === item.itemId);
        const location = locations.find(l => l.id === item.locationId);
        
        if (orderItem && location) {
          const maxAllocatable = orderItem.lockedQuantity - orderItem.allocatedQuantity;
          const availableSpace = location.capacity - location.currentQty;
          const allocQty = Math.min(item.quantity, maxAllocatable, availableSpace);
          
          if (allocQty > 0) {
            orderItem.allocatedQuantity += allocQty;
            location.currentQty += allocQty;
            location.status = 'occupied';
            location.productId = orderItem.productId;
            location.orderId = order.id;
            location.updatedAt = new Date().toLocaleString('zh-CN');
            location.allocatedBy = request.operatorId;
            location.allocatedAt = new Date().toLocaleString('zh-CN');
            
            allocationDetails.push(`${location.code}(${allocQty}${orderItem.unit})`);
          }
        }
      });

      const allocTotal = order.items.reduce((sum, i) => sum + i.allocatedQuantity, 0);
      const prevStatus = order.status;
      order.status = allocTotal === lockTotal ? 'allocated' : prevStatus;
      order.allocatedBy = request.operatorId;
      order.allocatedAt = new Date().toLocaleString('zh-CN');
      order.updatedAt = new Date().toLocaleString('zh-CN');

      operationLogs.push({
        id: `log${Date.now()}`,
        orderId: order.id,
        orderNo: order.orderNo,
        operationType: 'allocate',
        operatorId: request.operatorId,
        operatorName: operator.name,
        operatorRole: operator.role,
        description: `分配库位: ${allocationDetails.join(', ')}`,
        details: { items: request.items },
        createdAt: order.allocatedAt,
      });

      const response = { success: true, order, message: `库位分配成功: ${allocationDetails.join(', ')}`, idempotencyKey };
      storeIdempotency(idempotencyKey, JSON.stringify(request), JSON.stringify(response));
      
      return response;
    },
    pick: async (request: PickRequest, idempotencyKey: string): Promise<{
      success: boolean;
      order: Order;
      message: string;
      idempotencyKey?: string;
    }> => {
      await delay(300);
      
      const cached = checkIdempotency(idempotencyKey);
      if (cached) {
        return { ...cached, idempotencyKey };
      }

      const order = orders.find(o => o.id === request.orderId);
      if (!order) {
        return { success: false, order: {} as Order, message: '订单不存在' };
      }

      if (!validateStatusTransition(order.status, 'picked')) {
        return { success: false, order, message: `订单当前状态(${order.status})不允许拣货操作` };
      }

      const operator = mockUsers.find(u => u.id === request.operatorId);
      if (!operator || !validateRolePermission(operator.role, 'pick')) {
        return { success: false, order, message: '当前用户没有拣货权限' };
      }

      let totalPicked = 0;
      const allocTotal = order.items.reduce((sum, i) => sum + i.allocatedQuantity, 0);
      
      request.items.forEach(item => {
        const orderItem = order.items.find(i => i.id === item.itemId);
        if (orderItem) {
          const maxPickable = orderItem.allocatedQuantity - orderItem.pickedQuantity;
          orderItem.pickedQuantity += Math.min(item.quantity, maxPickable);
          totalPicked += orderItem.pickedQuantity;
        }
      });

      order.status = totalPicked === allocTotal ? 'picked' : order.status;
      order.pickedBy = request.operatorId;
      order.pickedAt = new Date().toLocaleString('zh-CN');
      order.updatedAt = new Date().toLocaleString('zh-CN');

      operationLogs.push({
        id: `log${Date.now()}`,
        orderId: order.id,
        orderNo: order.orderNo,
        operationType: 'pick',
        operatorId: request.operatorId,
        operatorName: operator.name,
        operatorRole: operator.role,
        description: `完成拣货 ${totalPicked}/${allocTotal}`,
        details: { items: request.items },
        createdAt: order.pickedAt,
      });

      const response = { success: true, order, message: '拣货成功', idempotencyKey };
      storeIdempotency(idempotencyKey, JSON.stringify(request), JSON.stringify(response));
      
      return response;
    },
    load: async (request: LoadRequest, idempotencyKey: string): Promise<{
      success: boolean;
      order: Order;
      deliveryNote: DeliveryNote | null;
      message: string;
      idempotencyKey?: string;
    }> => {
      await delay(300);
      
      const cached = checkIdempotency(idempotencyKey);
      if (cached) {
        return { ...cached, idempotencyKey } as any;
      }

      const order = orders.find(o => o.id === request.orderId);
      if (!order) {
        return { success: false, order: {} as Order, deliveryNote: null, message: '订单不存在' };
      }

      if (!validateStatusTransition(order.status, 'loaded')) {
        return { success: false, order, deliveryNote: null, message: `订单当前状态(${order.status})不允许装车操作` };
      }

      const driver = mockUsers.find(u => u.id === request.driverId);
      if (!driver || !validateRolePermission(driver.role, 'load')) {
        return { success: false, order, deliveryNote: null, message: '当前用户没有装车权限' };
      }

      order.items.forEach(item => {
        item.loadedQuantity = item.pickedQuantity;
      });

      order.status = 'loaded';
      order.driverId = request.driverId;
      order.loadedBy = request.driverId;
      order.loadedAt = new Date().toLocaleString('zh-CN');
      order.updatedAt = new Date().toLocaleString('zh-CN');

      const newDeliveryNote: DeliveryNote = {
        id: `dn${Date.now()}`,
        orderId: order.id,
        orderNo: order.orderNo,
        driverId: request.driverId,
        driverName: driver.name,
        vehicleNo: request.vehicleNo,
        status: 'loaded',
        loadedAt: order.loadedAt,
        createdAt: new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().toLocaleString('zh-CN'),
      };
      deliveryNotes.push(newDeliveryNote);

      operationLogs.push({
        id: `log${Date.now()}`,
        orderId: order.id,
        orderNo: order.orderNo,
        operationType: 'load',
        operatorId: request.driverId,
        operatorName: driver.name,
        operatorRole: driver.role,
        description: `装车完成，车辆: ${request.vehicleNo}`,
        details: { vehicleNo: request.vehicleNo },
        createdAt: order.loadedAt,
      });

      const response = { success: true, order, deliveryNote: newDeliveryNote, message: '装车成功', idempotencyKey };
      storeIdempotency(idempotencyKey, JSON.stringify(request), JSON.stringify(response));
      
      return response;
    },
    deliver: async (deliveryNoteId: string, driverId: string): Promise<{
      success: boolean;
      order: Order | null;
      deliveryNote: DeliveryNote | null;
      message: string;
    }> => {
      await delay(300);

      const deliveryNote = deliveryNotes.find(d => d.id === deliveryNoteId);
      if (!deliveryNote) {
        return { success: false, order: null, deliveryNote: null, message: '送货回单不存在' };
      }

      if (deliveryNote.status !== 'in_transit') {
        return { success: false, order: null, deliveryNote, message: `回单当前状态(${deliveryNote.status})不允许送达操作` };
      }

      const driver = mockUsers.find(u => u.id === driverId);
      if (!driver || !validateRolePermission(driver.role, 'deliver')) {
        return { success: false, order: null, deliveryNote, message: '当前用户没有送达权限' };
      }

      const order = orders.find(o => o.id === deliveryNote.orderId);
      if (!order) {
        return { success: false, order: null, deliveryNote, message: '关联订单不存在' };
      }

      deliveryNote.status = 'delivered';
      deliveryNote.deliveredAt = new Date().toLocaleString('zh-CN');
      deliveryNote.updatedAt = new Date().toLocaleString('zh-CN');

      order.status = 'delivered';
      order.deliveredAt = deliveryNote.deliveredAt;
      order.updatedAt = new Date().toLocaleString('zh-CN');

      operationLogs.push({
        id: `log${Date.now()}`,
        orderId: order.id,
        orderNo: order.orderNo,
        operationType: 'deliver',
        operatorId: driverId,
        operatorName: driver.name,
        operatorRole: driver.role,
        description: `货物已送达，等待签收`,
        createdAt: deliveryNote.deliveredAt,
      });

      return { success: true, order, deliveryNote, message: '送达成功' };
    },
    sign: async (deliveryNoteId: string, signerId: string): Promise<{
      success: boolean;
      order: Order | null;
      deliveryNote: DeliveryNote | null;
      message: string;
    }> => {
      await delay(300);

      const deliveryNote = deliveryNotes.find(d => d.id === deliveryNoteId);
      if (!deliveryNote) {
        return { success: false, order: null, deliveryNote: null, message: '送货回单不存在' };
      }

      if (deliveryNote.status !== 'delivered') {
        return { success: false, order: null, deliveryNote, message: `回单当前状态(${deliveryNote.status})不允许签收操作` };
      }

      const signer = mockUsers.find(u => u.id === signerId);
      if (!signer || !validateRolePermission(signer.role, 'sign')) {
        return { success: false, order: null, deliveryNote, message: '当前用户没有签收权限' };
      }

      const order = orders.find(o => o.id === deliveryNote.orderId);
      if (!order) {
        return { success: false, order: null, deliveryNote, message: '关联订单不存在' };
      }

      deliveryNote.status = 'signed';
      deliveryNote.signedBy = signerId;
      deliveryNote.signedAt = new Date().toLocaleString('zh-CN');
      deliveryNote.updatedAt = new Date().toLocaleString('zh-CN');

      order.status = 'signed';
      order.signedBy = signerId;
      order.signedAt = deliveryNote.signedAt;
      order.updatedAt = new Date().toLocaleString('zh-CN');
      order.riskLevel = undefined;
      order.riskReason = undefined;

      operationLogs.push({
        id: `log${Date.now()}`,
        orderId: order.id,
        orderNo: order.orderNo,
        operationType: 'sign',
        operatorId: signerId,
        operatorName: signer.name,
        operatorRole: signer.role,
        description: '客户已签收',
        createdAt: deliveryNote.signedAt,
      });

      return { success: true, order, deliveryNote, message: '签收成功' };
    },
    complete: async (orderId: string, operatorId: string): Promise<{
      success: boolean;
      order: Order | null;
      message: string;
    }> => {
      await delay(200);

      const order = orders.find(o => o.id === orderId);
      if (!order) {
        return { success: false, order: null, message: '订单不存在' };
      }

      if (!validateStatusTransition(order.status, 'completed')) {
        return { success: false, order, message: `订单当前状态(${order.status})不允许完成操作` };
      }

      const operator = mockUsers.find(u => u.id === operatorId);
      if (!operator || !validateRolePermission(operator.role, 'complete')) {
        return { success: false, order, message: '当前用户没有完成订单权限' };
      }

      order.status = 'completed';
      order.updatedAt = new Date().toLocaleString('zh-CN');

      operationLogs.push({
        id: `log${Date.now()}`,
        orderId: order.id,
        orderNo: order.orderNo,
        operationType: 'complete',
        operatorId: operatorId,
        operatorName: operator.name,
        operatorRole: operator.role,
        description: '订单已完成',
        createdAt: order.updatedAt,
      });

      return { success: true, order, message: '订单完成成功' };
    },
    updateStatus: async (orderId: string, status: string): Promise<{
      success: boolean;
      order: Order;
      message: string;
    }> => {
      await delay(200);
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        return { success: false, order: {} as Order, message: '订单不存在' };
      }
      
      if (!validateStatusTransition(order.status, status)) {
        return { success: false, order, message: `不允许从${order.status}转换到${status}` };
      }
      
      order.status = status as any;
      order.updatedAt = new Date().toLocaleString('zh-CN');
      return { success: true, order, message: '状态更新成功' };
    },
  },
  locations: {
    list: async (status?: string, orderId?: string, productId?: string): Promise<Location[]> => {
      await delay(200);
      let result = locations;
      if (status) {
        result = result.filter(l => l.status === status);
      }
      if (orderId) {
        result = result.filter(l => l.orderId === orderId);
      }
      if (productId) {
        result = result.filter(l => l.productId === productId);
      }
      return result;
    },
    get: async (id: string): Promise<Location | undefined> => {
      await delay(100);
      return locations.find(l => l.id === id);
    },
    update: async (id: string, updates: Partial<Location>): Promise<Location | undefined> => {
      await delay(200);
      const index = locations.findIndex(l => l.id === id);
      if (index !== -1) {
        locations[index] = { ...locations[index], ...updates, updatedAt: new Date().toLocaleString('zh-CN') };
        return locations[index];
      }
      return undefined;
    },
    release: async (locationId: string, operatorId: string): Promise<{
      success: boolean;
      location: Location | undefined;
      message: string;
    }> => {
      await delay(200);
      const location = locations.find(l => l.id === locationId);
      if (!location) {
        return { success: false, location: undefined, message: '库位不存在' };
      }

      if (location.status !== 'occupied' && location.status !== 'reserved') {
        return { success: false, location, message: `库位当前状态(${location.status})不允许释放` };
      }

      const operator = mockUsers.find(u => u.id === operatorId);
      if (!operator || !validateRolePermission(operator.role, 'deallocate')) {
        return { success: false, location, message: '当前用户没有释放库位权限' };
      }

      const orderId = location.orderId;
      if (orderId) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          order.items.forEach(item => {
            if (item.productId === location.productId) {
              item.allocatedQuantity -= location.currentQty;
            }
          });
          order.updatedAt = new Date().toLocaleString('zh-CN');
        }
      }

      location.status = 'empty';
      location.currentQty = 0;
      location.productId = undefined;
      location.orderId = undefined;
      location.allocatedBy = undefined;
      location.allocatedAt = undefined;
      location.updatedAt = new Date().toLocaleString('zh-CN');

      return { success: true, location, message: '库位释放成功' };
    },
  },
  deliveryNotes: {
    list: async (status?: string, driverId?: string): Promise<DeliveryNote[]> => {
      await delay(200);
      let result = deliveryNotes;
      if (status) {
        result = result.filter(d => d.status === status);
      }
      if (driverId) {
        result = result.filter(d => d.driverId === driverId);
      }
      return result;
    },
    get: async (id: string): Promise<DeliveryNote | undefined> => {
      await delay(100);
      return deliveryNotes.find(d => d.id === id);
    },
    create: async (orderId: string, driverId: string): Promise<{
      success: boolean;
      deliveryNote: DeliveryNote | null;
      message: string;
    }> => {
      await delay(300);
      const order = orders.find(o => o.id === orderId);
      const driver = mockUsers.find(u => u.id === driverId);
      
      if (!order) {
        return { success: false, deliveryNote: null, message: '订单不存在' };
      }
      
      if (!driver) {
        return { success: false, deliveryNote: null, message: '司机不存在' };
      }

      const newNote: DeliveryNote = {
        id: `dn${Date.now()}`,
        orderId,
        orderNo: order.orderNo,
        driverId,
        driverName: driver.name,
        vehicleNo: '京A' + Math.floor(Math.random() * 90000 + 10000),
        status: 'pending',
        createdAt: new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().toLocaleString('zh-CN'),
      };
      deliveryNotes.push(newNote);
      
      return { success: true, deliveryNote: newNote, message: '送货回单创建成功' };
    },
    updateStatus: async (id: string, status: string): Promise<DeliveryNote | undefined> => {
      await delay(200);
      const index = deliveryNotes.findIndex(d => d.id === id);
      if (index !== -1) {
        deliveryNotes[index] = {
          ...deliveryNotes[index],
          status: status as any,
          updatedAt: new Date().toLocaleString('zh-CN'),
        };
        return deliveryNotes[index];
      }
      return undefined;
    },
  },
  operationLogs: {
    list: async (orderId?: string, operatorId?: string): Promise<OperationLog[]> => {
      await delay(200);
      let result = operationLogs;
      if (orderId) {
        result = result.filter(l => l.orderId === orderId);
      }
      if (operatorId) {
        result = result.filter(l => l.operatorId === operatorId);
      }
      return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  },
  users: {
    list: async (role?: string): Promise<typeof mockUsers> => {
      await delay(100);
      if (role) {
        return mockUsers.filter(u => u.role === role);
      }
      return mockUsers;
    },
    get: async (id: string): Promise<typeof mockUsers[0] | undefined> => {
      await delay(100);
      return mockUsers.find(u => u.id === id);
    },
  },
  taskAssignments: {
    list: async (assigneeId?: string, status?: string): Promise<TaskAssignment[]> => {
      await delay(200);
      let result = taskAssignments;
      if (assigneeId) {
        result = result.filter(t => t.assigneeId === assigneeId);
      }
      if (status) {
        result = result.filter(t => t.status === status);
      }
      return result.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
    },
    create: async (orderId: string, assigneeId: string, taskType: TaskAssignment['taskType']): Promise<{
      success: boolean;
      task: TaskAssignment | null;
      message: string;
    }> => {
      await delay(200);
      const order = orders.find(o => o.id === orderId);
      const assignee = mockUsers.find(u => u.id === assigneeId);
      
      if (!order) {
        return { success: false, task: null, message: '订单不存在' };
      }
      
      if (!assignee) {
        return { success: false, task: null, message: '经办人不存在' };
      }

      if (!validateRolePermission(assignee.role, taskType)) {
        return { success: false, task: null, message: '当前角色没有执行此任务的权限' };
      }

      const existingTask = taskAssignments.find(t => t.orderId === orderId && t.taskType === taskType && t.status === 'pending');
      if (existingTask) {
        return { success: false, task: existingTask, message: '该任务已存在' };
      }

      const newTask: TaskAssignment = {
        orderId,
        orderNo: order.orderNo,
        assigneeId,
        assigneeName: assignee.name,
        assigneeRole: assignee.role,
        taskType,
        status: 'pending',
        assignedAt: new Date().toLocaleString('zh-CN'),
      };
      taskAssignments.push(newTask);

      return { success: true, task: newTask, message: '任务分配成功' };
    },
    updateStatus: async (taskId: string, status: TaskAssignment['status']): Promise<{
      success: boolean;
      task: TaskAssignment | undefined;
      message: string;
    }> => {
      await delay(200);
      const index = taskAssignments.findIndex(t => t.orderId + t.taskType === taskId);
      if (index !== -1) {
        const task = taskAssignments[index];
        const validTransitions: Record<string, string[]> = {
          pending: ['in_progress', 'completed'],
          in_progress: ['completed', 'pending'],
          completed: [],
        };
        
        if (!validTransitions[task.status]?.includes(status)) {
          return { success: false, task, message: `不允许从${task.status}转换到${status}` };
        }
        
        taskAssignments[index] = {
          ...task,
          status,
          completedAt: status === 'completed' ? new Date().toLocaleString('zh-CN') : task.completedAt,
        };
        
        return { success: true, task: taskAssignments[index], message: '任务状态更新成功' };
      }
      return { success: false, task: undefined, message: '任务不存在' };
    },
  },
  idempotency: {
    get: async (key: string): Promise<IdempotencyKey | undefined> => {
      await delay(100);
      return idempotencyKeys.find(k => k.key === key);
    },
    cleanup: async (): Promise<number> => {
      await delay(100);
      const beforeCount = idempotencyKeys.length;
      idempotencyKeys = idempotencyKeys.filter(k => {
        const expiresAt = new Date(k.expiresAt).getTime();
        return Date.now() < expiresAt;
      });
      return beforeCount - idempotencyKeys.length;
    },
  },
};
