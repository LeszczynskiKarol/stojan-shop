// backend/src/utils/s3Client.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadToS3 = async (
  file: Buffer,
  filename: string,
  contentType: string
) => {
  const bucket = 'piszemy.com.pl';
  const key = `stojan/invoices/${filename}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return `https://s3.eu-north-1.amazonaws.com/${bucket}/${key}`;
};
