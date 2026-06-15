import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProductionOrder, QualityInspection, Shipment, Notification, User, Role, ProcessRecord } from '../types';
import { mockOrders, mockQualityInspections, mockShipments, mockNotifications, mockUsers } from '../data/mockData';

interface AppState {
  currentUser: User;
  orders: ProductionOrder[];
  qualityInspections: QualityInspection[];
  shipments: Omit<Shipment, 'order' | 'qualityInspection'>[];
  notifications: Notification[];
  processRecords: ProcessRecord[];
  offlineMode: boolean;
  lastSyncTime: string;
}

const initialState: AppState = {
  currentUser: mockUsers[0],
  orders: mockOrders,
  qualityInspections: mockQualityInspections,
  shipments: mockShipments.map(s => ({
    id: s.id,
    productionOrderId: s.productionOrderId,
    packagingItems: s.packagingItems,
    boxCount: s.boxCount,
    weight: s.weight,
    shippingMethod: s.shippingMethod,
    trackingNo: s.trackingNo,
    shipper: s.shipper,
    shippedAt: s.shippedAt,
    createdAt: s.createdAt,
    status: s.status
  })),
  notifications: mockNotifications,
  processRecords: [
    {
      id: 'pr1',
      orderId: 'po1',
      type: 'quality_check',
      title: '开始质检',
      description: '制作师傅李师傅开始对订单 PO-2024-001 进行成品质检',
      operatorName: '李师傅',
      operatorRole: 'producer',
      timestamp: '2024-01-20 09:30',
      offline: false
    },
    {
      id: 'pr2',
      orderId: 'po1',
      type: 'quality_update',
      title: '质检项更新',
      description: '字体版本核对: 通过；材料规格检查: 通过；颜色核对: 未通过（颜色偏差约5%）',
      operatorName: '李师傅',
      operatorRole: 'producer',
      timestamp: '2024-01-20 09:45',
      statusBefore: 'pending',
      statusAfter: 'fail',
      offline: false
    },
    {
      id: 'pr3',
      orderId: 'po1',
      type: 'quality_update',
      title: '质检项修正',
      description: '颜色问题已重新喷涂处理，等待最终检查',
      operatorName: '李师傅',
      operatorRole: 'producer',
      timestamp: '2024-01-20 10:15',
      statusBefore: 'fail',
      statusAfter: 'pending',
      offline: false
    },
    {
      id: 'pr4',
      orderId: 'po3',
      type: 'quality_check',
      title: '质检完成',
      description: '订单 PO-2024-003 全部质检项通过，可进入打包环节',
      operatorName: '李师傅',
      operatorRole: 'producer',
      timestamp: '2024-01-21 09:45',
      statusBefore: 'quality_check',
      statusAfter: 'pass',
      offline: false
    },
    {
      id: 'pr5',
      orderId: 'po3',
      type: 'packaging_create',
      title: '创建打包单',
      description: '项目专员王专员为订单 PO-2024-003 创建打包单',
      operatorName: '王专员',
      operatorRole: 'project_manager',
      timestamp: '2024-01-21 10:00',
      statusBefore: 'quality_check',
      statusAfter: 'packaging',
      offline: false
    }
  ],
  offlineMode: false,
  lastSyncTime: new Date().toISOString()
};

export function useAppStore() {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    const stored = localStorage.getItem('sign-quality-app-state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState(prev => ({ ...prev, ...parsed }));
      } catch {
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sign-quality-app-state', JSON.stringify(state));
  }, [state]);

  const shipmentsWithRelations = useMemo(() => {
    return state.shipments.map(shipment => {
      const order = state.orders.find(o => o.id === shipment.productionOrderId);
      const inspection = state.qualityInspections.find(qi => qi.productionOrderId === shipment.productionOrderId);
      return {
        ...shipment,
        order: order!,
        qualityInspection: inspection!
      } as Shipment;
    });
  }, [state.shipments, state.orders, state.qualityInspections]);

  const getProcessRecordsByOrder = useCallback((orderId: string): ProcessRecord[] => {
    return state.processRecords
      .filter(r => r.orderId === orderId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [state.processRecords]);

  const addProcessRecord = useCallback((record: Omit<ProcessRecord, 'id' | 'timestamp' | 'offline'>) => {
    setState(prev => ({
      ...prev,
      processRecords: [
        {
          ...record,
          id: `pr${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          offline: prev.offlineMode
        },
        ...prev.processRecords
      ]
    }));
  }, []);

  const setCurrentUser = useCallback((user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: ProductionOrder['status']) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(order => order.id === orderId ? { ...order, status, updatedAt: new Date().toLocaleString() } : order)
    }));
  }, []);

  const updateQualityInspection = useCallback((inspectionId: string, updates: Partial<QualityInspection>) => {
    setState(prev => {
      const inspection = prev.qualityInspections.find(q => q.id === inspectionId);
      const oldResult = inspection?.overallResult;
      const newResult = updates.overallResult ?? oldResult;
      
      return {
        ...prev,
        qualityInspections: prev.qualityInspections.map(qi => qi.id === inspectionId ? { ...qi, ...updates, updatedAt: new Date().toLocaleString() } : qi),
        notifications: [
          ...prev.notifications,
          {
            id: `n${Date.now()}`,
            type: 'quality_update',
            title: '质检更新提醒',
            message: `订单 ${prev.qualityInspections.find(q => q.id === inspectionId)?.order.orderNo} 质检状态已更新`,
            read: false,
            targetRole: 'project_manager',
            createdAt: new Date().toLocaleString(),
            relatedOrderId: prev.qualityInspections.find(q => q.id === inspectionId)?.productionOrderId || ''
          }
        ],
        processRecords: [
          {
            id: `pr${Date.now()}`,
            orderId: prev.qualityInspections.find(q => q.id === inspectionId)?.productionOrderId || '',
            type: 'quality_update',
            title: '质检备注更新',
            description: updates.remarks || '质检备注已更新',
            operatorName: prev.currentUser.name,
            operatorRole: prev.currentUser.role,
            timestamp: new Date().toLocaleString(),
            statusBefore: oldResult,
            statusAfter: newResult,
            offline: prev.offlineMode
          },
          ...prev.processRecords
        ]
      };
    });
  }, []);

  const updateCheckItem = useCallback((inspectionId: string, itemId: string, result: 'pass' | 'fail' | 'pending', remark: string) => {
    setState(prev => {
      const inspection = prev.qualityInspections.find(qi => qi.id === inspectionId);
      const oldResult = inspection?.overallResult;
      const oldItemResult = inspection?.checkItems.find(i => i.id === itemId)?.result;
      
      return {
        ...prev,
        qualityInspections: prev.qualityInspections.map(qi => {
          if (qi.id !== inspectionId) return qi;
          const updatedItems = qi.checkItems.map(item => item.id === itemId ? { ...item, result, remark, checkedBy: prev.currentUser.name, checkedAt: new Date().toLocaleString() } : item);
          const allPassed = updatedItems.every(item => item.result === 'pass');
          const hasFail = updatedItems.some(item => item.result === 'fail');
          const overallResult = hasFail ? 'fail' : allPassed ? 'pass' : 'pending';
          const isFailChanged = result === 'fail' && oldItemResult !== 'fail';
          
          return {
            ...qi,
            checkItems: updatedItems,
            overallResult,
            revisionCount: isFailChanged ? qi.revisionCount + 1 : qi.revisionCount,
            updatedAt: new Date().toLocaleString()
          };
        }),
        processRecords: [
          {
            id: `pr${Date.now()}`,
            orderId: inspection?.productionOrderId || '',
            type: 'quality_update',
            title: '质检项更新',
            description: `${inspection?.checkItems.find(i => i.id === itemId)?.name}: ${oldItemResult === 'pass' ? '通过' : oldItemResult === 'fail' ? '未通过' : '待检查'} → ${result === 'pass' ? '通过' : result === 'fail' ? '未通过' : '待检查'}${remark ? ` (${remark})` : ''}`,
            operatorName: prev.currentUser.name,
            operatorRole: prev.currentUser.role,
            timestamp: new Date().toLocaleString(),
            statusBefore: oldResult,
            statusAfter: inspection?.checkItems.find(i => i.id === itemId)?.result,
            offline: prev.offlineMode
          },
          ...prev.processRecords
        ]
      };
    });
  }, []);

  const updatePackagingItem = useCallback((shipmentId: string, itemId: string, status: 'packed' | 'missing' | 'pending') => {
    setState(prev => {
      const shipment = prev.shipments.find(s => s.id === shipmentId);
      const oldStatus = shipment?.packagingItems.find(i => i.id === itemId)?.status;
      
      return {
        ...prev,
        shipments: prev.shipments.map(s => {
          if (s.id !== shipmentId) return s;
          const updatedItems = s.packagingItems.map(item => item.id === itemId ? { ...item, status } : item);
          const allPacked = updatedItems.every(item => item.status === 'packed');
          return {
            ...s,
            packagingItems: updatedItems,
            status: allPacked ? 'ready' : 'packaging'
          };
        }),
        processRecords: [
          {
            id: `pr${Date.now()}`,
            orderId: shipment?.productionOrderId || '',
            type: 'packaging_update',
            title: '打包项更新',
            description: `${shipment?.packagingItems.find(i => i.id === itemId)?.name}: ${oldStatus === 'packed' ? '已装' : oldStatus === 'missing' ? '缺失' : '待装'} → ${status === 'packed' ? '已装' : status === 'missing' ? '缺失' : '待装'}`,
            operatorName: prev.currentUser.name,
            operatorRole: prev.currentUser.role,
            timestamp: new Date().toLocaleString(),
            offline: prev.offlineMode
          },
          ...prev.processRecords
        ]
      };
    });
  }, []);

  const updateShipmentInfo = useCallback((shipmentId: string, info: Partial<Pick<Shipment, 'boxCount' | 'weight' | 'shippingMethod' | 'trackingNo'>>) => {
    setState(prev => {
      const shipment = prev.shipments.find(s => s.id === shipmentId);
      const changedFields = [];
      if (info.boxCount !== undefined && info.boxCount !== shipment?.boxCount) changedFields.push(`箱数: ${shipment?.boxCount} → ${info.boxCount}`);
      if (info.weight !== undefined && info.weight !== shipment?.weight) changedFields.push(`重量: ${shipment?.weight}kg → ${info.weight}kg`);
      if (info.shippingMethod !== shipment?.shippingMethod) changedFields.push(`物流公司: ${shipment?.shippingMethod || '未设置'} → ${info.shippingMethod || '未设置'}`);
      if (info.trackingNo !== shipment?.trackingNo) changedFields.push(`运单号: ${shipment?.trackingNo || '未设置'} → ${info.trackingNo || '未设置'}`);
      
      return {
        ...prev,
        shipments: prev.shipments.map(s => s.id === shipmentId ? { ...s, ...info } : s),
        processRecords: changedFields.length > 0 ? [
          {
            id: `pr${Date.now()}`,
            orderId: shipment?.productionOrderId || '',
            type: 'packaging_update',
            title: '物流信息更新',
            description: changedFields.join('; '),
            operatorName: prev.currentUser.name,
            operatorRole: prev.currentUser.role,
            timestamp: new Date().toLocaleString(),
            offline: prev.offlineMode
          },
          ...prev.processRecords
        ] : prev.processRecords
      };
    });
  }, []);

  const updateShipmentStatus = useCallback((shipmentId: string, status: Shipment['status']) => {
    setState(prev => {
      const shipment = prev.shipments.find(s => s.id === shipmentId);
      
      return {
        ...prev,
        shipments: prev.shipments.map(s => s.id === shipmentId ? { ...s, status, shippedAt: status === 'shipped' ? new Date().toLocaleString() : '' } : s),
        orders: prev.orders.map(o => {
          return o.id === shipment?.productionOrderId ? { ...o, status: status === 'shipped' ? 'shipped' : o.status } : o;
        }),
        notifications: status === 'shipped' ? [
          ...prev.notifications,
          {
            id: `n${Date.now()}`,
            type: 'shipping_update',
            title: '发货提醒',
            message: `订单 ${shipment?.productionOrderId} 已发货`,
            read: false,
            targetRole: 'installer',
            createdAt: new Date().toLocaleString(),
            relatedOrderId: shipment?.productionOrderId || ''
          }
        ] : prev.notifications,
        processRecords: [
          {
            id: `pr${Date.now()}`,
            orderId: shipment?.productionOrderId || '',
            type: 'shipment',
            title: '订单发货',
            description: `订单已发货，物流状态: ${status === 'shipped' ? '已发货' : status === 'delivered' ? '已送达' : '待发货'}`,
            operatorName: prev.currentUser.name,
            operatorRole: prev.currentUser.role,
            timestamp: new Date().toLocaleString(),
            statusBefore: shipment?.status,
            statusAfter: status,
            offline: prev.offlineMode
          },
          ...prev.processRecords
        ]
      };
    });
  }, []);

  const createShipment = useCallback((orderId: string) => {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    
    const newShipment: Omit<Shipment, 'order' | 'qualityInspection'> = {
      id: `s${Date.now()}`,
      productionOrderId: orderId,
      packagingItems: [
        { id: `pi${Date.now()}`, name: '主产品', quantity: order.quantity, status: 'pending' },
        { id: `pi${Date.now() + 1}`, name: '安装配件包', quantity: 1, status: 'pending' },
        { id: `pi${Date.now() + 2}`, name: '安装说明书', quantity: 1, status: 'pending' },
        { id: `pi${Date.now() + 3}`, name: '保修卡', quantity: 1, status: 'pending' }
      ],
      boxCount: 0,
      weight: 0,
      shippingMethod: '',
      trackingNo: '',
      shipper: state.currentUser.name,
      shippedAt: '',
      createdAt: new Date().toLocaleString(),
      status: 'packaging'
    };
    
    setState(prev => ({
      ...prev,
      shipments: [...prev.shipments, newShipment],
      orders: prev.orders.map(o => o.id === orderId ? { ...o, status: 'packaging' } : o),
      notifications: [
        ...prev.notifications,
        {
          id: `n${Date.now()}`,
          type: 'packaging_ready',
          title: '打包准备提醒',
          message: `订单 ${order.orderNo} 已创建打包单，请安排打包`,
          read: false,
          targetRole: 'producer',
          createdAt: new Date().toLocaleString(),
          relatedOrderId: orderId
        }
      ],
      processRecords: [
        {
          id: `pr${Date.now()}`,
          orderId: orderId,
          type: 'packaging_create',
          title: '创建打包单',
          description: `为订单 ${order.orderNo} 创建打包单，准备进行打包`,
          operatorName: prev.currentUser.name,
          operatorRole: prev.currentUser.role,
          timestamp: new Date().toLocaleString(),
          statusBefore: 'quality_check',
          statusAfter: 'packaging',
          offline: prev.offlineMode
        },
        ...prev.processRecords
      ]
    }));
  }, [state.orders, state.currentUser.name]);

  const markNotificationRead = useCallback((notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === notificationId ? { ...n, read: true } : n)
    }));
  }, []);

  const toggleOfflineMode = useCallback(() => {
    setState(prev => ({ ...prev, offlineMode: !prev.offlineMode }));
  }, []);

  const getNotificationsByRole = useCallback((role: Role): Notification[] => {
    return state.notifications.filter(n => {
      if (role === 'admin') return true;
      return n.targetRole === role || n.targetRole === 'project_manager';
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.notifications]);

  return {
    ...state,
    shipments: shipmentsWithRelations,
    getProcessRecordsByOrder,
    addProcessRecord,
    setCurrentUser,
    updateOrderStatus,
    updateQualityInspection,
    updateCheckItem,
    updatePackagingItem,
    updateShipmentInfo,
    updateShipmentStatus,
    createShipment,
    markNotificationRead,
    toggleOfflineMode,
    getNotificationsByRole,
    availableUsers: mockUsers
  };
}