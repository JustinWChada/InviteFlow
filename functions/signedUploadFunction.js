// Sample Firebase Cloud Function (Node.js) to create a signed upload URL for Firebase Storage.
// Deploy this function in your Firebase project to securely allow guest uploads.

const functions = require('firebase-functions');
const { getStorage } = require('firebase-admin/storage');
const admin = require('firebase-admin');

admin.initializeApp();

exports.createSignedUploadUrl = functions.https.onCall(async (data, context) => {
  // data: { fileName, contentType }
  const { fileName, contentType } = data;

  if (!fileName || !contentType) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing fileName or contentType');
  }

  // Optionally: you can require authentication here
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('permission-denied', 'Authentication required');
  // }

  const bucket = getStorage().bucket();

  const file = bucket.file(`covers/${Date.now()}-${fileName}`);

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  });

  return { uploadUrl: url, path: file.name };
});
