import { col, fn, Op, where as sequelizeWhere } from "sequelize";
import bcrypt from "bcrypt";

import { sequelize, User } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function emailWhere(email) {
  return sequelizeWhere(fn("LOWER", col("email")), normalizeEmail(email));
}

function toPublicUser(user) {
  if (!user) return null;

  const plain = user.get ? user.get({ plain: true }) : { ...user };
  delete plain.password;
  return plain;
}

class RoleService {
  getConfiguredAdminEmail() {
    return normalizeEmail(process.env.ADMIN_EMAIL);
  }

  getConfiguredAdminPassword() {
    return String(process.env.ADMIN_PASSWORD || "");
  }

  isConfiguredAdminEmail(email) {
    const adminEmail = this.getConfiguredAdminEmail();
    return Boolean(adminEmail) && normalizeEmail(email) === adminEmail;
  }

  async promoteConfiguredAdmin({ transaction } = {}) {
    const adminEmail = this.getConfiguredAdminEmail();
    const adminPassword = this.getConfiguredAdminPassword();
    if (!adminEmail) return null;

    let configuredUser = await User.findOne({
      where: emailWhere(adminEmail),
      transaction,
    });

    if (!configuredUser && adminPassword) {
      configuredUser = await User.create({
        username: adminEmail.split("@")[0] || "admin",
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, 10),
        role: "admin",
      }, { transaction });
    }

    if (!configuredUser) return null;

    if (adminPassword) {
      const matches = await bcrypt.compare(adminPassword, configuredUser.password);
      if (!matches) {
        await configuredUser.update({
          password: await bcrypt.hash(adminPassword, 10),
        }, { transaction });
      }
    }

    await User.update(
      { role: "user" },
      {
        where: {
          role: "admin",
          id: { [Op.ne]: configuredUser.id },
        },
        transaction,
      }
    );

    if (configuredUser.role !== "admin") {
      await configuredUser.update({ role: "admin" }, { transaction });
    }

    return toPublicUser(configuredUser);
  }

  async bootstrapSingleAdmin() {
    return sequelize.transaction(async (transaction) => {
      const configuredAdmin = await this.promoteConfiguredAdmin({ transaction });
      if (configuredAdmin) return configuredAdmin;

      const admins = await User.findAll({
        where: { role: "admin" },
        order: [["createdAt", "ASC"]],
        transaction,
      });

      if (admins.length === 0) {
        return null;
      }

      if (admins.length === 1) {
        return toPublicUser(admins[0]);
      }

      const keeper = admins[0];

      await User.update(
        { role: "user" },
        {
          where: {
            role: "admin",
            id: { [Op.ne]: keeper.id },
          },
          transaction,
        }
      );

      if (keeper.role !== "admin") {
        await keeper.update({ role: "admin" }, { transaction });
      }

      return toPublicUser(keeper);
    });
  }

  async rejectAdminTransfer() {
    throw new ApiError(403, "Администраторската роля е заключена към конфигурирания ADMIN_EMAIL и не може да се прехвърля.");
  }

  async applyRoleForNewUser(user) {
    if (!this.isConfiguredAdminEmail(user.email)) {
      return toPublicUser(user);
    }

    return sequelize.transaction((transaction) => this.promoteConfiguredAdmin({ transaction }));
  }
}

export { emailWhere, normalizeEmail, toPublicUser };
export default new RoleService();
