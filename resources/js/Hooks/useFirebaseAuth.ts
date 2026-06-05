import { useEffect, useState, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { getFirebaseAuth, syncFirebaseAuth } from '@/lib/firebase';
import { usePage, router } from '@inertiajs/react';
import { AuthProps } from '@/types/global';
import { route } from 'ziggy-js';
import { NotificationError } from '@/utils';

interface UseFirebaseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

export function useFirebaseAuth(): UseFirebaseAuthReturn {
  const auth = getFirebaseAuth();
  const props = usePage<AuthProps>().props;

  const [user, setUser] = useState<User | null>(auth?.currentUser || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasAttemptedReAuth, setHasAttemptedReAuth] = useState<boolean>(true);

  const autoSyncFirebaseAuth = useCallback(() => {
    if (!auth || !props.auth.user) {
      setLoading(false);
      return;
    }

    // If Laravel user exists but Firebase user doesn't, attempt to sync
    if (props.auth.user && !auth.currentUser) {
      setLoading(true)
      router.get(route('authenticate-firebase-user'), undefined, {
        onSuccess: async (page) => {
          const firebaseAuth = (page.props as {
            auth?: {
              firebase?: {
                uid: string;
                custom_token: string;
              } | null;
            };
          }).auth?.firebase ?? null;

          await syncFirebaseAuth(firebaseAuth);
          setError(null);
        },
        onError: (errors) => {
          // setError(errors);
          // hasAttemptedReAuth.current = true;
        },
        onFinish: () => {
          setLoading(false);
          setHasAttemptedReAuth(true);
        }
      })
    } else {
      setLoading(false);
    }
  }, [])

  // Listen to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firebase auth state change error:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  // Auto-sync Firebase auth if Laravel user exists but Firebase user doesn't
  useEffect(() => {
    if (loading) return;

    if (!user) {
      autoSyncFirebaseAuth();
    }
  }, [auth, props.auth.user, autoSyncFirebaseAuth, loading]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    error,
  };
}
