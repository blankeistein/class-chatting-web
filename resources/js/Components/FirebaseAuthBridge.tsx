import { usePage } from "@inertiajs/react";
import { useEffect } from "react";
import { syncFirebaseAuth } from "../lib/firebase";
import { AuthProps } from "../types/global";

export function FirebaseAuthBridge(): null {
    const { auth } = usePage<AuthProps>().props;

    useEffect(() => {
        void syncFirebaseAuth(auth.firebase);
    }, [auth.firebase]);

    return null;
}
