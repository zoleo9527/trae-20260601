import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { CELL_STATUS } from '../utils/constants.js';

const Cell = sequelize.define('Cell', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cellNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '格口编号',
  },
  cabinetId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '所属柜机ID',
  },
  status: {
    type: DataTypes.ENUM(...Object.values(CELL_STATUS)),
    defaultValue: CELL_STATUS.AVAILABLE,
    comment: '格口状态',
  },
  size: {
    type: DataTypes.ENUM('small', 'medium', 'large'),
    defaultValue: 'medium',
    comment: '格口尺寸',
  },
  currentOrderId: {
    type: DataTypes.INTEGER,
    comment: '当前占用订单ID',
  },
  lockStatus: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '锁状态 true-已锁 false-未锁',
  },
  doorStatus: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '门状态 true-已关 false-已开',
  },
  lastStatusChange: {
    type: DataTypes.DATE,
    comment: '最后状态变更时间',
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注',
  },
}, {
  tableName: 'cells',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['cabinetId', 'cellNo'],
    },
  ],
});

export default Cell;
