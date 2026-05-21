<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Test Email</title>
</head>

<body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
    <h1 style="margin-bottom: 8px;">Email Configuration Test</h1>

    <p>This is a test email sent from the <strong>Email Configuration Checker</strong>.</p>

    <p>If you are receiving this email, your email configuration is working correctly.</p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

    <p style="font-size: 12px; color: #6b7280;">
        Sent from {{ config('app.name') }} at {{ now()->format('d M Y H:i:s') }}
    </p>
</body>

</html>
