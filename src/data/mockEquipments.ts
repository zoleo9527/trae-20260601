import { Equipment } from '@/types';

export const mockEquipments: Equipment[] = [
  {
    id: 'eq-001',
    name: '挖掘机',
    model: '卡特彼勒320D',
    plateNumber: '沪A·12345',
    dailyRate: 1200,
    status: 'in_use',
  },
  {
    id: 'eq-002',
    name: '装载机',
    model: '柳工CLG856H',
    plateNumber: '沪B·67890',
    dailyRate: 800,
    status: 'in_use',
  },
  {
    id: 'eq-003',
    name: '压路机',
    model: '徐工XS263J',
    plateNumber: '沪C·11111',
    dailyRate: 900,
    status: 'repairing',
  },
  {
    id: 'eq-004',
    name: '吊车',
    model: '三一STC250T',
    plateNumber: '沪D·22222',
    dailyRate: 2500,
    status: 'available',
  },
  {
    id: 'eq-005',
    name: '推土机',
    model: '山推SD22',
    plateNumber: '沪E·33333',
    dailyRate: 1500,
    status: 'in_use',
  },
  {
    id: 'eq-006',
    name: '摊铺机',
    model: '沃尔沃ABG8820',
    plateNumber: '沪F·44444',
    dailyRate: 3000,
    status: 'available',
  },
];
