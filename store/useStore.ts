import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProductionOrder, QualityInspection, Shipment, Notification, User, Role } from '../types';
import { mockOrders, mockQualityInspections, mockShipments, mockNotifications, mockUsers } from '../data/mockData';

interface AppState {
  currentUser: User;
  orders: ProductionOrder[];
  qualityInspections: QualityInspection[];
  shipments: Omit<Shipment, 'order' | 'qualityInspection'>[];
  notifications: Notification[];
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
    setState(prev => ({
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
      ]
    }));
  }, []);

  const updateCheckItem = useCallback((inspectionId: string, itemId: string, result: 'pass' | 'fail' | 'pending', remark: string) => {
    setState(prev => ({
      ...prev,
      qualityInspections: prev.qualityInspections.map(qi => {
        if (qi.id !== inspectionId) return qi;
        const updatedItems = qi.checkItems.map(item => item.id === itemId ? { ...item, result, remark, checkedBy: prev.currentUser.name, checkedAt: new Date().toLocaleString() } : item);
        const allPassed = updatedItems.every(item => item.result === 'pass');
        const hasFail = updatedItems.some(item => item.result === 'fail');
        const overallResult = hasFail ? 'fail' : allPassed ? 'pass' : 'pending';
        const isFailChanged = result === 'fail' && qi.checkItems.find(i => i.id === itemId)?.result !== 'fail';
        
        return {
          ...qi,
          checkItems: updatedItems,
          overallResult,
          revisionCount: isFailChanged ? qi.revisionCount + 1 : qi.revisionCount,
          updatedAt: new Date().toLocaleString()
        };
      })
    }));
  }, []);

  const updatePackagingItem = useCallback((shipmentId: string, itemId: string, status: 'packed' | 'missing' | 'pending') => {
    setState(prev => ({
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
      })
    }));
  }, []);

  const updateShipmentInfo = useCallback((shipmentId: string, info: Partial<Pick<Shipment, 'boxCount' | 'weight' | 'shippingMethod' | 'trackingNo'>>) => {
    setState(prev => ({
      ...prev,
      shipments: prev.shipments.map(s => s.id === shipmentId ? { ...s, ...info } : s)
    }));
  }, []);

  const updateShipmentStatus = useCallback((shipmentId: string, status: Shipment['status']) => {
    setState(prev => ({
      ...prev,
      shipments: prev.shipments.map(s => s.id === shipmentId ? { ...s, status, shippedAt: status === 'shipped' ? new Date().toLocaleString() : '' } : s),
      orders: prev.orders.map(o => {
        const shipment = prev.shipments.find(s => s.id === shipmentId);
        return o.id === shipment?.productionOrderId ? { ...o, status: status === 'shipped' ? 'shipped' : o.status } : o;
      }),
      notifications: status === 'shipped' ? [
        ...prev.notifications,
        {
          id: `n${Date.now()}`,
          type: 'shipping_update',
          title: '发货提醒',
          message: `订单 ${prev.shipments.find(s => s.id === shipmentId)?.productionOrderId} 已发货`,
          read: false,
          targetRole: 'installer',
          createdAt: new Date().toLocaleString(),
          relatedOrderId: prev.shipments.find(s => s.id === shipmentId)?.productionOrderId || ''
        }
      ] : prev.notifications
    }));
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