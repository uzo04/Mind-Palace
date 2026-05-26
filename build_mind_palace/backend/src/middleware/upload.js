import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../uploads");
const uploadProvider = (process.env.UPLOAD_PROVIDER || "local").trim().toLowerCase();

await fs.mkdir(uploadDir, { recursive: true });

const IMAGE_SIGNATURES = [
  {
    ext: "png",
    mime: "image/png",
    match: (buffer) => buffer.length >= 8
      && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: "jpg",
    mime: "image/jpeg",
    match: (buffer) => buffer.length >= 3
      && buffer[0] === 0xff
      && buffer[1] === 0xd8
      && buffer[2] === 0xff,
  },
  {
    ext: "webp",
    mime: "image/webp",
    match: (buffer) => buffer.length >= 12
      && buffer.subarray(0, 4).toString("ascii") === "RIFF"
      && buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
  {
    ext: "gif",
    mime: "image/gif",
    match: (buffer) => buffer.length >= 6
      && ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii")),
  },
];

function detectImageSignature(buffer) {
  return IMAGE_SIGNATURES.find((signature) => signature.match(buffer)) || null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new ApiError(400, "Only image uploads are allowed."), false);
    }

    cb(null, true);
  },
});

async function uploadToCloudinary(file, signature) {
  if (!process.env.CLOUD_NAME || !process.env.CLOUD_API_KEY || !process.env.CLOUD_API_SECRET) {
    throw new ApiError(500, "Cloudinary is not configured correctly.");
  }

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || "mind-palace",
        resource_type: "image",
        public_id: `${Date.now()}-${crypto.randomUUID()}`,
        format: signature.ext,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });

  return {
    filename: uploadResult.public_id,
    mimeType: signature.mime,
    absolutePath: null,
    url: uploadResult.secure_url,
    storage: "cloudinary",
  };
}

async function uploadToLocal(file, signature) {
  const filename = `${Date.now()}-${crypto.randomUUID()}.${signature.ext}`;
  const absolutePath = path.join(uploadDir, filename);

  await fs.writeFile(absolutePath, file.buffer);

  return {
    filename,
    mimeType: signature.mime,
    absolutePath,
    url: `/uploads/${filename}`,
    storage: "local",
  };
}

export async function storeUploadedImage(file) {
  if (!file?.buffer?.length) {
    throw new ApiError(400, "Image upload is required.");
  }

  const signature = detectImageSignature(file.buffer);
  if (!signature) {
    throw new ApiError(400, "The file must be a valid PNG, JPG, WEBP, or GIF image.");
  }

  if (uploadProvider === "cloudinary") {
    return uploadToCloudinary(file, signature);
  }

  return uploadToLocal(file, signature);
}

export default upload;
