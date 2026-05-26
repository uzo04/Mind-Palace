import StockImageService from "../services/StockImageService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class StockImageController {
  getAll = asyncHandler(async (req, res) => {
    const images = await StockImageService.getAll();
    res.json(images);
  });
}

export default new StockImageController();