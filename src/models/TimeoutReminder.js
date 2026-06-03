import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { TIMEOUT_REMINDER_STATUS } from '../utils/constants.js';

const TimeoutReminder = sequelize.define('TimeoutReminder', {
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
  userId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '用户ID',
  },
  cabinetId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '柜机ID',
  },
  cellId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '格口ID',
  },
  reminderType: {
    type: DataTypes.ENUM('sms', 'push', 'wechat', 'call'),
    defaultValue: 'sms',
    comment: '提醒方式',
  },
  reminderCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '第几次提醒',
  },
  status: {
    type: DataTypes.ENUM(...Object.values(TIMEOUT_REMINDER_STATUS)),
    defaultValue: TIMEOUT_REMINDER_STATUS.PENDING,
    comment: '提醒状态',
  },
  timeoutHours: {
    type: DataTypes.INTEGER,
    comment: '超时小时数',
  },
  sentAt: {
    type: DataTypes.DATE,
    comment: '发送时间',
  },
  acknowledgedAt: {
    type: DataTypes.DATE,
    comment: '确认时间',
  },
  content: {
    type: DataTypes.TEXT,
    comment: '提醒内容',
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注',
  },
}, {
  tableName: 'timeout_reminders',
  timestamps: true,
});

export default TimeoutReminder;
