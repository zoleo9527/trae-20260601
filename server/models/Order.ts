import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import SoupBase from './SoupBase';

class Order extends Model {
  public id!: string;
  public tableNumber!: string;
  public customerName!: string;
  public phone?: string;
  public soupBaseId!: string;
  public soupBaseName!: string;
  public soupBaseType!: 'spicy' | 'mild' | 'tomato' | 'bone';
  public dishes!: string;
  public totalAmount!: number;
  public paidAmount!: number;
  public status!: 'pending' | 'confirmed' | 'served' | 'completed' | 'cancelled';
  public isGroupBuy!: boolean;
  public groupBuyCode?: string;
  public groupBuyVerified!: boolean;
  public createdBy!: string;
  public notes!: string;
  public refundReason?: string;
  public supplementNotes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly servedAt?: Date;
  public readonly completedAt?: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tableNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
    },
    soupBaseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: SoupBase,
        key: 'id',
      },
    },
    soupBaseName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    soupBaseType: {
      type: DataTypes.ENUM('spicy', 'mild', 'tomato', 'bone'),
      allowNull: false,
    },
    dishes: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'served', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    isGroupBuy: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    groupBuyCode: {
      type: DataTypes.STRING,
    },
    groupBuyVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false,
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
    servedAt: {
      type: DataTypes.DATE,
    },
    completedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: 'Order',
  }
);

Order.belongsTo(SoupBase, { foreignKey: 'soupBaseId', as: 'soupBase' });

export default Order;
