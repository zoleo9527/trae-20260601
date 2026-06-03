import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { REMOTE_OPEN_STATUS } from '../utils/constants.js';

const RemoteOpenRequest = sequelize.define('RemoteOpenRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    comment: '关联订单ID',
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
  applicantId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '申请人ID',
  },
  applicantName: {
    type: DataTypes.STRING(50),
    comment: '申请人姓名',
  },
  applicantType: {
    type: DataTypes.ENUM('user', 'delivery', 'customer_service'),
    defaultValue: 'user',
    comment: '申请人类型',
  },
  reason: {
    type: DataTypes.TEXT,
    comment: '申请原因',
  },
  status: {
    type: DataTypes.ENUM(...Object.values(REMOTE_OPEN_STATUS)),
    defaultValue: REMOTE_OPEN_STATUS.PENDING,
    comment: '申请状态',
  },
  approverId: {
    type: DataTypes.STRING(50),
    comment: '审批人ID',
  },
  approverName: {
    type: DataTypes.STRING(50),
    comment: '审批人姓名',
  },
  approvedAt: {
    type: DataTypes.DATE,
    comment: '审批时间',
  },
  approvalRemark: {
    type: DataTypes.TEXT,
    comment: '审批备注',
  },
  executedAt: {
    type: DataTypes.DATE,
    comment: '执行时间',
  },
  executionResult: {
    type: DataTypes.TEXT,
    comment: '执行结果',
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注',
  },
}, {
  tableName: 'remote_open_requests',
  timestamps: true,
});

export default RemoteOpenRequest;
