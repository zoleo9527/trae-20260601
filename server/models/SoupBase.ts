import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class SoupBase extends Model {
  public id!: string;
  public name!: string;
  public type!: 'spicy' | 'mild' | 'tomato' | 'bone';
  public stock!: number;
  public minStock!: number;
  public unit!: string;
  public status!: 'pending' | 'preparing' | 'ready' | 'delivered';
  public responsiblePerson!: string;
  public notes!: string;
  public lastPreparedAt?: Date;
  public prepareCount!: number;
  public refundReason?: string;
  public supplementNotes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SoupBase.init(
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
    type: {
      type: DataTypes.ENUM('spicy', 'mild', 'tomato', 'bone'),
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    minStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '份',
    },
    status: {
      type: DataTypes.ENUM('pending', 'preparing', 'ready', 'delivered'),
      allowNull: false,
      defaultValue: 'pending',
    },
    responsiblePerson: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    lastPreparedAt: {
      type: DataTypes.DATE,
    },
    prepareCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    refundReason: {
      type: DataTypes.TEXT,
    },
    supplementNotes: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    modelName: 'SoupBase',
  }
);

export default SoupBase;
