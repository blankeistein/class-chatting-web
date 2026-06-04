<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title inertia>{{ config('app.name', 'Class Chatting Web') }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,100..900;1,100..900&family=Quicksand:wght@300..700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap"
        rel="stylesheet">

    @viteReactRefresh
    @if (auth()->check())
        @if (in_array(auth()->user()->role, [\App\Enums\RoleEnum::Admin, \App\Enums\RoleEnum::Staff], true))
            @routes
        @elseif (in_array(auth()->user()->role, [\App\Enums\RoleEnum::Teacher], true))
            @routes(['teacher', 'auth'])
        @elseif (in_array(auth()->user()->role, [\App\Enums\RoleEnum::Student, \App\Enums\RoleEnum::User], true))
            @routes(['user', 'auth'])
        @endif
    @else
        @routes(['auth'])
    @endif

    @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body class="min-h-screen bg-slate-50">
    @inertia
</body>

</html>
