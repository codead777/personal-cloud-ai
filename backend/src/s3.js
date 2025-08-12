const AWS = require('aws-sdk');
const endpoint = process.env.S3_ENDPOINT;
const s3 = new AWS.S3({
  endpoint,
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

async function uploadBuffer(bucket, key, buffer, contentType) {
  await s3.putObject({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType }).promise();
}

function presignedUrl(bucket, key, expires = 3600) {
  return s3.getSignedUrl('getObject', { Bucket: bucket, Key: key, Expires: expires });
}

module.exports = { uploadBuffer, presignedUrl };
