// backend/src/services/upload.service.ts
import { s3, AWS_BUCKET_NAME } from '../config/aws';
import path from 'path';

export class UploadService {
  private generateSafeFileName(
    productName: string,
    originalName: string
  ): string {
    const safeName = productName
      .toLowerCase()
      .replace(/[ąćęłńóśźż]/g, (c) => {
        const chars: Record<string, string> = {
          ą: 'a',
          ć: 'c',
          ę: 'e',
          ł: 'l',
          ń: 'n',
          ó: 'o',
          ś: 's',
          ź: 'z',
          ż: 'z',
        };
        return chars[c] || c;
      })
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    const extension = path.extname(originalName);
    return `${safeName}-${Date.now()}${extension}`;
  }

  async uploadImage(
    file: Express.Multer.File,
    prefix: string = 'products'
  ): Promise<string> {
    const fileName = this.generateSafeFileName(prefix, file.originalname);
    const key = `${prefix}/${fileName}`;

    const params = {
      Bucket: AWS_BUCKET_NAME!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  }

  async deleteImage(imageUrl: string) {
    const key = imageUrl.split('.com/')[1];
    const params = {
      Bucket: AWS_BUCKET_NAME!,
      Key: key,
    };
    await s3.deleteObject(params).promise();
  }

  async uploadDataSheet(file: Express.Multer.File): Promise<string> {
    if (!file.mimetype.includes('pdf')) {
      throw new Error('Dozwolone są tylko pliki PDF');
    }

    const fileName = this.generateSafeFileName('datasheet', file.originalname);
    const key = `datasheets/${fileName}`;

    const params = {
      Bucket: AWS_BUCKET_NAME!,
      Key: key,
      Body: file.buffer,
      ContentType: 'application/pdf',
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  }
}
