import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import ClaimStatus from './ClaimStatus';

class WarrantyClaim extends Model {
  public id!: number;
  public tireId!: number;
  public customerName!: string;
  public customerPhone!: string;
  public issueDescription!: string;
  public status!: ClaimStatus;
  public storeId!: number;
  public createdBy!: number;
  public technicianId!: number | null;
  public managerId!: number | null;
  public technicianComment!: string;
  public managerComment!: string;
  public isRisk!: boolean;
  public riskReason!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public resolvedAt!: Date | null;
}

WarrantyClaim.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tireId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    customerName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    customerPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    issueDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ClaimStatus)),
      allowNull: false,
      defaultValue: ClaimStatus.PENDING,
    },
    storeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    technicianId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    managerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    technicianComment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    managerComment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isRisk: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    riskReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'WarrantyClaim',
    tableName: 'warranty_claims',
  }
);

export default WarrantyClaim;