import { collection, query, where, onSnapshot } from "firebase/firestore";

import { db } from "./firebase";

export const subscribeToUserInvitations = (uid, callback) => {
  const q = query(collection(db, "invitations"), where("ownerId", "==", uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const invitations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      callback(invitations);
    },
    (error) => {
      console.error(error);
    },
  );
};
