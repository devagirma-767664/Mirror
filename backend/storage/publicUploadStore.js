const path = require('path');
const { randomUUID } = require('node:crypto');
const storage = require('./objectStorage');

const extensionFor = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

function keyFromPath(value) {
  const raw = String(value || '').replace(/^\/uploads\/?/, '');
  return storage.safeKey(`uploads/${raw}`);
}

async function save(file) {
  if (!file?.buffer) throw new Error('Choose an image to upload.');
  const extension = extensionFor[file.mimetype];
  if (!extension) throw new Error('Only JPG, PNG, or WEBP images are allowed.');
  const key = `uploads/${randomUUID()}${extension}`;
  await storage.save(key, file.buffer, { contentType: file.mimetype, cacheControl: 'public, max-age=604800, immutable' });
  return `/${key}`;
}

async function read(requestPath) {
  const key = keyFromPath(requestPath);
  const file = await storage.read(key);
  if (!file) return null;
  if (!file.contentType) {
    const extension = path.extname(key).toLowerCase();
    file.contentType = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg';
  }
  return file;
}

async function copyExistingUploads(sourceDirectory) {
  const copied = [];
  async function visit(directory, prefix = '') {
    const entries = await require('fs').promises.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const relative = path.posix.join(prefix, entry.name);
      const source = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(source, relative);
      else if (entry.isFile()) {
        const extension = path.extname(entry.name).toLowerCase();
        const contentType = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg';
        const key = `uploads/${relative}`;
        await storage.copyFromLocal(source, key, { contentType, cacheControl: 'public, max-age=604800, immutable' });
        copied.push({ key, bytes: (await require('fs').promises.stat(source)).size });
      }
    }
  }
  await visit(sourceDirectory);
  return copied;
}

module.exports = { save, read, copyExistingUploads, keyFromPath };
