import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Content, Location, Progress, Space, User } from "../models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const archiveDir = path.resolve(__dirname, "../../archives");
const MAX_ARCHIVES_PER_USER = 10;

function toPlain(model) {
  return model?.get ? model.get({ plain: true }) : model;
}

function safeFilePart(value) {
  return String(value || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
}

class ArchiveService {
  async buildUserSnapshot(userId) {
    const [user, spaces, progress] = await Promise.all([
      User.findByPk(userId, { attributes: { exclude: ["password"] } }),
      Space.findAll({
        where: { userId },
        include: {
          model: Location,
          include: Content,
        },
        order: [
          ["createdAt", "DESC"],
          [Location, "order", "ASC"],
          [Location, Content, "createdAt", "ASC"],
        ],
      }),
      Progress.findAll({ where: { userId }, order: [["updatedAt", "DESC"]] }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      user: toPlain(user),
      spaces: spaces.map(toPlain),
      progress: progress.map(toPlain),
    };
  }

  async createUserArchive(userId, reason = "automatic") {
    const snapshot = await this.buildUserSnapshot(userId);
    await fs.mkdir(archiveDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${safeFilePart(userId)}-${timestamp}.json`;
    const fullPath = path.join(archiveDir, filename);

    await fs.writeFile(fullPath, JSON.stringify({ reason, ...snapshot }, null, 2), "utf8");
    await this.pruneUserArchives(userId);

    return {
      filename,
      path: fullPath,
      reason,
      generatedAt: snapshot.generatedAt,
    };
  }

  async pruneUserArchives(userId) {
    const safeUserId = safeFilePart(userId);
    const entries = await fs.readdir(archiveDir, { withFileTypes: true }).catch(() => []);
    const archives = entries
      .filter((entry) => entry.isFile() && entry.name.startsWith(`${safeUserId}-`) && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort()
      .reverse();

    await Promise.all(
      archives.slice(MAX_ARCHIVES_PER_USER).map((name) => fs.unlink(path.join(archiveDir, name)).catch(() => {}))
    );
  }
}

export default new ArchiveService();
