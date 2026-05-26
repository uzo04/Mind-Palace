import ProgressService from "../services/ProgressService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class ProgressController {
  dashboard = asyncHandler(async (req, res) => {
    const dashboard = await ProgressService.getDashboard(req.user.id);
    res.json(dashboard);
  });

  get = asyncHandler(async (req, res) => {
    const progress = await ProgressService.getProgress(
      req.user.id,
      req.params.spaceId
    );

    res.json(progress);
  });

  quiz = asyncHandler(async (req, res) => {
    const quiz = await ProgressService.generateQuiz(
      req.user.id,
      req.params.spaceId
    );

    res.json(quiz);
  });

  update = asyncHandler(async (req, res) => {
    const updated = await ProgressService.updateProgress(
      req.user.id,
      req.params.spaceId,
      req.body
    );

    res.json(updated);
  });
}

export default new ProgressController();
