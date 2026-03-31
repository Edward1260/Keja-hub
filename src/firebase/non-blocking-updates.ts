import { updateDoc, deleteDoc, DocumentReference } from "firebase/firestore";

export const updateDocumentNonBlocking = (docRef: DocumentReference, data: any) => {
  updateDoc(docRef, data).catch(console.error);
};

export const deleteDocumentNonBlocking = (docRef: DocumentReference) => {
  deleteDoc(docRef).catch(console.error);
};