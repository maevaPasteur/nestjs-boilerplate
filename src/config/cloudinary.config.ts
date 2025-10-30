import { registerAs } from '@nestjs/config';

export const CloudinaryConfigName = 'cloudinary';

export interface CloudinaryConfig {
  name: string;
  apiKey: number;
  apiSecret: string;
}

export default registerAs(CloudinaryConfigName, () => ({
  name: process.env.CLOUDINARY_NAME,
  apiKey: parseInt(process.env.CLOUDINARY_API_KEY),
  apiSecret: process.env.CLOUDINARY_API_SECRET,
}));