import StockImageService from "../services/StockImageService.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function clientImagePayload(image) {
  const plain = image.toJSON();

  return {
    ...plain,
    sourceUrl: plain.url,
    url: `/stock-images/${plain.id}/file`,
  };
}

class StockImageController {
  getAll = asyncHandler(async (req, res) => {
    const images = await StockImageService.getAll();
    res.json(images.map(clientImagePayload));
  });

  getFile = asyncHandler(async (req, res) => {
    const image = await StockImageService.getById(req.params.id);

    if (!image) {
      throw new ApiError(404, "Изображението не беше намерено.");
    }

    const upstream = await fetch(image.url, {
      redirect: "follow",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent": "MindPalaceStockProxy/1.0",
      },
    });

    if (!upstream.ok) {
      throw new ApiError(502, "Неуспешно зареждане на външното изображение.");
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const cacheControl = upstream.headers.get("cache-control");
    const body = Buffer.from(await upstream.arrayBuffer());

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", cacheControl || "public, max-age=86400");
    res.send(body);
  });
}

export default new StockImageController();
