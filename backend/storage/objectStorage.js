const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const backendRoot = path.join(__dirname, '..');
// The local fallback preserves the project's existing backend/uploads and
// backend/private locations. A VPS can use this during setup; production
// object storage takes over as soon as its variables are present.
const localRoot = backendRoot;

const config = () => ({
  endpoint: process.env.AWS_ENDPOINT_URL_S3 || process.env.AWS_ENDPOINT_URL || process.env.S3_ENDPOINT || process.env.OBJECT_STORAGE_ENDPOINT || '',
  region: process.env.AWS_REGION || process.env.S3_REGION || process.env.OBJECT_STORAGE_REGION || 'us-east-1',
  bucket: process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET || process.env.S3_BUCKET || process.env.OBJECT_STORAGE_BUCKET || '',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || process.env.OBJECT_STORAGE_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY || '',
});

function usingObjectStorage() {
  const values = config();
  return Boolean(values.endpoint && values.bucket && values.accessKeyId && values.secretAccessKey);
}

let cachedClient = null;
let clientSignature = '';

function client() {
  const values = config();
  const signature = `${values.endpoint}\u0000${values.region}\u0000${values.bucket}\u0000${values.accessKeyId}\u0000${values.secretAccessKey}`;
  if (cachedClient && clientSignature === signature) return cachedClient;
  clientSignature = signature;
  cachedClient = new S3Client({
    endpoint: values.endpoint,
    region: values.region,
    forcePathStyle: true,
    credentials: { accessKeyId: values.accessKeyId, secretAccessKey: values.secretAccessKey },
  });
  return cachedClient;
}

function safeKey(value) {
  const key = String(value || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!key || key.includes('..') || !/^[a-zA-Z0-9._/-]+$/.test(key)) throw new Error('Invalid file location.');
  return key;
}

function localPath(key) {
  const absolute = path.resolve(localRoot, safeKey(key));
  if (!absolute.startsWith(`${localRoot}${path.sep}`)) throw new Error('Invalid file location.');
  return absolute;
}

function missing(error) {
  return error?.name === 'NoSuchKey' || error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404;
}

async function save(key, body, options = {}) {
  const safe = safeKey(key);
  if (usingObjectStorage()) {
    const values = config();
    await client().send(new PutObjectCommand({
      Bucket: values.bucket,
      Key: safe,
      Body: body,
      ContentType: options.contentType,
      CacheControl: options.cacheControl,
    }));
    return;
  }
  const filePath = localPath(safe);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, body, { flag: 'wx' });
}

async function read(key) {
  const safe = safeKey(key);
  if (usingObjectStorage()) {
    const values = config();
    try {
      const result = await client().send(new GetObjectCommand({ Bucket: values.bucket, Key: safe }));
      return { stream: result.Body, contentType: result.ContentType, contentLength: result.ContentLength };
    } catch (error) {
      if (missing(error)) return null;
      throw error;
    }
  }
  const filePath = localPath(safe);
  try {
    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile()) return null;
    return { stream: fs.createReadStream(filePath), contentLength: stat.size };
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function remove(key) {
  const safe = safeKey(key);
  if (usingObjectStorage()) {
    const values = config();
    await client().send(new DeleteObjectCommand({ Bucket: values.bucket, Key: safe }));
    return;
  }
  await fs.promises.rm(localPath(safe), { force: true });
}

async function copyFromLocal(sourcePath, key, options = {}) {
  const data = await fs.promises.readFile(sourcePath);
  await save(key, data, options);
  return data.length;
}

function streamFromBuffer(body) {
  return Readable.from(body);
}

module.exports = { usingObjectStorage, save, read, remove, copyFromLocal, safeKey, streamFromBuffer, localRoot };
