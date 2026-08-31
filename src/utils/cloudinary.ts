import { UploadApiOptions, v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadedFile {
  url: string;
  publicId: string;
  format?: string;
  bytes: number;
}

export const uploadBuffer = (buffer: Buffer, options: UploadApiOptions) =>
  new Promise<UploadedFile>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error("Cloudinary upload failed"));
        return;
      }

      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
      });
    });

    stream.end(buffer);
  });

export { cloudinary };
