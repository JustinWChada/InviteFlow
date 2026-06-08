import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { storage } from "./firebase";

export const uploadCoverImage = async (file) => {
  // sanitize filename to avoid spaces and weird characters
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, "-");
  const fileName = `${Date.now()}-${safeName}`;

  const imageRef = ref(storage, `covers/${fileName}`);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(imageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);

        // if caller provided an onProgress handler, call it via uploadTask.taskSnapshot (we'll attach dynamic handler in caller)
        // Note: we don't have access to an injected onProgress here, callers will subscribe to progress via returned uploadTask in advanced implementations.
        // For simplicity, we emit console progress which parent can react to via own listeners when using the returned promise.
        console.debug("Upload progress:", percent);
      },
      (error) => {
        console.error("Upload failed:", error);
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);

          resolve(url);
        } catch (err) {
          reject(err);
        }
      },
    );
  });
};
