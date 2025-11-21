<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title inertia>{{ config('app.name', 'App Lestari Ilmu') }}</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@700;900&family=Space+Mono:wght@400;700&display=swap"
        rel="stylesheet">
    @viteReactRefresh
    @routes
    @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
    @inertiaHead
</head>

<body class="min-h-screen bg-slate-50">
    @inertia
</body>

</html>
