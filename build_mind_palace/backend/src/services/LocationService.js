import { Op } from "sequelize";
import { Location, Space } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import ArchiveService from "./ArchiveService.js";

class LocationService {
  async assertSpaceOwner(spaceId, userId) {
    const space = await Space.findOne({ where: { id: spaceId, userId } });
    if (!space) {
      throw new ApiError(404, "Пространството не е намерено или нямате достъп до него.");
    }
    return space;
  }

  async createLocation(data, userId) {
    await this.assertSpaceOwner(data.spaceId, userId);
    const location = await Location.create(data);
    await ArchiveService.createUserArchive(userId, "location-created").catch(() => {});
    return location;
  }

  async updateLocation(id, data = {}, userId) {
    const location = await Location.findOne({
      where: { id },
      include: [{ model: Space, where: { userId }, attributes: ["id"], required: true }],
    });

    if (!location) {
      throw new ApiError(404, "Мястото не е намерено или нямате достъп до него.");
    }

    const updates = {};

    if (Object.hasOwn(data, "title")) {
      const title = String(data.title || "").trim();
      if (title.length < 2 || title.length > 100) {
        throw new ApiError(400, "Заглавието на мястото трябва да бъде между 2 и 100 символа.");
      }
      updates.title = title;
    }

    if (Object.hasOwn(data, "order")) {
      const order = Number(data.order);
      if (!Number.isInteger(order) || order < 0) {
        throw new ApiError(400, "Редът на мястото трябва да бъде неотрицателно цяло число.");
      }
      updates.order = order;
    }

    if (Object.hasOwn(data, "image")) {
      updates.image = data.image ? String(data.image).trim() : null;
    }

    await location.update(updates);
    await ArchiveService.createUserArchive(userId, "location-updated").catch(() => {});
    return location;
  }

  async reorderLocations(spaceId, updates, userId) {
    await this.assertSpaceOwner(spaceId, userId);
    const ids = updates.map((item) => item.id);
    const existingCount = await Location.count({
      where: {
        spaceId,
        id: { [Op.in]: ids },
      },
    });

    if (existingCount !== ids.length) {
      throw new ApiError(400, "Подредбата съдържа място, което не принадлежи към това пространство.");
    }

    for (const item of updates) {
      await Location.update(
        { order: item.order },
        { where: { id: item.id, spaceId } }
      );
    }

    await ArchiveService.createUserArchive(userId, "locations-reordered").catch(() => {});
  }

  async deleteLocation(id, userId) {
    const location = await Location.findOne({
      where: { id },
      include: [{ model: Space, where: { userId }, attributes: ["id"], required: true }],
    });
    if (!location) {
      throw new ApiError(404, "Мястото не е намерено или нямате достъп до него.");
    }
    await location.destroy();
    await ArchiveService.createUserArchive(userId, "location-deleted").catch(() => {});
  }
}

export default new LocationService();
