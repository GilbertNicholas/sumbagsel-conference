import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const PAYMENT_PROOF_DIR = 'payment-proof';
const UPLOAD_PATH = `uploads/${PAYMENT_PROOF_DIR}`;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const storage = diskStorage({
  destination: (req, file, cb) => {
    if (!existsSync(UPLOAD_PATH)) {
      mkdirSync(UPLOAD_PATH, { recursive: true });
    }
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname) || '.jpg';
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post('payment-proof')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: MAX_SIZE },
      fileFilter: (req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.'), false);
        }
      },
    }),
  )
  uploadPaymentProof(
    @UploadedFile() file: Express.Multer.File,
  ): { url: string } {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }
    const url = `/uploads/${PAYMENT_PROOF_DIR}/${file.filename}`;
    return { url };
  }
}
