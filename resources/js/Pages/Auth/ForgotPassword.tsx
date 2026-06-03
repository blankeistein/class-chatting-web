import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { Button, Card, Input, Spinner, Typography } from "@material-tailwind/react";
import { ArrowLeft } from "lucide-react";
import { FormEvent } from "react";
import { route } from "ziggy-js";
import toast, { Toaster } from "react-hot-toast";
import { Turnstile } from "@marsidev/react-turnstile";

export default function ForgotPassword() {
  const page = usePage();
  const { data, setData, post, processing } = useForm({
    email: "",
    "cf-turnstile-response": "",
  });
  const turnstileSiteKey = page.props?.turnstile_site_key as string | null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    post(route("password.email"), {
      onSuccess: () => {
        toast.success("Link reset password telah dikirim ke email kamu.");
      },
      onError: (errors) => {
        Object.values(errors).forEach((error) => {
          toast.error(error);
        });
      },
    });
  };

  return (
    <>
      <Head title="Lupa Password" />
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
              <img
                src="/assets/images/icons/lestari-ilmu.webp"
                alt=""
                className="w-16 h-16 mb-4"
              />
              <Typography as="h2" type="h4" className="mb-2">
                Lupa Password
              </Typography>
              <Typography type="lead" className="text-foreground">
                Masukkan email kamu dan kami akan mengirimkan link untuk reset
                password.
              </Typography>
              <form className="mt-6" onSubmit={handleSubmit}>
                <div className="mb-6 space-y-1.5">
                  <Typography
                    as="label"
                    htmlFor="email"
                    type="small"
                    color="default"
                    className="font-semibold"
                  >
                    Email
                  </Typography>
                  <Input
                    size="lg"
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData("email", e.target.value)}
                    placeholder="email@kamu.com"
                  />
                </div>
                {turnstileSiteKey && (
                  <Turnstile
                    siteKey={turnstileSiteKey}
                    onSuccess={(token) => {
                      setData("cf-turnstile-response", token);
                    }}
                    className="mb-6"
                  />
                )}

                <Button size="lg" isFullWidth disabled={processing}>
                  {processing && <Spinner size="sm" className="mr-2" />}
                  Kirim Link Reset Password
                </Button>
              </form>
              <div className="mt-6 text-center">
                <Link
                  href={route("login")}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke halaman login
                </Link>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <Toaster position="top-center" />
    </>
  );
}
