import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Space = sequelize.define(
  "Space",
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

    description: {
      type: DataTypes.TEXT,
    },

    coverImage: {
      type: DataTypes.STRING,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

export default Space;