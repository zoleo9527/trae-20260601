import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import SoldOut from './SoldOut';

class SoldOutHistory extends Model {
  public id!: string;
  public soldOutId!: string;
  public action!: 'reported' | 'confirmed' | 'resolved' | 'updated';
  public actor!: string;
  public description!: string;
  public readonly timestamp!: Date;
}

SoldOutHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    soldOutId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: SoldOut,
        key: 'id',
      },
    },
    action: {
      type: DataTypes.ENUM('reported', 'confirmed', 'resolved', 'updated'),
      allowNull: false,
    },
    actor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'SoldOutHistory',
  }
);

SoldOut.hasMany(SoldOutHistory, { foreignKey: 'soldOutId', as: 'history' });
SoldOutHistory.belongsTo(SoldOut, { foreignKey: 'soldOutId' });

export default SoldOutHistory;
