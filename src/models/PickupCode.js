import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { PICKUP_CODE_STATUS } from '../utils/constants.js';

const PickupCode = sequelize.define('PickupCode', {
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
    comment: '柜机ID',
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '取件码',
  },
  status: {
    type: DataTypes.ENUM(...Object.values(PICKUP_CODE_STATUS)),
    defaultValue: PICKUP_CODE_STATUS.ACTIVE,
    comment: '取件码状态',
  },
  generatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '生成时间',
  },
  expiredAt: {
    type: DataTypes.DATE,
    comment: '过期时间',
  },
  usedAt: {
    type: DataTypes.DATE,
    comment: '使用时间',
  },
  usedBy: {
    type: DataTypes.STRING(50),
    comment: '使用人',
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注',
  },
}, {
  tableName: 'pickup_codes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['cellId', 'code', 'status'],
    },
  ],
});

export default PickupCode;
