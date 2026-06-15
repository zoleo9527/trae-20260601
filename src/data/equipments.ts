import { Equipment } from '@/types';

export const equipments: Equipment[] = [
  {
    id: 'e001',
    name: '三一挖掘机',
    type: '挖掘机',
    model: 'SY215C',
    plateNumber: '京A·12345',
    workHours: 3256,
    status: 'rented',
  },
  {
    id: 'e002',
    name: '徐工装载机',
    type: '装载机',
    model: 'LW500KV',
    plateNumber: '京B·67890',
    workHours: 1890,
    status: 'available',
  },
  {
    id: 'e003',
    name: '中联重科塔吊',
    type: '塔式起重机',
    model: 'TC6012',
    plateNumber: '京C·11111',
    workHours: 5620,
    status: 'rented',
  },
  {
    id: 'e004',
    name: '山推推土机',
    type: '推土机',
    model: 'SD22',
    plateNumber: '京D·22222',
    workHours: 4100,
    status: 'maintenance',
  },
  {
    id: 'e005',
    name: '日立挖掘机',
    type: '挖掘机',
    model: 'ZX200',
    plateNumber: '京E·33333',
    workHours: 2780,
    status: 'available',
  },
  {
    id: 'e006',
    name: '柳工压路机',
    type: '压路机',
    model: 'CLG6622E',
    plateNumber: '京F·44444',
    workHours: 1560,
    status: 'broken',
  },
];

export const equipmentTypes = ['挖掘机', '装载机', '塔式起重机', '推土机', '压路机'];
