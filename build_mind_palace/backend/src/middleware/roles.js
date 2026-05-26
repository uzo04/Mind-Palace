import { ApiError } from "../utils/ApiError.js";

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Необходимо е да влезете в профила си."));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Нямате права за достъп до тази секция."));
    }

    next();
  };
}
