// Cloudinary stores product images and logos. Fill in the three
// CLOUDINARY_* values in .env and uploads work. Without them, the API still
// runs; only uploads are refused.
import { v2 as cloudinary } from "cloudinary";
import { env, features } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

if (features.cloudinary) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Upload an image held in memory (e.g. from a multipart form) to a folder
// such as "vendly/products". Returns what we store on the document.
export async function uploadImage(buffer: Buffer, folder: string): Promise<{ url: string; publicId: string }> {
  if (!features.cloudinary) {
    throw new AppError(503, "UPLOADS_NOT_CONFIGURED", "Image uploads are not configured on this server");
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (error, result) => {
      if (error || !result) return reject(error || new Error("Upload failed"));
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    stream.end(buffer);
  });
}

export async function deleteImage(publicId: string) {
  if (!features.cloudinary || !publicId) return;
  await cloudinary.uploader.destroy(publicId, { invalidate: true });
}
