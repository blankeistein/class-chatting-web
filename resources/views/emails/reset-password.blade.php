<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password | {{ config('app.name') }}</title>
</head>

<body style="margin: 0; padding: 0; background-color: #f5f4ef;">

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f4ef;">
        <tr>
            <td align="center" style="padding: 40px 16px;">

                {{-- Card --}}
                <table width="560" cellpadding="0" cellspacing="0" border="0"
                    style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e0ddd4;">

                    {{-- Header --}}
                    <tr>
                        <td align="center" style="background-color: #FBBF24; padding: 32px 40px 24px;">
                            <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td valign="middle" style="padding-right: 10px;">
                                        <div
                                            style="width: 40px; height: 40px; background-color: #1a1a1a; border-radius: 10px; overflow: hidden;">
                                            <img src="https://app.lestariilmu.id/assets/images/icons/class-chatting.webp"
                                                alt="Logo {{ config('app.name') }}" width="40" height="40"
                                                style="display: block; border: 0;">
                                        </div>
                                    </td>
                                    <td valign="middle">
                                        <span
                                            style="font-family: Arial, Helvetica, sans-serif; font-size: 20px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.3px;">
                                            {{ config('app.name') }}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="padding: 40px 40px 32px;">

                            {{-- Greeting --}}
                            <p
                                style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #888780; margin: 0 0 8px 0;">
                                Halo, {{ $name }} 👋
                            </p>

                            {{-- Title --}}
                            <h1
                                style="font-family: Arial, Helvetica, sans-serif; font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 16px 0; line-height: 1.3;">
                                Reset kata sandi<br>akun Anda
                            </h1>

                            {{-- Description --}}
                            <p
                                style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #5F5E5A; line-height: 1.7; margin: 0 0 32px 0;">
                                Kami menerima permintaan untuk mereset kata sandi akun Anda. Klik tombol di bawah
                                untuk membuat kata sandi baru. Jika Anda tidak merasa melakukan permintaan ini, abaikan
                                email ini.
                            </p>

                            {{-- CTA Button --}}
                            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                                style="margin-bottom: 32px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $resetUrl }}"
                                            style="display: inline-block; background-color: #FBBF24; color: #1a1a1a; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 40px; border-radius: 50px;">
                                            Reset Kata Sandi
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            {{-- Expiry Notice --}}
                            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                                style="margin-bottom: 32px;">
                                <tr>
                                    <td
                                        style="background-color: #FAEEDA; border-left: 3px solid #FBBF24; border-radius: 0 8px 8px 0; padding: 12px 16px;">
                                        <p
                                            style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #854F0B; line-height: 1.5; margin: 0;">
                                            ⏱ Tautan reset ini hanya berlaku selama <strong>{{ $expireMinutes }}
                                                menit</strong> sejak
                                            email ini dikirim.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            {{-- Divider --}}
                            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                                style="margin-bottom: 24px;">
                                <tr>
                                    <td style="border-top: 1px solid #e8e6de; font-size: 0; line-height: 0;">&nbsp;</td>
                                </tr>
                            </table>

                            {{-- Fallback Link --}}
                            <p
                                style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #888780; line-height: 1.6; margin: 0 0 8px 0;">
                                Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:
                            </p>
                            <p
                                style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #1a1a1a; line-height: 1.6; margin: 0 0 32px 0; word-break: break-all;">
                                {{ $resetUrl }}
                            </p>

                            {{-- Ignore Note --}}
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="background-color: #f5f4ef; border-radius: 8px; padding: 12px 16px;">
                                        <p
                                            style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #5F5E5A; line-height: 1.5; margin: 0;">
                                            ℹ️ Jika Anda tidak meminta reset kata sandi, tidak perlu khawatir. Akun Anda
                                            tetap aman dan Anda bisa mengabaikan email ini.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td align="center" style="border-top: 1px solid #e8e6de; padding: 24px 40px;">
                            <p
                                style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #B4B2A9; line-height: 1.6; margin: 0;">
                                Email ini dikirim secara otomatis ke <span
                                    style="color: #5F5E5A;">{{ $recipientEmail }}</span><br>
                                &copy; {{ date('Y') }} {{ config('app.name') }}.
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>

</html>
