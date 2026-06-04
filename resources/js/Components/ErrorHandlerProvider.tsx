import { NotificationError } from "@/utils";
import { router } from "@inertiajs/react";
import { ReactNode, useCallback, useEffect, useEffectEvent } from "react";
import toast, { Toaster, ToastPosition } from "react-hot-toast";

interface Props {
  children: ReactNode;
  placement?: ToastPosition;
}

export default function ErrorHandlerProvider({ children, placement = "top-center" }: Props) {

  const notif = useCallback((messages: string | Record<string, string>) => {
    if (typeof (messages) == "string") {
      toast.error(messages);
    } else {
      Object.values(messages).forEach((message) => {
        toast.error(message);
      })
    }
  }, []);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error instanceof NotificationError) {
        notif(event.error.messages);
        event.preventDefault();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof NotificationError) {
        notif(event.reason.messages);
        event.preventDefault();
      }
    };

    const unsubscribe = router.on('error', (errors) => {
      notif(errors.detail.errors);
    })

    // Pasang listener saat aplikasi di-load
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Bersihkan listener saat komponen unmount (anti-memory leak)
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      unsubscribe();
    };
  }, []);

  return (
    <>
      {children}
      <Toaster position={placement} />
    </>
  )
}
