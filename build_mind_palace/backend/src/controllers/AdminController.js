import AdminService from "../services/AdminService.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class AdminController {
  createUser = asyncHandler(async (req, res) => {
    const user = await AdminService.createUser(req.body);
    res.status(201).json(user);
  });

  getOverview = asyncHandler(async (req, res) => {
    const data = await AdminService.getOverview();
    res.json(data);
  });

  getUsers = asyncHandler(async (req, res) => {
    const users = await AdminService.getUsers();
    res.json(users);
  });

  updateUserRole = asyncHandler(async (req, res) => {
    const user = await AdminService.updateUserRole(req.params.id, req.body, req.user.id);
    res.json(user);
  });

  updateUser = asyncHandler(async (req, res) => {
    const user = await AdminService.updateUser(req.params.id, req.body);
    res.json(user);
  });

  deleteUser = asyncHandler(async (req, res) => {
    const result = await AdminService.deleteUser(req.params.id, req.user.id);
    res.json(result);
  });

  getUserSpaces = asyncHandler(async (req, res) => {
    const spaces = await AdminService.getUserSpaces(req.params.id);
    res.json(spaces);
  });

  updateSpace = asyncHandler(async (req, res) => {
    const space = await AdminService.updateSpace(req.params.id, req.body);
    res.json(space);
  });

  deleteSpace = asyncHandler(async (req, res) => {
    const result = await AdminService.deleteSpace(req.params.id);
    res.json(result);
  });

  updateLocation = asyncHandler(async (req, res) => {
    const location = await AdminService.updateLocation(req.params.id, req.body);
    res.json(location);
  });

  deleteLocation = asyncHandler(async (req, res) => {
    const result = await AdminService.deleteLocation(req.params.id);
    res.json(result);
  });

  updateContent = asyncHandler(async (req, res) => {
    const content = await AdminService.updateContent(req.params.id, req.body);
    res.json(content);
  });

  deleteContent = asyncHandler(async (req, res) => {
    const result = await AdminService.deleteContent(req.params.id);
    res.json(result);
  });

  getImages = asyncHandler(async (req, res) => {
    const images = await AdminService.getImages();
    res.json(images);
  });

  createImage = asyncHandler(async (req, res) => {
    const url = String(req.body.url || "").trim();
    const category = req.body.category ? String(req.body.category).trim() : null;
    const title = req.body.title ? String(req.body.title).trim() : null;

    if (!url) {
      throw new ApiError(400, "Адресът на изображението е задължителен.");
    }

    const isLocalUpload = url.startsWith("/uploads/");
    const isRemoteUrl = /^https?:\/\/\S+\.\S+/.test(url);
    if (!isLocalUpload && !isRemoteUrl) {
      throw new ApiError(400, "Въведете валиден адрес на изображение.");
    }

    const image = await AdminService.createImage({ url, category, title });
    res.status(201).json(image);
  });

  deleteImage = asyncHandler(async (req, res) => {
    await AdminService.deleteImage(req.params.id);
    res.json({ message: "Изображението е изтрито успешно." });
  });

}

export default new AdminController();
