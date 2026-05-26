import { Op } from "sequelize";

import { User, Space, Location, Content, Progress, StockImage, sequelize } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import ArchiveService from "./ArchiveService.js";
import RoleService, { emailWhere, normalizeEmail, toPublicUser } from "./RoleService.js";
import UserService from "./UserService.js";

class AdminService {
  async createUser(data = {}) {
    const username = String(data.username || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");

    if (username.length < 3 || username.length > 30) {
      throw new ApiError(400, "Потребителското име трябва да бъде между 3 и 30 символа.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, "Въведете валиден имейл адрес.");
    }
    if (password.length < 6) {
      throw new ApiError(400, "Паролата трябва да бъде поне 6 символа.");
    }

    return UserService.createUser({ username, email, password });
  }

  async getOverview() {
    const [users, spaces, locations, contents, images] = await Promise.all([
      User.count(),
      Space.count(),
      Location.count(),
      Content.count(),
      StockImage.count(),
    ]);

    return { users, spaces, locations, contents, images };
  }

  async getUsers() {
    return User.findAll({
      attributes: { exclude: ["password"] },
      include: [{ model: Space, attributes: ["id"] }],
      order: [["createdAt", "DESC"]],
    });
  }

  async updateUserRole(userId, data = {}, currentAdminId) {
    return RoleService.rejectAdminTransfer(userId, data, currentAdminId);
  }

  async updateUser(id, data = {}) {
    data = data || {};
    const user = await User.findByPk(id);
    if (!user) {
      throw new ApiError(404, "Потребителят не е намерен.");
    }

    const updates = {};

    if (Object.hasOwn(data, "username")) {
      const username = String(data.username || "").trim();
      if (username.length < 3 || username.length > 30) {
        throw new ApiError(400, "Потребителското име трябва да бъде между 3 и 30 символа.");
      }
      updates.username = username;
    }

    if (Object.hasOwn(data, "email")) {
      const email = normalizeEmail(data.email);
      if (!email) {
        throw new ApiError(400, "Имейл адресът е задължителен.");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ApiError(400, "Въведете валиден имейл адрес.");
      }

      const currentEmail = normalizeEmail(user.email);
      const configuredAdminEmail = RoleService.getConfiguredAdminEmail();
      const isConfiguredAdmin = Boolean(configuredAdminEmail) && currentEmail === configuredAdminEmail;

      if ((user.role === "admin" || isConfiguredAdmin) && email !== currentEmail) {
        throw new ApiError(403, "Конфигурираният администраторски имейл не може да се променя от панела.");
      }

      if (RoleService.isConfiguredAdminEmail(email) && email !== currentEmail) {
        throw new ApiError(403, "Този администраторски имейл е запазен.");
      }

      const existing = await User.findOne({ where: emailWhere(email) });
      if (existing && existing.id !== user.id) {
        throw new ApiError(409, "Вече има профил с този имейл адрес.");
      }

      updates.email = email;
    }

    await user.update(updates);
    return toPublicUser(user);
  }

  async deleteUser(id, currentAdminId) {
    if (id === currentAdminId) {
      throw new ApiError(400, "Не можете да изтриете собствения си администраторски профил.");
    }

    return sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(id, { transaction });
      if (!user) {
        throw new ApiError(404, "Потребителят не е намерен.");
      }

      if (user.role === "admin" || RoleService.isConfiguredAdminEmail(user.email)) {
        throw new ApiError(403, "Конфигурираният администраторски профил не може да бъде изтрит.");
      }

      const spaces = await Space.findAll({
        where: { userId: id },
        attributes: ["id"],
        transaction,
      });
      const spaceIds = spaces.map((space) => space.id);

      await Progress.destroy({
        where: {
          [Op.or]: [
            { userId: id },
            ...(spaceIds.length ? [{ spaceId: { [Op.in]: spaceIds } }] : []),
          ],
        },
        transaction,
      });

      await user.destroy({ transaction });
      return { message: "Потребителят е изтрит успешно." };
    });
  }

  async getUserSpaces(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError(404, "Потребителят не е намерен.");
    }

    return Space.findAll({
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
    });
  }

  async updateSpace(id, data = {}) {
    data = data || {};
    const space = await Space.findByPk(id);
    if (!space) {
      throw new ApiError(404, "Пространството не е намерено.");
    }

    const updates = {};
    if (Object.hasOwn(data, "title")) {
      const title = String(data.title || "").trim();
      if (!title) {
        throw new ApiError(400, "Заглавието на пространството е задължително.");
      }
      updates.title = title;
    }
    if (Object.hasOwn(data, "description")) {
      updates.description = data.description ? String(data.description).trim() : null;
    }
    if (Object.hasOwn(data, "coverImage")) {
      updates.coverImage = data.coverImage ? String(data.coverImage).trim() : null;
    }

    await space.update(updates);
    return space;
  }

  async deleteSpace(id) {
    return sequelize.transaction(async (transaction) => {
      const space = await Space.findByPk(id, { transaction });
      if (!space) {
        throw new ApiError(404, "Пространството не е намерено.");
      }

      await Progress.destroy({ where: { spaceId: id }, transaction });
      await space.destroy({ transaction });
      return { message: "Пространството е изтрито успешно." };
    });
  }

  async updateLocation(id, data = {}) {
    data = data || {};
    const location = await Location.findByPk(id);
    if (!location) {
      throw new ApiError(404, "Мястото не е намерено.");
    }

    const updates = {};
    if (Object.hasOwn(data, "title")) {
      const title = String(data.title || "").trim();
      if (!title) {
        throw new ApiError(400, "Заглавието на мястото е задължително.");
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
    return location;
  }

  async updateContent(id, data = {}) {
    const content = await Content.findByPk(id, {
      include: [{
        model: Location,
        required: true,
        include: [{ model: Space, attributes: ["id", "userId"], required: true }],
      }],
    });

    if (!content) {
      throw new ApiError(404, "Учебният елемент не е намерен.");
    }

    const updates = {};
    if (Object.hasOwn(data, "type")) {
      const type = String(data.type || "").trim();
      if (!["text", "formula", "image"].includes(type)) {
        throw new ApiError(400, "Видът на учебния елемент е невалиден.");
      }
      updates.type = type;
    }

    if (Object.hasOwn(data, "value")) {
      const value = String(data.value || "").trim();
      if (!value) {
        throw new ApiError(400, "Съдържанието е задължително.");
      }
      updates.value = value;
    }

    await content.update(updates);
    await ArchiveService.createUserArchive(content.Location.Space.userId, "admin-content-updated").catch(() => {});
    return content;
  }

  async deleteContent(id) {
    const content = await Content.findByPk(id, {
      include: [{
        model: Location,
        required: true,
        include: [{ model: Space, attributes: ["id", "userId"], required: true }],
      }],
    });

    if (!content) {
      throw new ApiError(404, "Учебният елемент не е намерен.");
    }

    const userId = content.Location.Space.userId;
    await content.destroy();
    await ArchiveService.createUserArchive(userId, "admin-content-deleted").catch(() => {});
    return { message: "Учебният елемент е изтрит успешно." };
  }

  async deleteLocation(id) {
    const location = await Location.findByPk(id);
    if (!location) {
      throw new ApiError(404, "Мястото не е намерено.");
    }
    await location.destroy();
    return { message: "Мястото е изтрито успешно." };
  }

  async getImages() {
    return StockImage.findAll({ order: [["createdAt", "DESC"]] });
  }


  async createImage(data) {
    return StockImage.create(data);
  }

  async deleteImage(id) {
    const image = await StockImage.findByPk(id);
    if (!image) {
      throw new ApiError(404, "Изображението не е намерено.");
    }
    await image.destroy();
  }
}

export default new AdminService();
