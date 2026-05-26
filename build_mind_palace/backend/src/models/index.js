import sequelize from "../config/db.js";

import User from "./User.js";
import Space from "./Space.js";
import Location from "./Location.js";
import Content from "./Content.js";
import Progress from "./Progress.js";
import StockImage from "./StockImage.js";


User.hasMany(Space, { foreignKey: "userId", onDelete: "CASCADE" });
Space.belongsTo(User, { foreignKey: "userId" });

Space.hasMany(Location, { foreignKey: "spaceId", onDelete: "CASCADE" });
Location.belongsTo(Space, { foreignKey: "spaceId" });

Location.hasMany(Content, { foreignKey: "locationId", onDelete: "CASCADE" });
Content.belongsTo(Location, { foreignKey: "locationId" });

User.hasMany(Progress, { foreignKey: "userId", onDelete: "CASCADE" });
Progress.belongsTo(User, { foreignKey: "userId" });

Space.hasMany(Progress, { foreignKey: "spaceId", onDelete: "CASCADE" });
Progress.belongsTo(Space, { foreignKey: "spaceId" });

export {
  sequelize,
  User,
  Space,
  Location,
  Content,
  Progress,
  StockImage
};
