import "dotenv/config";
import app from "./src/app.js";
import { sequelize } from "./src/models/index.js";
import DatabaseMaintenanceService from "./src/services/DatabaseMaintenanceService.js";
import RoleService from "./src/services/RoleService.js";

const PORT = process.env.PORT || 5000;

function getSyncOptions() {
  const mode = (process.env.DB_SYNC_MODE || "safe").toLowerCase();

  if (mode === "alter") return { alter: true };
  if (mode === "force") return { force: true };
  return {};
}

async function start() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is required.");
    }

    await sequelize.authenticate();
    await DatabaseMaintenanceService.cleanupProgressIntegrity();
    await sequelize.sync(getSyncOptions());
    await RoleService.bootstrapSingleAdmin();

    app.listen(PORT);
  } catch {
    process.exit(1);
  }
}

start();
