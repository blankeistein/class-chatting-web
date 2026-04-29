import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth, signInWithCustomToken, signOut } from "firebase/auth";
import { Database, getDatabase } from "firebase/database";
import { Firestore, getFirestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";

type FirebaseSession = {
    uid: string;
    custom_token: string;
} | null;

type FirebaseWebConfig = {
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
    databaseURL?: string;
    messagingSenderId?: string;
    storageBucket?: string;
};

let firebaseWarningShown = false;

function resolveFirebaseWebConfig(): FirebaseWebConfig | null {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const appId = import.meta.env.VITE_FIREBASE_APP_ID;
    const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL;
    const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
    const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;

    if (!apiKey || !authDomain || !projectId || !appId) {
        if (!firebaseWarningShown) {
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
        databaseURL,
        messagingSenderId,
        storageBucket,
    };
}

function getFirebaseApp(): FirebaseApp | null {
    const config = resolveFirebaseWebConfig();

    if (!config) {
        return null;
    }

    return getApps().length > 0 ? getApp() : initializeApp(config);
}

let firestoreInstance: Firestore | null = null;
export function getFirebaseFirestore(): Firestore | null {
    const app = getFirebaseApp();

    if (!app) {
        return null;
    }

    if (firestoreInstance) {
        return firestoreInstance;
    }

    try {
        // Try to enable IndexedDB persistence first
        firestoreInstance = initializeFirestore(app, {
            localCache: persistentLocalCache({
                cacheSizeBytes: 100 * 1024 * 1024, // 100 MB
            })
        });
        return firestoreInstance;
    } catch (error) {
        console.log(error)
        firestoreInstance = getFirestore(app);
        return firestoreInstance;
    }
}

export function getFirebaseDatabase(): Database | null {
    const app = getFirebaseApp();

    if (!app) {
        return null;
    }

    return getDatabase(app);
}

export function getFirebaseAuth(): Auth | null {
    const app = getFirebaseApp();

    if (!app) {
        return null;
    }

    return getAuth(app);
}

export async function syncFirebaseAuth(session: FirebaseSession): Promise<void> {
    const auth = getFirebaseAuth();

    if (!auth) {
        return;
    }

    if (!session) {
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

    if (!auth || !auth.currentUser) {
        return;
    }

    await signOut(auth);
}
