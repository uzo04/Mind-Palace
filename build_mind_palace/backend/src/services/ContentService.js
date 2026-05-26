import { Content, Location, Space } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import ArchiveService from "./ArchiveService.js";

class ContentService {
  async getOwnedLocation(locationId, userId) {
    const location = await Location.findOne({
      where: { id: locationId },
      include: [{ model: Space, where: { userId }, attributes: ["id"], required: true }],
    });

    if (!location) {
      throw new ApiError(404, "Мястото не е намерено или нямате достъп до него.");
    }

    return location;
  }

  async addContent(data, userId) {
    await this.getOwnedLocation(data.locationId, userId);
    const content = await Content.create(data);
    await ArchiveService.createUserArchive(userId, "content-created").catch(() => {});
    return content;
  }

  async updateContent(id, { value }, userId) {
    const content = await Content.findOne({
      where: { id },
      include: [{
        model: Location,
        required: true,
        include: [{ model: Space, where: { userId }, attributes: ["id"], required: true }],
      }],
    });

    if (!content) {
      throw new ApiError(404, "Съдържанието не е намерено или нямате достъп до него.");
    }

    await content.update({ value });
    await ArchiveService.createUserArchive(userId, "content-updated").catch(() => {});
    return content;
  }

  async deleteContent(id, userId) {
    const content = await Content.findOne({
      where: { id },
      include: [{
        model: Location,
        required: true,
        include: [{ model: Space, where: { userId }, attributes: ["id"], required: true }],
      }],
    });

    if (!content) {
      throw new ApiError(404, "Съдържанието не е намерено или нямате достъп до него.");
    }
    await content.destroy();
    await ArchiveService.createUserArchive(userId, "content-deleted").catch(() => {});
  }
}

export default new ContentService();
