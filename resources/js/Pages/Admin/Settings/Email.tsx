import React, { useState } from "react";
import { Head } from "@inertiajs/react";
import axios from "axios";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Input,
  Typography,
} from "@material-tailwind/react";
import {
  MailIcon,
  PlugIcon,
  SendIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  Loader2Icon,
} from "lucide-react";
import { route } from "ziggy-js";
import AdminLayout from "@/Layouts/AdminLayout";
import { PageHeader } from "@/Components/PageHeader";

interface EmailConfigPageProps {
  emailConfig: {
    mailer: string;
    config: Record<string, string | null>;
    from: {
      address: string | null;
      name: string | null;
    };
  };
}

interface CheckConnectionResponse {
  status: "connected" | "failed";
  banner?: string;
  error?: string;
  error_type?: string;
  response_time_ms: number;
}

interface SendTestEmailResponse {
  success: boolean;
  message: string;
  sent_at?: string;
  error_type?: string;
}

export default function Index({ emailConfig }: EmailConfigPageProps) {
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [connectionResult, setConnectionResult] = useState<CheckConnectionResponse | null>(null);
  const [testEmailResult, setTestEmailResult] = useState<SendTestEmailResponse | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const isSmtp = emailConfig.mailer === "smtp";
  const isLoading = isCheckingConnection || isSendingTestEmail;

  const handleCheckConnection = async () => {
    setIsCheckingConnection(true);
    setConnectionResult(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await axios.post<CheckConnectionResponse>(
        route("admin.email-config.check-connection"),
        {},
        { signal: controller.signal }
      );
      setConnectionResult(response.data);
    } catch (error) {
      if (axios.isCancel(error) || (error instanceof Error && error.name === "AbortError")) {
        setConnectionResult({
          status: "failed",
          error: "Request timeout - koneksi melebihi batas waktu 30 detik",
          error_type: "timeout",
          response_time_ms: 30000,
        });
      } else {
        setConnectionResult({
          status: "failed",
          error: "Terjadi kesalahan jaringan. Silakan coba lagi.",
          error_type: "connection_refused",
          response_time_ms: 0,
        });
      }
    } finally {
      clearTimeout(timeout);
      setIsCheckingConnection(false);
    }
  };

  const handleSendTestEmail = async () => {
    setValidationErrors({});
    setTestEmailResult(null);

    if (!testEmailAddress.trim()) {
      setValidationErrors({ email: "Alamat email wajib diisi" });
      return;
    }

    setIsSendingTestEmail(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await axios.post<SendTestEmailResponse>(
        route("admin.email-config.send-test"),
        { email: testEmailAddress },
        { signal: controller.signal }
      );
      setTestEmailResult(response.data);
    } catch (error) {
      if (axios.isCancel(error) || (error instanceof Error && error.name === "AbortError")) {
        setTestEmailResult({
          success: false,
          message: "Request timeout - pengiriman melebihi batas waktu 30 detik",
          error_type: "timeout",
        });
      } else if (axios.isAxiosError(error) && error.response?.status === 422) {
        const errors = error.response.data.errors;
        if (errors?.email) {
          setValidationErrors({ email: errors.email[0] });
        }
      } else {
        setTestEmailResult({
          success: false,
          message: "Terjadi kesalahan jaringan. Silakan coba lagi.",
          error_type: "connection_refused",
        });
      }
    } finally {
      clearTimeout(timeout);
      setIsSendingTestEmail(false);
    }
  };

  const renderConfigValue = (value: string | number | null): string => {
    if (value === null || value === "") {
      return "Not Set";
    }
    return String(value);
  };

  const getConfigLabel = (key: string): string => {
    const labels: Record<string, string> = {
      host: "Host",
      port: "Port",
      encryption: "Encryption",
      username: "Username",
      password_status: "Password",
      region: "Region",
      token_status: "Token",
      domain: "Domain",
      endpoint: "Endpoint",
      transport: "Transport",
    };
    return labels[key] || key;
  };

  return (
    <>
      <Head title="Email Configuration" />

      <div className="p-4 space-y-6 min-h-[calc(100vh-8rem)]">
        <PageHeader
          title="Email Configuration"
          description="Verifikasi konfigurasi email dan kirim test email untuk memastikan pengaturan berfungsi."
        />

        {/* Active Mailer Info */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="p-4 md:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500 bg-opacity-10 text-blue-600">
                <MailIcon className="w-5 h-5" />
              </div>
              <div>
                <Typography className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Active Mailer
                </Typography>
                <Typography variant="h5" className="font-bold text-slate-800 dark:text-white">
                  {emailConfig.mailer.toUpperCase()}
                </Typography>
              </div>
            </div>

            {/* Config Fields Table */}
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800">
                    <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">
                      Field
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {Object.entries(emailConfig.config).map(([key, value]) => (
                    <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300">
                        {getConfigLabel(key)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            value === null || value === ""
                              ? "text-slate-400 italic"
                              : "text-slate-800 dark:text-white"
                          }
                        >
                          {renderConfigValue(value)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300">
                      From Address
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          emailConfig.from.address === null
                            ? "text-slate-400 italic"
                            : "text-slate-800 dark:text-white"
                        }
                      >
                        {renderConfigValue(emailConfig.from.address)}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300">
                      From Name
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          emailConfig.from.name === null
                            ? "text-slate-400 italic"
                            : "text-slate-800 dark:text-white"
                        }
                      >
                        {renderConfigValue(emailConfig.from.name)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Check Connection - Only for SMTP */}
        {isSmtp && (
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardBody className="p-4 md:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500 bg-opacity-10 text-green-600">
                  <PlugIcon className="w-5 h-5" />
                </div>
                <div>
                  <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">
                    Check Connection
                  </Typography>
                  <Typography className="text-sm text-slate-500 dark:text-slate-400">
                    Uji koneksi ke server SMTP tanpa mengirim email.
                  </Typography>
                </div>
              </div>

              <Button
                onClick={handleCheckConnection}
                disabled={isLoading}
                className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900"
              >
                {isCheckingConnection ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <PlugIcon className="h-4 w-4" />
                )}
                {isCheckingConnection ? "Checking..." : "Check Connection"}
              </Button>

              {connectionResult && (
                <Alert
                  color={connectionResult.status === "connected" ? "success" : "error"}
                  className="mt-4"
                >
                  <div className="flex items-start gap-2">
                    {connectionResult.status === "connected" ? (
                      <CheckCircle2Icon className="h-5 w-5 mt-0.5 shrink-0" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 mt-0.5 shrink-0" />
                    )}
                    <div className="space-y-1">
                      <Typography className="font-semibold">
                        {connectionResult.status === "connected"
                          ? "Connected"
                          : "Connection Failed"}
                      </Typography>
                      {connectionResult.banner && (
                        <Typography className="text-sm">
                          Server: {connectionResult.banner}
                        </Typography>
                      )}
                      {connectionResult.error && (
                        <Typography className="text-sm">
                          {connectionResult.error}
                        </Typography>
                      )}
                      <div className="flex items-center gap-1 text-sm opacity-75">
                        <ClockIcon className="h-3 w-3" />
                        <span>{connectionResult.response_time_ms}ms</span>
                      </div>
                    </div>
                  </div>
                </Alert>
              )}
            </CardBody>
          </Card>
        )}

        {/* Send Test Email */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="p-4 md:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500 bg-opacity-10 text-purple-600">
                <SendIcon className="w-5 h-5" />
              </div>
              <div>
                <Typography variant="h6" className="font-bold text-slate-800 dark:text-white">
                  Send Test Email
                </Typography>
                <Typography className="text-sm text-slate-500 dark:text-slate-400">
                  Kirim email percobaan untuk memverifikasi konfigurasi berfungsi.
                </Typography>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={testEmailAddress}
                  onChange={(e) => {
                    setTestEmailAddress(e.target.value);
                    if (validationErrors.email) {
                      setValidationErrors({});
                    }
                  }}
                  disabled={isLoading}
                  className="dark:text-white"
                  isError={!!validationErrors.email}
                />
                {validationErrors.email && (
                  <Typography className="text-xs text-red-500 mt-1">
                    {validationErrors.email}
                  </Typography>
                )}
              </div>
              <Button
                onClick={handleSendTestEmail}
                disabled={isLoading}
                className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 shrink-0"
              >
                {isSendingTestEmail ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <SendIcon className="h-4 w-4" />
                )}
                {isSendingTestEmail ? "Sending..." : "Send Test Email"}
              </Button>
            </div>

            {testEmailResult && (
              <Alert
                color={testEmailResult.success ? "success" : "error"}
                className="mt-4"
              >
                <div className="flex items-start gap-2">
                  {testEmailResult.success ? (
                    <CheckCircle2Icon className="h-5 w-5 mt-0.5 shrink-0" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 mt-0.5 shrink-0" />
                  )}
                  <div className="space-y-1">
                    <Typography className="font-semibold">
                      {testEmailResult.success
                        ? "Email Sent Successfully"
                        : "Failed to Send Email"}
                    </Typography>
                    <Typography className="text-sm">
                      {testEmailResult.message}
                    </Typography>
                    {testEmailResult.sent_at && (
                      <div className="flex items-center gap-1 text-sm opacity-75">
                        <ClockIcon className="h-3 w-3" />
                        <span>Sent at: {testEmailResult.sent_at}</span>
                      </div>
                    )}
                    {testEmailResult.error_type && (
                      <Typography className="text-xs opacity-75">
                        Error type: {testEmailResult.error_type}
                      </Typography>
                    )}
                  </div>
                </div>
              </Alert>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

Index.layout = (page: React.ReactNode) => {
  return <AdminLayout>{page}</AdminLayout>;
};
