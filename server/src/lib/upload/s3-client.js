import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import process from 'node:process'
import '../utils/environment.js'

let client
export function getStorageClient() {
  const { AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env
  if (!AWS_ENDPOINT_URL_S3 || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
    throw Object.assign(new Error('Chưa cấu hình đầy đủ AWS_* cho Neon Object Storage.'), { status: 503 })
  }
  client ??= new S3Client({
    endpoint: AWS_ENDPOINT_URL_S3,
    region: AWS_REGION,
    credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
    forcePathStyle: true,
    maxAttempts:1, requestHandler:{connectionTimeout:5000,requestTimeout:15000},
    requestChecksumCalculation: 'WHEN_REQUIRED',
  })
  return client
}

export async function uploadObject(bucket, key, file) {
  await getStorageClient().send(new PutObjectCommand({
    Bucket: bucket, Key: key, Body: file.buffer, ContentType: file.mimetype,
    ContentLength: file.size, CacheControl:file.private?'private, no-store':'public, max-age=3600',
  }))
}

export function getObjectUrl(bucket,key,options={}) {
  return getSignedUrl(getStorageClient(), new GetObjectCommand({
    Bucket: bucket, Key: key,...(options.private?{ResponseCacheControl:'private, no-store'}:{}),
  }), { expiresIn: options.private?60:3600 })
}

export async function deleteObject(bucket, key) { await getStorageClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key })) }
