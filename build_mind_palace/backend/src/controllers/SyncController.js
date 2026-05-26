import SyncService from "../services/SyncService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class SyncController {
  state = asyncHandler(async (req, res) => {
    const data = await SyncService.getState(req.user.id);
    res.json(data);
  });
}

export default new SyncController();
