import { ApiError } from "../utils/ApiError.js";

export function validate(requiredFields) {
  return (req, res, next) => {
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return next(new ApiError(400, `Полето "${field}" е задължително.`));
      }
    }
    next();
  };
}
