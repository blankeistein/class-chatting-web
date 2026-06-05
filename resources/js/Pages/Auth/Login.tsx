import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { Button, Card, IconButton, Input, Spinner, Typography } from "@material-tailwind/react";
import { EyeClosedIcon, EyeIcon } from "lucide-react";
import { FormEvent, useState } from "react";
import { route } from "ziggy-js";
import toast, { Toaster } from "react-hot-toast";
import { syncFirebaseAuth, getFirebaseAuth } from "@/lib/firebase";
import { Turnstile } from "@marsidev/react-turnstile";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import axios from "axios";

export default function Login() {
  const page = usePage();
  const { data, setData, post, processing } = useForm({
    email: "",
    password: "",
    "cf-turnstile-response": ""
  });
  const [inputType, setInputType] = useState("password");
  const [googleLoading, setGoogleLoading] = useState(false);
  const turnstileSiteKey = page.props?.turnstile_site_key as string | null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    post(route('login'), {
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
      },
      onError: (errors) => {
        Object.values(errors).forEach((error) => {
          toast.error(error);
        });
      }
    });
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        toast.error("Firebase tidak tersedia");
        return;
      }

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // Send ID token to backend
      const response = await axios.post(route('auth.firebase.google'), {
        id_token: idToken,
      });

      if (response.data.firebase_auth) {
        await syncFirebaseAuth(response.data.firebase_auth);
      }

      toast.success(response.data.message || "Login berhasil");
      
      // Redirect to dashboard
      window.location.href = response.data.redirect;
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error("Login dibatalkan");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Gagal login dengan Google");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <>
      <Head title="Masuk" />
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
            backgroundSize:
              "48px 48px, 48px 48px, 100% 100%, 100% 100%",
          }}
        />
        <div className="grid place-items-center min-w-screen min-h-screen p-4 relative z-[1] select-none">
          <Card className="w-full max-w-md mx-auto p-4 bg-background">
            <Card.Body>
              <img src="/assets/images/icons/lestari-ilmu.webp" alt="" className="w-16 h-16 mb-4" />
              <Typography as="h2" type="h4" className="mb-2">
                Masuk
              </Typography>
              <Typography type="lead" className="text-foreground">
                Masukkan email dan password kamu untuk masuk
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
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="email@kamu.com"
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
                    Password
                  </Typography>
                  <Input
                    size="lg"
                    id="password"
                    type={inputType}
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="********"
                    autoComplete="off"
                  >
                    <Input.Icon
                      as={IconButton}
                      type="button"
                      variant="ghost"
                      placement="end"
                      color="secondary"
                      className="data-[placement=end]:right-1.5 !absolute select-auto z-10 pointer-events-auto"
                      onClick={() =>
                        setInputType(inputType === "password" ? "text" : "password")
                      }
                    >
                      {inputType === "password" ? (
                        <EyeClosedIcon className="h-6 w-6" />
                      ) : (
                        <EyeIcon className="h-6 w-6" />
                      )}
                    </Input.Icon>
                  </Input>
                  <div className="mt-1.5 text-right">
                    <Link
                      href={route("password.request")}
                      className="text-sm text-primary hover:underline"
                    >
                      Lupa password?
                    </Link>
                  </div>
                </div>
                {turnstileSiteKey && (
                  <Turnstile
                    siteKey={turnstileSiteKey}
                    onSuccess={(token) => {
                      setData('cf-turnstile-response', token);
                    }}
                    className="mb-6"
                  />
                )}

                <Button size="lg" isFullWidth disabled={processing}>
                  {
                    processing && (
                      <Spinner size="sm" className="mr-2" />
                    )
                  }
                  Sign In
                </Button>
              </form>
              <div className="my-6">
                <Button 
                  size="lg" 
                  variant="outline" 
                  color="secondary" 
                  isFullWidth
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || processing}
                >
                  {googleLoading && <Spinner size="sm" className="mr-2" />}
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <Toaster position="top-center" />
    </>
  );
}
