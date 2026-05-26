import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new ApiError(500, "Липсва конфигурация за сигурност на сървъра.");
  }

  return process.env.JWT_SECRET;
}

export async function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new ApiError(401, "Необходимо е да влезете в профила си."));
  }

  const token = header.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch {
    return next(new ApiError(401, "Сесията е невалидна или е изтекла. Влезте отново."));
  }

  try {
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return next(new ApiError(401, "Профилът не е намерен. Влезте отново."));
    }

    req.user = { id: user.id, role: user.role, email: user.email, username: user.username };
    next();
  } catch (err) {
    next(err);
  }
}
