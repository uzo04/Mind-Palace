import { Space } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import ArchiveService from "./ArchiveService.js";
import { getOwnedSpaceGraph, getOwnedSpaceSummaries } from "./spaceGraph.js";

class SpaceService {
  async getSpaces(userId) {
    return getOwnedSpaceSummaries(userId);
  }

  async getSpaceFull(spaceId, userId) {
    const space = await getOwnedSpaceGraph(spaceId, userId);

    if (!space) {
      throw new ApiError(404, "Пространството не е намерено или нямате достъп до него.");
    }

    return space;
  }

  async createSpace(data) {
    const space = await Space.create(data);
    await ArchiveService.createUserArchive(data.userId, "space-created").catch(() => {});
    return space;
  }

  async updateSpace(spaceId, userId, data = {}) {
    const space = await Space.findOne({ where: { id: spaceId, userId } });
    if (!space) {
      throw new ApiError(404, "Пространството не е намерено или нямате достъп до него.");
    }

    const updates = {};

    if (Object.hasOwn(data, "title")) {
      const title = String(data.title || "").trim();
      if (title.length < 2 || title.length > 120) {
        throw new ApiError(400, "Заглавието трябва да бъде между 2 и 120 символа.");
      }
      updates.title = title;
    }

    if (Object.hasOwn(data, "description")) {
      const description = data.description ? String(data.description).trim() : null;
      if (description && description.length > 2000) {
        throw new ApiError(400, "Описанието не може да бъде по-дълго от 2000 символа.");
      }
      updates.description = description;
    }

    if (Object.hasOwn(data, "coverImage")) {
      updates.coverImage = data.coverImage ? String(data.coverImage).trim() : null;
    }

    await space.update(updates);
    await ArchiveService.createUserArchive(userId, "space-updated").catch(() => {});
    return space;
  }

  async deleteSpace(spaceId, userId) {
    const space = await Space.findOne({ where: { id: spaceId, userId } });
    if (!space) {
      throw new ApiError(404, "Пространството не е намерено или нямате достъп до него.");
    }

    await space.destroy();
    await ArchiveService.createUserArchive(userId, "space-deleted").catch(() => {});
  }
}

export default new SpaceService();
