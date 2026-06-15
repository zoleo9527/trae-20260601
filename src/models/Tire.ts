import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class Tire extends Model {
  public id!: number;
  public brand!: string;
  public model!: string;
  public size!: string;
  public serialNumber!: string;
  public productionDate!: Date;
  public installationDate!: Date;
  public vehiclePlate!: string;
  public storeId!: number;
  public warrantyEndDate!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Tire.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    brand: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    size: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    serialNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    productionDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    installationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    vehiclePlate: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    storeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    warrantyEndDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Tire',
    tableName: 'tires',
  }
);

export default Tire;