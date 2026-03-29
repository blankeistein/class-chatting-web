import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth, signInWithCustomToken, signOut } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

type FirebaseSession = {
    uid: string;
    custom_token: string;
} | null;

type FirebaseWebConfig = {
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
    messagingSenderId?: string;
    storageBucket?: string;
};

let firebaseWarningShown = false;

function resolveFirebaseWebConfig(): FirebaseWebConfig | null {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const appId = import.meta.env.VITE_FIREBASE_APP_ID;
    const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
    const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;

    if (! apiKey || ! authDomain || ! projectId || ! appId) {
        if (! firebaseWarningShown) {
            console.warn("Firebase web config is incomplete. Skipping Firebase client auth sync.");
            firebaseWarningShown = true;
        }

        return null;
    }

    return {
        apiKey,
        authDomain,
        projectId,
        appId,
        messagingSenderId,
        storageBucket,
    };
}

function getFirebaseApp(): FirebaseApp | null {
    const config = resolveFirebaseWebConfig();

    if (! config) {
        return null;
    }

    return getApps().length > 0 ? getApp() : initializeApp(config);
}

export function getFirebaseFirestore(): Firestore | null {
    const app = getFirebaseApp();

    if (! app) {
        return null;
    }

    return getFirestore(app);
}

export function getFirebaseAuth(): Auth | null {
    const app = getFirebaseApp();

    if (! app) {
        return null;
    }

    return getAuth(app);
}

export async function syncFirebaseAuth(session: FirebaseSession): Promise<void> {
    const auth = getFirebaseAuth();

    if (! auth) {
        return;
    }

    if (! session) {
        if (auth.currentUser) {
            await signOut(auth);
        }

        return;
    }

    if (auth.currentUser?.uid === session.uid) {
        return;
    }

    await signInWithCustomToken(auth, session.custom_token);
}

export async function signOutFirebase(): Promise<void> {
    const auth = getFirebaseAuth();

    if (! auth || ! auth.currentUser) {
        return;
    }

    await signOut(auth);
}
