import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import CompensationStatus from './CompensationStatus';

export type CompensationType = 'REFUND' | 'REPLACEMENT' | 'DISCOUNT' | 'OTHER';

export const CompensationTypeDescription: Record<CompensationType, string> = {
  REFUND: '现金退款',
  REPLACEMENT: '更换轮胎',
  DISCOUNT: '折扣优惠',
  OTHER: '其他补偿'
};

class Compensation extends Model {
  public id!: number;
  public claimId!: number;
  public type!: CompensationType;
  public amount!: number;
  public description!: string;
  public status!: CompensationStatus;
  public approvedBy!: number | null;
  public paidBy!: number | null;
  public approvalComment!: string;
  public paymentDate!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Compensation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    claimId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('REFUND', 'REPLACEMENT', 'DISCOUNT', 'OTHER'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(CompensationStatus)),
      allowNull: false,
      defaultValue: CompensationStatus.PENDING,
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    paidBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    approvalComment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Compensation',
    tableName: 'compensations',
  }
);

export default Compensation;