import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary";

type UploadFileInput = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
};

type UploadedFileResult = {
  storageProvider: "cloudinary";
  publicId: string;
  secureUrl: string;
  resourceType: "image" | "video" | "raw";
  bytes: number;
  format?: string;
};

function getResourceType(mimeType: string): "image" | "video" | "raw" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "raw";
}

export async function uploadFileToStorage(
  input: UploadFileInput,
): Promise<UploadedFileResult> {
  const resourceType = getResourceType(input.mimeType);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || "vaultbox",
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          storageProvider: "cloudinary",
          publicId: result.public_id,
          secureUrl: result.secure_url,
          resourceType: result.resource_type as "image" | "video" | "raw",
          bytes: result.bytes,
          format: result.format,
        });
      },
    );

    stream.end(input.buffer);
  });
}

export async function deleteFileFromStorage(input: {
  publicId: string;
  resourceType?: string | null;
}) {
  await cloudinary.uploader.destroy(input.publicId, {
    resource_type: input.resourceType || "raw",
  });
}
