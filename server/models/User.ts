import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import type { Role } from '../../src/types';

class User extends Model {
  public id!: string;
  public name!: string;
  public role!: Role;
  public phone!: string;
  public avatar?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('前厅经理', '后厨主管', '收银', '管理员'),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    avatar: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: 'User',
  }
);

export default User;
