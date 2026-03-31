'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, db: Firestore, email: string, password: string, role: string, isAutoApproved: boolean = false): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      const userRef = doc(db, "users", user.uid);
      
      // Auto-approve if they register via a valid invitation token, or if they are a Tenant.
      // Hosts and Agents signing up via token (isAutoApproved) are verified immediately.
      const isVerified = isAutoApproved || role === "Tenant";

      // Non-blocking Firestore write to initialize user profile node
      setDoc(userRef, {
        id: user.uid,
        email: user.email,
        firstName: "",
        lastName: "",
        role: role,
        createdAt: new Date().toISOString(),
        isActive: true,
        isVerified: isVerified, 
        trustScore: 80, 
      }).catch(async (error) => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: userRef.path,
            operation: 'create',
            requestResourceData: { id: user.uid, email: user.email, role },
          })
        );
      });
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password);
}