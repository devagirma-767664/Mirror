const fs = require('fs');
const path = require('path');
require('../config');
const storage = require('../storage/objectStorage');
const PublicUploads = require('../storage/publicUploadStore');

const backendRoot = path.join(__dirname, '..');
const publicUploads = path.join(backendRoot, 'uploads');
const privateReceipts = path.join(backendRoot, 'private', 'payment-receipts');

function imageType(file) {
  const extension = path.extname(file).toLowerCase();
  return extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg';
}

async function copyPrivate(directory, prefix = '') {
  if (!fs.existsSync(directory)) return { files: 0, bytes: 0 };
  let files = 0;
  let bytes = 0;
  for (const entry of await fs.promises.readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    const source = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await copyPrivate(source, relative);
      files += nested.files;
      bytes += nested.bytes;
      continue;
    }
    if (!entry.isFile()) continue;
    const size = await storage.copyFromLocal(source, `private/payment-receipts/${relative}`, { contentType: imageType(entry.name), cacheControl: 'private, no-store' });
    files += 1;
    bytes += size;
  }
  return { files, bytes };
}

async function migrate() {
  if (!storage.usingObjectStorage()) {
    throw new Error('Set the object-storage endpoint, bucket, access key, and secret before running this migration.');
  }
  const publicFiles = fs.existsSync(publicUploads) ? await PublicUploads.copyExistingUploads(publicUploads) : [];
  const privateFiles = await copyPrivate(privateReceipts);
  const publicBytes = publicFiles.reduce((total, file) => total + file.bytes, 0);
  console.log(`Uploaded ${publicFiles.length} public files (${publicBytes} bytes) and ${privateFiles.files} private receipts (${privateFiles.bytes} bytes).`);
}

migrate().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
