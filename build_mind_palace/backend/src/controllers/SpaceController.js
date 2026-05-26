import SpaceService from "../services/SpaceService.js";
import ArchiveService from "../services/ArchiveService.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class SpaceController {
  getAll = asyncHandler(async (req, res) => {
    const spaces = await SpaceService.getSpaces(req.user.id);
    res.json(spaces);
  });

  getOne = asyncHandler(async (req, res) => {
    const space = await SpaceService.getSpaceFull(
      req.params.id,
      req.user.id
    );

    if (!space) {
      throw new ApiError(404, "Пространството не е намерено или нямате достъп до него.");
    }

    res.json(space);
  });

  create = asyncHandler(async (req, res) => {
    const title = String(req.body.title || "").trim();
    const description = req.body.description ? String(req.body.description).trim() : null;
    const coverImage = req.body.coverImage ? String(req.body.coverImage).trim() : null;

    if (title.length < 2 || title.length > 120) {
      throw new ApiError(400, "Заглавието трябва да бъде между 2 и 120 символа.");
    }

    if (description && description.length > 2000) {
      throw new ApiError(400, "Описанието не може да бъде по-дълго от 2000 символа.");
    }

    const space = await SpaceService.createSpace({
      title,
      description,
      coverImage,
      userId: req.user.id,
    });

    res.status(201).json(space);
  });

  update = asyncHandler(async (req, res) => {
    const space = await SpaceService.updateSpace(req.params.id, req.user.id, req.body);
    res.json(space);
  });

  remove = asyncHandler(async (req, res) => {
    await SpaceService.deleteSpace(req.params.id, req.user.id);

    res.json({ message: "Пространството е изтрито успешно." });
  });
}

export default new SpaceController();
