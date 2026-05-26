import { Content, Location, Progress, Space, User } from "../models/index.js";

function toPlain(model) {
  return model?.get ? model.get({ plain: true }) : model;
}

class SyncService {
  async getState(userId) {
    const [user, spaces, progress] = await Promise.all([
      User.findByPk(userId, { attributes: { exclude: ["password"] } }),
      Space.findAll({
        where: { userId },
        include: {
          model: Location,
          include: Content,
        },
        order: [
          ["updatedAt", "DESC"],
          [Location, "order", "ASC"],
          [Location, Content, "createdAt", "ASC"],
        ],
      }),
      Progress.findAll({ where: { userId }, order: [["updatedAt", "DESC"]] }),
    ]);

    return {
      syncedAt: new Date().toISOString(),
      user: toPlain(user),
      spaces: spaces.map(toPlain),
      progress: progress.map(toPlain),
    };
  }
}

export default new SyncService();
