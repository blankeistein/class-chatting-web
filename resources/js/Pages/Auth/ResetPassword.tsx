import { Head, useForm, usePage } from "@inertiajs/react";
import {
  Button,
  Card,
  IconButton,
  Input,
  Spinner,
  Typography,
} from "@material-tailwind/react";
import { EyeClosedIcon, EyeIcon } from "lucide-react";
import { FormEvent, useState } from "react";
import { route } from "ziggy-js";
import toast, { Toaster } from "react-hot-toast";
import ReCAPTCHA from "react-google-recaptcha";

interface ResetPasswordProps {
  token: string;
  email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
  const page = usePage();
  const { data, setData, post, processing } = useForm({
    token,
    email,
    password: "",
    password_confirmation: "",
    "g-recaptcha-response": "",
  });
  const [passwordType, setPasswordType] = useState("password");
  const [confirmType, setConfirmType] = useState("password");
  const recaptchaSiteKey = page.props?.recaptcha_site_key as string | null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    post(route("password.update"), {
      onSuccess: () => {
        toast.success("Password berhasil direset. Silakan login.");
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
      <Head title="Reset Password" />
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
                Reset Password
              </Typography>
              <Typography type="lead" className="text-foreground">
                Masukkan password baru kamu.
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
                    disabled
                  />
                </div>
                <div className="mb-6 space-y-1.5">
                  <Typography
                    as="label"
                    htmlFor="password"
                    type="small"
                    color="default"
                    className="font-semibold"
                  >
                    Password Baru
                  </Typography>
                  <Input
                    size="lg"
                    id="password"
                    type={passwordType}
                    value={data.password}
                    onChange={(e) => setData("password", e.target.value)}
                    placeholder="********"
                    autoComplete="new-password"
                  >
                    <Input.Icon
                      as={IconButton}
                      type="button"
                      variant="ghost"
                      placement="end"
                      color="secondary"
                      className="data-[placement=end]:right-1.5 !absolute select-auto z-10 pointer-events-auto"
                      onClick={() =>
                        setPasswordType(
                          passwordType === "password" ? "text" : "password"
                        )
                      }
                    >
                      {passwordType === "password" ? (
                        <EyeClosedIcon className="h-6 w-6" />
                      ) : (
                        <EyeIcon className="h-6 w-6" />
                      )}
                    </Input.Icon>
                  </Input>
                </div>
                <div className="mb-6 space-y-1.5">
                  <Typography
                    as="label"
                    htmlFor="password_confirmation"
                    type="small"
                    color="default"
                    className="font-semibold"
                  >
                    Konfirmasi Password
                  </Typography>
                  <Input
                    size="lg"
                    id="password_confirmation"
                    type={confirmType}
                    value={data.password_confirmation}
                    onChange={(e) =>
                      setData("password_confirmation", e.target.value)
                    }
                    placeholder="********"
                    autoComplete="new-password"
                  >
                    <Input.Icon
                      as={IconButton}
                      type="button"
                      variant="ghost"
                      placement="end"
                      color="secondary"
                      className="data-[placement=end]:right-1.5 !absolute select-auto z-10 pointer-events-auto"
                      onClick={() =>
                        setConfirmType(
                          confirmType === "password" ? "text" : "password"
                        )
                      }
                    >
                      {confirmType === "password" ? (
                        <EyeClosedIcon className="h-6 w-6" />
                      ) : (
                        <EyeIcon className="h-6 w-6" />
                      )}
                    </Input.Icon>
                  </Input>
                </div>
                {recaptchaSiteKey && (
                  <ReCAPTCHA
                    sitekey={recaptchaSiteKey}
                    onChange={(value) => {
                      setData("g-recaptcha-response", value || "");
                    }}
                    className="mb-6"
                  />
                )}

                <Button size="lg" isFullWidth disabled={processing}>
                  {processing && <Spinner size="sm" className="mr-2" />}
                  Reset Password
                </Button>
              </form>
            </Card.Body>
          </Card>
        </div>
      </div>

      <Toaster position="top-center" />
    </>
  );
}
