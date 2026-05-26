import { sequelize } from "../models/index.js";

function escapeIdentifier(identifier) {
  return String(identifier).replace(/`/g, "``");
}

class DatabaseMaintenanceService {
  async tableExists(tableName) {
    const [rows] = await sequelize.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
      { replacements: [tableName] }
    );

    return rows.length > 0;
  }

  async cleanupProgressIntegrity() {
    const [hasProgresses, hasSpaces, hasUsers] = await Promise.all([
      this.tableExists("progresses"),
      this.tableExists("spaces"),
      this.tableExists("users"),
    ]);

    if (!hasProgresses) return;

    if (hasSpaces) {
      await sequelize.query(`
        DELETE p FROM \`progresses\` p
        LEFT JOIN \`spaces\` s ON p.\`spaceId\` = s.\`id\`
        WHERE s.\`id\` IS NULL
      `);
    }

    if (hasUsers) {
      await sequelize.query(`
        DELETE p FROM \`progresses\` p
        LEFT JOIN \`users\` u ON p.\`userId\` = u.\`id\`
        WHERE u.\`id\` IS NULL
      `);
    }

    await this.dropDuplicateProgressForeignKeys();
  }

  async dropDuplicateProgressForeignKeys() {
    const [constraints] = await sequelize.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'progresses'
        AND REFERENCED_TABLE_NAME IS NOT NULL
        AND COLUMN_NAME IN ('userId', 'spaceId')
      ORDER BY COLUMN_NAME, CONSTRAINT_NAME
    `);

    const seen = new Set();
    const duplicates = [];

    for (const constraint of constraints) {
      if (seen.has(constraint.COLUMN_NAME)) {
        duplicates.push(constraint.CONSTRAINT_NAME);
      } else {
        seen.add(constraint.COLUMN_NAME);
      }
    }

    for (const name of duplicates) {
      await sequelize.query(
        `ALTER TABLE \`progresses\` DROP FOREIGN KEY \`${escapeIdentifier(name)}\``
      );
    }
  }
}

export default new DatabaseMaintenanceService();
