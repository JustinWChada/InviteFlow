import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";

import { db } from "./firebase";

export const submitResponse = async (invitation, responseType, answers = null) => {
  try {
    await addDoc(collection(db, "responses"), {
      invitationId: invitation.id,

      invitationSlug: invitation.slug,

      responseType,

      answers: answers || null,

      createdAt: serverTimestamp(),
    });

    const invitationRef = doc(db, "invitations", invitation.id);

    const updates = {
      responseCount: increment(1),
    };

    if (responseType === "accepted") {
      updates.acceptedCount = increment(1);
    }

    if (responseType === "declined") {
      updates.declinedCount = increment(1);
    }

    await updateDoc(invitationRef, updates);
  } catch (error) {
    console.error(error);

    throw error;
  }
};
