import { useEffect } from "react";
import { syncFirebaseAuth } from "../lib/firebase";

type FirebaseAuthData = {
    uid: string;
    custom_token: string;
} | null;

export function FirebaseAuthBridge({ firebaseAuth }: { firebaseAuth: FirebaseAuthData }): null {
    useEffect(() => {
        void syncFirebaseAuth(firebaseAuth);
    }, [firebaseAuth]);

    return null;
}
