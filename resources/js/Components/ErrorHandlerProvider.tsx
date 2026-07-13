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

    // Validation errors (422) — form bag / session errors from Inertia page response.
    const unsubscribeError = router.on('error', (errors) => {
      notif(errors.detail.errors);
    });

    // Non-Inertia HTTP responses (e.g. bare 403 HTML) fire "invalid", not "error".
    // Returning false prevents Inertia's default full-page error modal.
    const unsubscribeInvalid = router.on('invalid', (event) => {
      const status = event.detail.response?.status;
      const message =
        status === 403
          ? 'Kamu tidak punya hak untuk melakukan aksi ini.'
          : status === 404
            ? 'Data tidak ditemukan.'
            : status === 419
              ? 'Sesi berakhir. Muat ulang halaman lalu coba lagi.'
              : status && status >= 500
                ? 'Terjadi kesalahan server. Silakan coba lagi.'
                : 'Terjadi kesalahan. Silakan coba lagi.';

      notif(message);

      return false;
    });

    const unsubscribeException = router.on('exception', (event) => {
      const exception = event.detail.exception;
      notif(exception?.message || 'Terjadi kesalahan jaringan. Silakan coba lagi.');

      return false;
    });

    // Pasang listener saat aplikasi di-load
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Bersihkan listener saat komponen unmount (anti-memory leak)
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      unsubscribeError();
      unsubscribeInvalid();
      unsubscribeException();
    };
  }, [notif]);

  return (
    <>
      {children}
      <Toaster position={placement} />
    </>
  )
}
