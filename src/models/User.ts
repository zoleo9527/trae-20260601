import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import Role from './Role';

class User extends Model {
  public id!: number;
  public username!: string;
  public password!: string;
  public realName!: string;
  public role!: Role;
  public storeId!: number;
  public phone!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    realName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(Role)),
      allowNull: false,
    },
    storeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  }
);

export default User;