const {
  S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand,
  HeadBucketCommand, CreateBucketCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const Bucket = process.env.S3_BUCKET || 'cloud-ai-files';
const base = {
  region: 'us-east-1',
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_SECRET_KEY }
};
const s3 = new S3Client({ ...base, endpoint: process.env.S3_ENDPOINT });
// Signing is offline, so a separate client can sign with the browser-reachable address.
const signer = new S3Client({ ...base, endpoint: process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT });

async function ensureBucket(retries = 20) {
  for (let i = 1; ; i++) {
    try {
      try { await s3.send(new HeadBucketCommand({ Bucket })); }
      catch { await s3.send(new CreateBucketCommand({ Bucket })); }
      return;
    } catch (e) {
      if (i >= retries) throw e;
      console.log(`Object storage not ready (${e.message}) - retry ${i}/${retries}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

const upload = (Key, Body, ContentType) => s3.send(new PutObjectCommand({ Bucket, Key, Body, ContentType }));
const remove = Key => s3.send(new DeleteObjectCommand({ Bucket, Key }));
const presign = (Key, filename, expiresIn = 600) => getSignedUrl(signer, new GetObjectCommand({
  Bucket, Key,
  ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
}), { expiresIn });

module.exports = { ensureBucket, upload, remove, presign };
