import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class AuditLog extends Model {
  public id!: string;
  public action!: 'create' | 'update' | 'delete' | 'resolve' | 'confirm';
  public targetType!: 'soupBase' | 'soldOut' | 'order' | 'user';
  public targetId!: string;
  public targetName!: string;
  public actor!: string;
  public actorRole!: string;
  public details!: string;
  public ipAddress?: string;
  public readonly timestamp!: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    action: {
      type: DataTypes.ENUM('create', 'update', 'delete', 'resolve', 'confirm'),
      allowNull: false,
    },
    targetType: {
      type: DataTypes.ENUM('soupBase', 'soldOut', 'order', 'user'),
      allowNull: false,
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    targetName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    actor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    actorRole: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    details: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'AuditLog',
  }
);

export default AuditLog;
