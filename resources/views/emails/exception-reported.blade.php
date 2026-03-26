<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Exception Report</title>
</head>
<body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
    <h1 style="margin-bottom: 8px;">Application Exception Report</h1>

    <p style="margin-top: 0;">
        An exception was reported by {{ $report['app_name'] }} in the <strong>{{ $report['environment'] }}</strong> environment.
    </p>

    <h2>Summary</h2>
    <ul>
        <li><strong>Time:</strong> {{ $report['occurred_at'] }}</li>
        <li><strong>Exception:</strong> {{ $report['exception_class'] }}</li>
        <li><strong>Message:</strong> {{ $report['message'] }}</li>
        <li><strong>File:</strong> {{ $report['file'] }}</li>
        <li><strong>Method:</strong> {{ $report['method'] }}</li>
        <li><strong>URL:</strong> {{ $report['url'] }}</li>
        <li><strong>IP:</strong> {{ $report['ip'] ?? '-' }}</li>
        <li><strong>User Agent:</strong> {{ $report['user_agent'] ?? '-' }}</li>
    </ul>

    <h2>User</h2>
    <pre style="background: #f3f4f6; padding: 12px; border-radius: 6px;">{{ json_encode($report['user'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: 'Guest' }}</pre>

    <h2>Input</h2>
    <pre style="background: #f3f4f6; padding: 12px; border-radius: 6px;">{{ $report['input'] }}</pre>

    <h2>Trace</h2>
    <pre style="background: #111827; color: #f9fafb; padding: 12px; border-radius: 6px; white-space: pre-wrap;">{{ $report['trace'] }}</pre>

    <h2>Latest Log Excerpt</h2>
    <pre style="background: #111827; color: #f9fafb; padding: 12px; border-radius: 6px; white-space: pre-wrap;">{{ $report['log_excerpt'] }}</pre>
</body>
</html>
