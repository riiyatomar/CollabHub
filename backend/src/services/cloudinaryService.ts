import { cloudinary } from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string,
  filename: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `collabhub/${folder}`,
        ...(filename ? { public_id: filename } : {}), // Keep full filename including extension for raw files
        resource_type: filename && filename.toLowerCase().endsWith('.pdf') ? 'raw' : 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary upload returned null result'));
        resolve(result);
      }
    );

    const stream = Readable.from(fileBuffer);
    stream.pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error(`Failed to delete asset ${publicId} from Cloudinary:`, error);
  }
};
