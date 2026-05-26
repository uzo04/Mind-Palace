import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import UserService from "../services/UserService.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new ApiError(500, "Липсва конфигурация за сигурност на сървъра.");
  }

  return process.env.JWT_SECRET;
}

class AuthController {
  register = asyncHandler(async (req, res) => {
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (username.length < 3 || username.length > 30) {
      throw new ApiError(400, "Потребителското име трябва да бъде между 3 и 30 символа.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, "Въведете валиден имейл адрес.");
    }

    if (password.length < 6) {
      throw new ApiError(400, "Паролата трябва да бъде поне 6 символа.");
    }

    const user = await UserService.createUser({ username, email, password });

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, username: user.username },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  });

  login = asyncHandler(async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      throw new ApiError(400, "Въведете имейл и парола.");
    }

    const user = await UserService.findByEmail(email);
    if (!user) {
      throw new ApiError(401, "Невалидна електронна поща или парола.");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new ApiError(401, "Невалидна електронна поща или парола.");
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, username: user.username },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  });

  me = asyncHandler(async (req, res) => {
    const user = await UserService.findById(req.user.id);
    res.json(user);
  });
}

export default new AuthController();
