import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { db } from "./firebase";
import { generateSlug } from "../utils/generateSlug";

export const createInvitation = async (invitationData, currentUser = null) => {
  try {
    const slug = generateSlug();

    const payload = {
      ...invitationData,

      slug,

      ownerId: currentUser?.uid || null,

      ownerEmail: currentUser?.email || null,

      views: 0,

      responseCount: 0,

      acceptedCount: 0,

      declinedCount: 0,

      published: true,

      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "invitations"), payload);

    return slug;
  } catch (error) {
    throw error;
  }
};

import { doc, updateDoc, query, where, getDocs } from "firebase/firestore";

export const updateInvitation = async (id, updates) => {
  try {
    const ref = doc(db, "invitations", id);

    await updateDoc(ref, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw error;
  }
};

export const getInvitationBySlug = async (slug) => {
  try {
    const q = query(collection(db, "invitations"), where("slug", "==", slug));

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docItem = snapshot.docs[0];

    return {
      id: docItem.id,
      ...docItem.data(),
    };
  } catch (error) {
    throw error;
  }
};
