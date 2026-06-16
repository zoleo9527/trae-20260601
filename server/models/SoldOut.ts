import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class SoldOut extends Model {
  public id!: string;
  public itemName!: string;
  public category!: 'soupBase' | 'dish' | 'drink';
  public reason!: string;
  public status!: 'active' | 'resolved';
  public reportedBy!: string;
  public resolvedBy?: string;
  public notes!: string;
  public refundReason?: string;
  public supplementNotes?: string;
  public relatedSoupBaseId?: string;
  public readonly reportedAt!: Date;
  public readonly resolvedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SoldOut.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('soupBase', 'dish', 'drink'),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'resolved'),
      allowNull: false,
      defaultValue: 'active',
    },
    reportedBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resolvedBy: {
      type: DataTypes.STRING,
    },
    notes: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    refundReason: {
      type: DataTypes.TEXT,
    },
    supplementNotes: {
      type: DataTypes.TEXT,
    },
    relatedSoupBaseId: {
      type: DataTypes.UUID,
    },
    reportedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    resolvedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: 'SoldOut',
  }
);

export default SoldOut;
