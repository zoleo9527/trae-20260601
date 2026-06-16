import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class TodoItem extends Model {
  public id!: string;
  public title!: string;
  public type!: 'soupBase' | 'soldOut' | 'order';
  public targetId!: string;
  public targetName!: string;
  public assignee!: string;
  public assigneeRole!: string;
  public priority!: 'high' | 'medium' | 'low';
  public completed!: boolean;
  public readonly createdAt!: Date;
  public readonly completedAt?: Date;
}

TodoItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('soupBase', 'soldOut', 'order'),
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
    assignee: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    assigneeRole: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('high', 'medium', 'low'),
      allowNull: false,
      defaultValue: 'medium',
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: 'TodoItem',
  }
);

export default TodoItem;
