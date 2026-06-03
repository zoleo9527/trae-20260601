import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { ORDER_STATUS } from '../utils/constants.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderNo: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    comment: '订单号',
  },
  userId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '用户ID',
  },
  userName: {
    type: DataTypes.STRING(50),
    comment: '用户姓名',
  },
  userPhone: {
    type: DataTypes.STRING(20),
    comment: '用户电话',
  },
  cabinetId: {
    type: DataTypes.INTEGER,
    comment: '目标柜机ID',
  },
  cellId: {
    type: DataTypes.INTEGER,
    comment: '分配格口ID',
  },
  status: {
    type: DataTypes.ENUM(...Object.values(ORDER_STATUS)),
    defaultValue: ORDER_STATUS.CREATED,
    comment: '订单状态',
  },
  laundryType: {
    type: DataTypes.STRING(50),
    comment: '洗衣类型',
  },
  weight: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '重量(kg)',
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '金额',
  },
  assignedAt: {
    type: DataTypes.DATE,
    comment: '分配格口时间',
  },
  deliveredAt: {
    type: DataTypes.DATE,
    comment: '配送员投放时间',
  },
  pickedUpAt: {
    type: DataTypes.DATE,
    comment: '用户取件时间',
  },
  timeoutAt: {
    type: DataTypes.DATE,
    comment: '超时时间',
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注',
  },
}, {
  tableName: 'orders',
  timestamps: true,
  version: true,
  indexes: [
    {
      unique: true,
      fields: ['orderNo'],
    },
    {
      fields: ['userId', 'status'],
    },
    {
      fields: ['cabinetId', 'status'],
    },
  ],
});

export default Order;
