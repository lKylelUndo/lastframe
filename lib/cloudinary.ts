import { v2 as cloudinary } from "cloudinary";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a buffer to Cloudinary. Validates MIME type and size before upload.
 * Returns { secure_url, public_id }.
 */
export async function uploadBuffer(
  buffer: Buffer,
  mimetype: string,
  folder: string,
): Promise<{ secure_url: string; public_id: string }> {
  if (!(ALLOWED_TYPES as readonly string[]).includes(mimetype)) {
    throw new Error(
      `Invalid file type "${mimetype}". Allowed: JPEG, PNG, WebP.`,
    );
  }

  if (buffer.length > MAX_SIZE_BYTES) {
    throw new Error(
      `File too large (${(buffer.length / 1024 / 1024).toFixed(1)} MB). Max is 10 MB.`,
    );
  }

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image" },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("Upload returned no result"));
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );
      stream.end(buffer);
    },
  );

  return result;
}

/**
 * Delete an image from Cloudinary by its public ID.
 */
export async function destroyImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

export { cloudinary };
