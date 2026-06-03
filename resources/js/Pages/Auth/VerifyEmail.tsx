import { Head, useForm, usePage } from "@inertiajs/react";
import { Button, Card, Spinner, Typography } from "@material-tailwind/react";
import { MailCheck } from "lucide-react";
import { FormEvent, useRef } from "react";
import { route } from "ziggy-js";
import toast, { Toaster } from "react-hot-toast";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";

export default function VerifyEmail() {
  const page = usePage();
  const { data, setData, post, processing } = useForm({
    "cf-turnstile-response": "",
  });
  const turnstileSiteKey = page.props?.turnstile_site_key as string | null;
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    post(route("verification.send"), {
      onSuccess: (page) => {
        const status = (page.props as { flash?: { status?: string } }).flash
          ?.status;
        if (status) {
          toast.success(status);
        }
        turnstileRef.current?.reset();
        setData("cf-turnstile-response", "");
      },
      onError: (errors) => {
        Object.values(errors).forEach((error) => {
          toast.error(error);
        });
        turnstileRef.current?.reset();
        setData("cf-turnstile-response", "");
      },
    });
  };

  return (
    <>
      <Head title="Verifikasi Email" />
      <div className="min-h-screen w-full bg-background relative">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
        linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
        radial-gradient(circle 500px at 20% 100%, rgba(139,92,246,0.3), transparent),
        radial-gradient(circle 500px at 100% 80%, rgba(59,130,246,0.3), transparent)
      `,
            backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
          }}
        />
        <div className="grid place-items-center min-w-screen min-h-screen p-4 relative z-[1] select-none">
          <Card className="w-full max-w-md mx-auto p-4 bg-background">
            <Card.Body>
              <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10">
                <MailCheck className="w-8 h-8 text-primary" />
              </div>
              <Typography as="h2" type="h4" className="mb-2">
                Verifikasi Email
              </Typography>
              <Typography type="lead" className="text-foreground">
                Terima kasih telah mendaftar! Sebelum melanjutkan, silakan
                verifikasi alamat email kamu dengan mengklik link yang telah kami
                kirimkan. Jika belum menerima email, klik tombol di bawah untuk
                mengirim ulang.
              </Typography>
              <form className="mt-6" onSubmit={handleSubmit}>
                {turnstileSiteKey && (
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={turnstileSiteKey}
                    onSuccess={(token) => {
                      setData("cf-turnstile-response", token);
                    }}
                    className="mb-6"
                  />
                )}

                <Button size="lg" isFullWidth disabled={processing}>
                  {processing && <Spinner size="sm" className="mr-2" />}
                  Kirim Ulang Email Verifikasi
                </Button>
              </form>
              <Typography
                type="small"
                className="text-muted-foreground mt-4 text-center"
              >
                Email verifikasi hanya bisa dikirim ulang setiap 5 menit.
              </Typography>
            </Card.Body>
          </Card>
        </div>
      </div>

      <Toaster position="top-center" />
    </>
  );
}
