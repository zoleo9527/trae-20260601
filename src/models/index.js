import sequelize from '../config/database.js';
import Cabinet from './Cabinet.js';
import Cell from './Cell.js';
import Order from './Order.js';
import DeliveryRecord from './DeliveryRecord.js';
import PickupCode from './PickupCode.js';
import TimeoutReminder from './TimeoutReminder.js';
import RemoteOpenRequest from './RemoteOpenRequest.js';
import ExceptionLog from './ExceptionLog.js';

Cabinet.hasMany(Cell, { foreignKey: 'cabinetId', as: 'cells' });
Cell.belongsTo(Cabinet, { foreignKey: 'cabinetId', as: 'cabinet' });

Cabinet.hasMany(Order, { foreignKey: 'cabinetId', as: 'orders' });
Order.belongsTo(Cabinet, { foreignKey: 'cabinetId', as: 'cabinet' });

Cell.hasMany(Order, { foreignKey: 'cellId', as: 'orders' });
Order.belongsTo(Cell, { foreignKey: 'cellId', as: 'cell' });

Order.hasOne(DeliveryRecord, { foreignKey: 'orderId', as: 'deliveryRecord' });
DeliveryRecord.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Order.hasMany(PickupCode, { foreignKey: 'orderId', as: 'pickupCodes' });
PickupCode.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Cell.hasMany(PickupCode, { foreignKey: 'cellId', as: 'pickupCodes' });
PickupCode.belongsTo(Cell, { foreignKey: 'cellId', as: 'cell' });

Order.hasMany(TimeoutReminder, { foreignKey: 'orderId', as: 'timeoutReminders' });
TimeoutReminder.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Order.hasMany(RemoteOpenRequest, { foreignKey: 'orderId', as: 'remoteOpenRequests' });
RemoteOpenRequest.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Cell.hasMany(RemoteOpenRequest, { foreignKey: 'cellId', as: 'remoteOpenRequests' });
RemoteOpenRequest.belongsTo(Cell, { foreignKey: 'cellId', as: 'cell' });

Order.hasMany(ExceptionLog, { foreignKey: 'orderId', as: 'exceptionLogs' });
ExceptionLog.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Cell.hasMany(ExceptionLog, { foreignKey: 'cellId', as: 'exceptionLogs' });
ExceptionLog.belongsTo(Cell, { foreignKey: 'cellId', as: 'cell' });

Cabinet.hasMany(ExceptionLog, { foreignKey: 'cabinetId', as: 'exceptionLogs' });
ExceptionLog.belongsTo(Cabinet, { foreignKey: 'cabinetId', as: 'cabinet' });

export {
  sequelize,
  Cabinet,
  Cell,
  Order,
  DeliveryRecord,
  PickupCode,
  TimeoutReminder,
  RemoteOpenRequest,
  ExceptionLog,
};
