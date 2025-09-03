<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title inertia>{{ config('app.name', 'App Lestari Ilmu') }}</title>
  @viteReactRefresh
  @routes
  @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
  @inertiaHead
</head>

<body class="min-h-screen bg-slate-50">
  @inertia
</body>

</html>
