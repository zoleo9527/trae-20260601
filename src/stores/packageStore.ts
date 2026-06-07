import { create } from 'zustand';
import { Package, PackageOrder, PackageOrderStatus, DrinkGift } from '../types';
import { storage, generateId } from '../utils/storage';
import { mockPackages, mockPackageOrders } from '../data/mockData';
import { useAuditStore } from './auditStore';

interface PackageStore {
  packages: Package[];
  packageOrders: PackageOrder[];
  addPackage: (pkg: Omit<Package, 'id'>) => void;
  updatePackage: (id: string, updates: Partial<Package>) => void;
  addPackageOrder: (order: Omit<PackageOrder, 'id' | 'createdAt'>) => string;
  updatePackageOrder: (id: string, updates: Partial<PackageOrder>) => void;
  updatePackageOrderStatus: (id: string, status: PackageOrderStatus, note?: string) => void;
  getPackageById: (id: string) => Package | undefined;
  getPackageOrderById: (id: string) => PackageOrder | undefined;
  getPackageOrdersByBooking: (bookingId: string) => PackageOrder | undefined;
  validateDrinkGifts: (packageId: string, gifts: DrinkGift[]) => { valid: boolean; issues: string[] };
}

const initialPackages = storage.get<Package[]>('packages', mockPackages);
const initialOrders = storage.get<PackageOrder[]>('package_orders', mockPackageOrders);

export const usePackageStore = create<PackageStore>((set, get) => ({
  packages: initialPackages,
  packageOrders: initialOrders,
  
  addPackage: (pkgData) => {
    const pkg: Package = {
      ...pkgData,
      id: generateId(),
    };
    const packages = [...get().packages, pkg];
    set({ packages });
    storage.set('packages', packages);
    
    useAuditStore.getState().addLog(
      'package',
      pkg.id,
      'create',
      undefined,
      pkg as unknown as Record<string, unknown>,
      '新增套餐'
    );
  },
  
  updatePackage: (id, updates) => {
    const packages = get().packages.map((p) => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        
        useAuditStore.getState().addLog(
          'package',
          id,
          'update',
          p as unknown as Record<string, unknown>,
          updated as unknown as Record<string, unknown>
        );
        
        return updated;
      }
      return p;
    });
    set({ packages });
    storage.set('packages', packages);
  },
  
  addPackageOrder: (orderData) => {
    const order: PackageOrder = {
      ...orderData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const orders = [...get().packageOrders, order];
    set({ packageOrders: orders });
    storage.set('package_orders', orders);
    
    useAuditStore.getState().addLog(
      'package_order',
      order.id,
      'create',
      undefined,
      order as unknown as Record<string, unknown>,
      '创建套餐订单'
    );
    
    return order.id;
  },
  
  updatePackageOrder: (id, updates) => {
    const orders = get().packageOrders.map((o) => {
      if (o.id === id) {
        const updated = { ...o, ...updates };
        
        useAuditStore.getState().addLog(
          'package_order',
          id,
          'update',
          o as unknown as Record<string, unknown>,
          updated as unknown as Record<string, unknown>
        );
        
        return updated;
      }
      return o;
    });
    set({ packageOrders: orders });
    storage.set('package_orders', orders);
  },
  
  updatePackageOrderStatus: (id, status, note) => {
    const orders = get().packageOrders.map((o) => {
      if (o.id === id) {
        const beforeData = { status: o.status };
        const updated = { ...o, status };
        
        useAuditStore.getState().addLog(
          'package_order',
          id,
          'status_change',
          beforeData,
          { status },
          note
        );
        
        return updated;
      }
      return o;
    });
    set({ packageOrders: orders });
    storage.set('package_orders', orders);
  },
  
  getPackageById: (id) => {
    return get().packages.find((p) => p.id === id);
  },
  
  getPackageOrderById: (id) => {
    return get().packageOrders.find((o) => o.id === id);
  },
  
  getPackageOrdersByBooking: (bookingId) => {
    return get().packageOrders.find((o) => o.bookingId === bookingId);
  },
  
  validateDrinkGifts: (packageId, gifts) => {
    const pkg = get().getPackageById(packageId);
    if (!pkg) return { valid: false, issues: ['套餐不存在'] };
    
    const issues: string[] = [];
    const standardGifts = pkg.drinkGifts;
    
    gifts.forEach((gift) => {
      const standard = standardGifts.find((g) => g.name === gift.name);
      if (!standard) {
        issues.push(`${gift.name} 不在套餐赠送范围内`);
      } else if (gift.quantity > standard.quantity) {
        issues.push(`${gift.name} 赠送数量(${gift.quantity})超出标准(${standard.quantity})`);
      }
    });
    
    return { valid: issues.length === 0, issues };
  },
}));
