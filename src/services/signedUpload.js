import { getFunctions, httpsCallable } from "firebase/functions";
import { functions as firebaseFunctions } from "./firebase";

// Helper to call the Cloud Function `createSignedUploadUrl` (see functions/signedUploadFunction.js)
// Returns { uploadUrl, path }
export const requestSignedUpload = async (fileName, contentType) => {
  try {
    // dynamic import of functions because not all setups will have functions exported
    const functions = getFunctions();

    const createSignedUploadUrl = httpsCallable(functions, "createSignedUploadUrl");

    const res = await createSignedUploadUrl({ fileName, contentType });

    return res.data;
  } catch (err) {
    console.error("Signed upload request failed:", err);
    throw err;
  }
};

// Fallback: if you have an authenticated user, you can still use direct upload via storageService.uploadCoverImage

export default requestSignedUpload;
