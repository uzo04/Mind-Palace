import { Sequelize } from "sequelize";

const {
  DB_NAME = "mindpalace",
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_HOST = "localhost",
  DB_PORT = "3306",
  DB_SSL = "false",
  DB_POOL_MAX = "20",
  DB_POOL_MIN = "0",
  DB_POOL_ACQUIRE_MS = "60000",
  DB_POOL_IDLE_MS = "10000",
  DB_CONNECT_TIMEOUT_MS = "60000",
} = process.env;
const useSsl = DB_SSL.toLowerCase() === "true";

const sequelize = new Sequelize(
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  {
    host: DB_HOST,
    port: Number(DB_PORT),
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      connectTimeout: Number(DB_CONNECT_TIMEOUT_MS),
      ...(useSsl ? { ssl: { require: true } } : {}),
    },
    pool: {
      max: Number(DB_POOL_MAX),
      min: Number(DB_POOL_MIN),
      acquire: Number(DB_POOL_ACQUIRE_MS),
      idle: Number(DB_POOL_IDLE_MS),
    },
  }
);

export default sequelize;
