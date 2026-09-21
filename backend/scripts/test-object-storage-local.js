const assert = require('node:assert/strict');
const { once } = require('node:events');
require('../config');
const storage = require('../storage/objectStorage');
const receipts = require('../models/subscriptionReceiptStore');
const publicUploads = require('../storage/publicUploadStore');

async function read(stream) {
  const chunks = [];
  stream.on('data', chunk => chunks.push(chunk));
  await once(stream, 'end');
  return Buffer.concat(chunks);
}

async function test() {
  assert.equal(storage.usingObjectStorage(), false, 'Local storage test requires no object-storage variables.');

  const receipt = await receipts.save({
    buffer: Buffer.from('Mirror receipt test'),
    mimetype: 'image/png',
    originalname: 'receipt.png',
    size: 19,
  });
  const storedReceipt = await receipts.read(receipt.path);
  assert.ok(storedReceipt, 'Private receipt should be readable after saving.');
  assert.equal((await read(storedReceipt.stream)).toString(), 'Mirror receipt test');
  await receipts.remove(receipt.path);
  assert.equal(await receipts.read(receipt.path), null, 'Private receipt should be removed.');

  const existingImage = await publicUploads.read('services/barber1.png');
  assert.ok(existingImage, 'Existing public uploads should stay readable through the new storage layer.');
  assert.equal(existingImage.contentType, 'image/png');
  existingImage.stream.destroy();

  console.log('Local object-storage fallback passed.');
}

test().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
