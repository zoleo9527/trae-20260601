import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class Store extends Model {
  public id!: number;
  public name!: string;
  public address!: string;
  public phone!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Store.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Store',
    tableName: 'stores',
  }
);

export default Store;