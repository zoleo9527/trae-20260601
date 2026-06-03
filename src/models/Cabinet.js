import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { CABINET_STATUS } from '../utils/constants.js';

const Cabinet = sequelize.define('Cabinet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cabinetNo: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    comment: '柜机编号',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '柜机名称',
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '安装位置',
  },
  status: {
    type: DataTypes.ENUM(...Object.values(CABINET_STATUS)),
    defaultValue: CABINET_STATUS.OFFLINE,
    comment: '柜机状态',
  },
  totalCells: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总格口数',
  },
  availableCells: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '可用格口数',
  },
  lastHeartbeat: {
    type: DataTypes.DATE,
    comment: '最后心跳时间',
  },
  ipAddress: {
    type: DataTypes.STRING(50),
    comment: 'IP地址',
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注',
  },
}, {
  tableName: 'cabinets',
  timestamps: true,
});

export default Cabinet;
