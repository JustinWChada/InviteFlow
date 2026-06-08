import { deleteDoc, doc } from "firebase/firestore";

import { db } from "./firebase";

export const deleteInvitation = async (id) => {
  await deleteDoc(doc(db, "invitations", id));
};
