import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DeliveryRecord = sequelize.define('DeliveryRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '订单ID',
  },
  cellId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '格口ID',
  },
  cabinetId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '柜机ID',
  },
  deliveryStaffId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '配送员ID',
  },
  deliveryStaffName: {
    type: DataTypes.STRING(50),
    comment: '配送员姓名',
  },
  deliveryTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '投放时间',
  },
  itemCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '物品数量',
  },
  photoUrl: {
    type: DataTypes.STRING(255),
    comment: '照片URL',
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注',
  },
}, {
  tableName: 'delivery_records',
  timestamps: true,
});

export default DeliveryRecord;
