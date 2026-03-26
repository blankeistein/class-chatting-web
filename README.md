# class-chatting-web

`class-chatting-web` adalah aplikasi web berbasis Laravel 12, Inertia.js v2, React 19, dan Tailwind CSS untuk mengelola ekosistem konten Class Chatting. Proyek ini menyediakan landing page publik, panel admin, manajemen konten, wilayah, pengguna, kode aktivasi, notifikasi, serta workspace `learn-reading`.

## Fitur Utama

- Landing page publik di `/`
- Autentikasi login dan logout
- Panel admin di prefix yang mengikuti `ADMIN_PATH` pada `.env` (default: `/admin`)
- Manajemen kode aktivasi
- Manajemen buku dan video
- Manajemen data wilayah
- Manajemen pengguna
- Notifikasi pengguna
- Workspace `learn-reading` untuk dashboard, preview, dan halaman belajar
- Halaman utilitas tambahan seperti `folder-explorer`, `buku-manager`, `preview-surah`, dan `penai`

## Stack

- PHP 8.3
- Laravel 12
- Inertia.js v2
- React 19 + TypeScript
- Tailwind CSS 3
- Ziggy
- Pest 3 untuk testing
- Laravel Pint untuk formatting PHP
- Firebase melalui `kreait/laravel-firebase`

## Struktur Singkat

- `app/Http/Controllers` berisi controller aplikasi dan admin
- `resources/js/Pages` berisi halaman Inertia React
- `resources/js/Layouts` berisi layout utama aplikasi
- `resources/views` berisi root Blade untuk entry Inertia
- `routes/web.php` berisi route web utama
- `database/seeders` berisi seed data awal aplikasi

## Menjalankan Secara Lokal

1. Install dependency backend dan frontend:

```bash
composer install
npm install
```

2. Siapkan environment:

```bash
copy .env.example .env
php artisan key:generate
```

3. Sesuaikan konfigurasi database di `.env`, lalu jalankan migrasi dan seeder:

```bash
php artisan migrate --seed
```

4. Jalankan aplikasi:

```bash
composer run dev
```

Alternatif lain:

```bash
php artisan serve
npm run dev
```

## Script Penting

```bash
composer run dev
npm run dev
npm run build
php artisan test --compact
vendor/bin/pint --dirty --format agent
```

## Catatan

- Nama aplikasi dikontrol oleh `APP_NAME` di `.env`.
- Judul halaman Inertia menggunakan nama aplikasi dari konfigurasi Laravel dan `VITE_APP_NAME`.
- Jika perubahan frontend tidak terlihat, jalankan `npm run build` atau `npm run dev`.
- Seeder default memanggil `SettingSeeder` dan membuat satu user contoh.

## Testing

Project ini menggunakan Pest. Untuk menjalankan test:

```bash
php artisan test --compact
```
