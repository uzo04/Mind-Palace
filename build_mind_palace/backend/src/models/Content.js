import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Content = sequelize.define(
  "Content",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    type: {
      type: DataTypes.ENUM("text", "image", "formula"),
      allowNull: false,
    },

    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    locationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

export default Content;