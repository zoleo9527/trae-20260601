import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { EXCEPTION_TYPE } from '../utils/constants.js';

const ExceptionLog = sequelize.define('ExceptionLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  exceptionType: {
    type: DataTypes.ENUM(...Object.values(EXCEPTION_TYPE)),
    allowNull: false,
    comment: '异常类型',
  },
  cabinetId: {
    type: DataTypes.INTEGER,
    comment: '柜机ID',
  },
  cellId: {
    type: DataTypes.INTEGER,
    comment: '格口ID',
  },
  orderId: {
    type: DataTypes.INTEGER,
    comment: '订单ID',
  },
  userId: {
    type: DataTypes.STRING(50),
    comment: '相关用户ID',
  },
  operatorId: {
    type: DataTypes.STRING(50),
    comment: '操作人ID',
  },
  description: {
    type: DataTypes.TEXT,
    comment: '异常描述',
  },
  detail: {
    type: DataTypes.TEXT,
    comment: '详细信息',
  },
  handled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已处理',
  },
  handledBy: {
    type: DataTypes.STRING(50),
    comment: '处理人',
  },
  handledAt: {
    type: DataTypes.DATE,
    comment: '处理时间',
  },
  handleResult: {
    type: DataTypes.TEXT,
    comment: '处理结果',
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注',
  },
}, {
  tableName: 'exception_logs',
  timestamps: true,
});

export default ExceptionLog;
