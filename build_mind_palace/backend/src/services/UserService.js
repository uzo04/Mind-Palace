import bcrypt from "bcrypt";
import { User } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import RoleService, { emailWhere, normalizeEmail } from "./RoleService.js";

class UserService {
  async createUser({ username, email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ where: emailWhere(normalizedEmail) });
    if (existing) {
      throw new ApiError(409, "Вече има профил с този имейл адрес.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
    });

    return RoleService.applyRoleForNewUser(user);
  }

  async findByEmail(email) {
    return User.findOne({ where: emailWhere(email) });
  }

  async findById(id) {
    return User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
  }
}

export default new UserService();
