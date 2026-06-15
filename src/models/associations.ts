import { User, WarrantyClaim, Compensation, Tire, Store } from './index';

User.belongsTo(Store, { foreignKey: 'storeId' });
Store.hasMany(User, { foreignKey: 'storeId' });

Tire.belongsTo(Store, { foreignKey: 'storeId' });
Store.hasMany(Tire, { foreignKey: 'storeId' });

WarrantyClaim.belongsTo(Tire, { foreignKey: 'tireId' });
Tire.hasOne(WarrantyClaim, { foreignKey: 'tireId' });

WarrantyClaim.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
WarrantyClaim.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });
WarrantyClaim.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });
WarrantyClaim.belongsTo(Store, { foreignKey: 'storeId' });

Compensation.belongsTo(WarrantyClaim, { foreignKey: 'claimId' });
WarrantyClaim.hasOne(Compensation, { foreignKey: 'claimId' });

Compensation.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
Compensation.belongsTo(User, { foreignKey: 'paidBy', as: 'payer' });

export { User, WarrantyClaim, Compensation, Tire, Store };