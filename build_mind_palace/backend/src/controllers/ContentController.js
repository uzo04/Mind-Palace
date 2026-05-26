import ContentService from "../services/ContentService.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { storeUploadedImage } from "../middleware/upload.js";

class ContentController {
  create = asyncHandler(async (req, res) => {
    const { type, locationId } = req.body;
    const value = String(req.body.value || "").trim();
    const allowedTypes = ["text", "formula", "image"];

    if (!locationId) {
      throw new ApiError(400, "ÐÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð¾ Ðµ Ð´Ð° Ð¸Ð·Ð±ÐµÑ€ÐµÑ‚Ðµ Ð¼ÑÑÑ‚Ð¾.");
    }

    if (!allowedTypes.includes(type)) {
      throw new ApiError(400, "Ð’Ð¸Ð´ÑŠÑ‚ ÑÑŠÐ´ÑŠÑ€Ð¶Ð°Ð½Ð¸Ðµ Ðµ Ð½ÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½.");
    }

    if (value.length < 1 || value.length > 5000) {
      throw new ApiError(400, "Ð¡ÑŠÐ´ÑŠÑ€Ð¶Ð°Ð½Ð¸ÐµÑ‚Ð¾ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ð±ÑŠÐ´Ðµ Ð¼ÐµÐ¶Ð´Ñƒ 1 Ð¸ 5000 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°.");
    }

    const content = await ContentService.addContent({ type, value, locationId }, req.user.id);
    res.status(201).json(content);
  });

  update = asyncHandler(async (req, res) => {
    const value = String(req.body.value || "").trim();
    if (value.length < 1 || value.length > 5000) {
      throw new ApiError(400, "Ð¡ÑŠÐ´ÑŠÑ€Ð¶Ð°Ð½Ð¸ÐµÑ‚Ð¾ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ð±ÑŠÐ´Ðµ Ð¼ÐµÐ¶Ð´Ñƒ 1 Ð¸ 5000 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°.");
    }
    const content = await ContentService.updateContent(req.params.id, { value }, req.user.id);
    res.json(content);
  });

  remove = asyncHandler(async (req, res) => {
    await ContentService.deleteContent(req.params.id, req.user.id);
    res.json({ message: "Ð¡ÑŠÐ´ÑŠÑ€Ð¶Ð°Ð½Ð¸ÐµÑ‚Ð¾ Ðµ Ð¸Ð·Ñ‚Ñ€Ð¸Ñ‚Ð¾ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾." });
  });

  uploadImage = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, "ÐÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð¾ Ðµ Ð´Ð° ÐºÐ°Ñ‡Ð¸Ñ‚Ðµ Ð¸Ð·Ð¾Ð±Ñ€Ð°Ð¶ÐµÐ½Ð¸Ðµ.");
    }

    const stored = await storeUploadedImage(req.file);
    const publicAppUrl = process.env.PUBLIC_APP_URL?.trim().replace(/\/$/, "");
    const requestBaseUrl = `${req.protocol}://${req.get("host")}`;
    const resolvedUrl = stored.url.startsWith("http")
      ? stored.url
      : `${publicAppUrl || requestBaseUrl}${stored.url}`;

    res.status(201).json({
      url: resolvedUrl,
      filename: stored.filename,
      storage: stored.storage,
    });
  });
}

export default new ContentController();
