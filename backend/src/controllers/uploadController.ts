import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { put } from '@vercel/blob';
import { AuthRequest } from '../interfaces';

const UPLOADS_DIR = path.resolve(process.cwd(), 'public/uploads');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');
const COVERS_DIR = path.join(UPLOADS_DIR, 'covers');
const isBlobConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export function ensureUploadDirectories(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(AVATARS_DIR)) {
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
  }
  if (!fs.existsSync(COVERS_DIR)) {
    fs.mkdirSync(COVERS_DIR, { recursive: true });
  }
}

const storage = multer.memoryStorage();
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('Only image files are allowed!'), { status: 400 }) as any, false);
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export async function handleImageUpload(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw Object.assign(new Error('No file uploaded'), { status: 400 });
    }

    const type = req.query.type === 'cover' ? 'cover' : 'avatar';
    const fileId = crypto.randomUUID();
    const filename = `${fileId}.webp`;
    const folder = type === 'avatar' ? 'avatars' : 'covers';
    const pathname = `${folder}/${filename}`;

    const imageBuffer = type === 'avatar'
      ? await sharp(req.file.buffer)
          .resize(250, 250, { fit: 'cover' })
          .webp({ quality: 80 })
          .toBuffer()
      : await sharp(req.file.buffer)
          .resize({ width: 800, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

    if (isBlobConfigured()) {
      const blob = await put(pathname, imageBuffer, {
        access: 'public',
        contentType: 'image/webp',
      });

      res.json({ url: blob.url });
      return;
    }

    ensureUploadDirectories();

    if (type === 'avatar') {
      const targetPath = path.join(AVATARS_DIR, filename);
      await fs.promises.writeFile(targetPath, imageBuffer);

      res.json({ url: `/uploads/avatars/${filename}` });
    } else {
      const targetPath = path.join(COVERS_DIR, filename);
      await fs.promises.writeFile(targetPath, imageBuffer);

      res.json({ url: `/uploads/covers/${filename}` });
    }
  } catch (err) {
    next(err);
  }
}
