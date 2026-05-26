import LocationService from "../services/LocationService.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class LocationController {
  create = asyncHandler(async (req, res) => {
    const { spaceId } = req.body;
    const title = String(req.body.title || "").trim();
    const rawOrder = Object.hasOwn(req.body, "order") ? req.body.order : 0;
    const order = Number(rawOrder);

    if (!spaceId) {
      throw new ApiError(400, "Необходимо е да изберете пространство.");
    }

    if (title.length < 2 || title.length > 100) {
      throw new ApiError(400, "Заглавието на мястото трябва да бъде между 2 и 100 символа.");
    }

    if (rawOrder === null || rawOrder === "" || !Number.isInteger(order) || order < 0) {
      throw new ApiError(400, "Редът на мястото трябва да бъде неотрицателно цяло число.");
    }

    const location = await LocationService.createLocation({
      spaceId,
      title,
      order,
      image: req.body.image ? String(req.body.image).trim() : null,
    }, req.user.id);

    res.status(201).json(location);
  });

  reorder = asyncHandler(async (req, res) => {
    const { spaceId, updates } = req.body;

    if (!spaceId) {
      throw new ApiError(400, "Необходимо е да изберете пространство.");
    }

    if (!Array.isArray(updates)) {
      throw new ApiError(400, "Подредбата трябва да бъде списък с места.");
    }

    const normalizedUpdates = updates.map((item) => ({
      id: item.id,
      order: Number(item.order),
    }));

    for (const item of normalizedUpdates) {
      if (!item.id || !Number.isInteger(Number(item.order)) || Number(item.order) < 0) {
        throw new ApiError(400, "Всяко място в подредбата трябва да има валиден идентификатор и ред.");
      }
    }

    await LocationService.reorderLocations(spaceId, normalizedUpdates, req.user.id);
    res.json({ message: "Местата са подредени успешно." });
  });

  update = asyncHandler(async (req, res) => {
    const location = await LocationService.updateLocation(req.params.id, req.body, req.user.id);
    res.json(location);
  });

  remove = asyncHandler(async (req, res) => {
    await LocationService.deleteLocation(req.params.id, req.user.id);
    res.json({ message: "Мястото е изтрито успешно." });
  });
}

export default new LocationController();
