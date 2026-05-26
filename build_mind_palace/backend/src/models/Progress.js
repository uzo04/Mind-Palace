import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Progress = sequelize.define(
  "Progress",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    percent: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },

    totalItems: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    completedItems: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    visitedLocationIds: {
      type: DataTypes.JSON,
      defaultValue: [],
    },

    currentLocationId: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    bestScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    lastScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    quizHistory: {
      type: DataTypes.JSON,
      defaultValue: [],
    },

    studyHistory: {
      type: DataTypes.JSON,
      defaultValue: [],
    },

    lastStudiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    spaceId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "spaceId"],
      },
    ],
  }
);

export default Progress;
