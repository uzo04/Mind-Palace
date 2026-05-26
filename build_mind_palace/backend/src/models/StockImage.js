import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const StockImage = sequelize.define("StockImage", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  title: {
    type: DataTypes.STRING,
  },

  category: {
    type: DataTypes.STRING,
  },
});

export default StockImage;
