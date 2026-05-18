<?php

/**
 * pack-deploy.php
 * Pack Laravel project jadi ZIP siap upload ke cPanel
 * Jalankan via: composer run pack
 * Atau langsung: php scripts/pack-deploy.php
 */

// --- Helper output ---
function info(string $msg): void
{
    echo "\033[36m[INFO]  $msg\033[0m\n";
}
function warn(string $msg): void
{
    echo "\033[33m[WARN]  $msg\033[0m\n";
}
function err(string $msg): void
{
    echo "\033[31m[ERROR] $msg\033[0m\n";
}
function ask(string $question): string
{
    echo "\033[33m$question\033[0m ";

    return strtolower(trim(fgets(STDIN)));
}

// --- Cek root Laravel ---
if (! file_exists('artisan')) {
    err('Jalankan dari root folder Laravel (ada file artisan)');
    exit(1);
}

if (! class_exists('ZipArchive')) {
    err('PHP ZipArchive extension tidak tersedia. Install php-zip.');
    exit(1);
}

$projectName = basename(getcwd());
$timestamp = date('Ymd_His');
$outputDir = 'scripts/dist';
$outputFile = "$outputDir/{$projectName}_{$timestamp}.zip";
$source = getcwd();

echo "\n";
echo "\033[34m======================================\033[0m\n";
echo "\033[34m      Laravel Deploy Packer           \033[0m\n";
echo "\033[34m======================================\033[0m\n\n";

// --- Cek npm build ---
if (! is_dir('public/build')) {
    warn('Folder public/build tidak ditemukan.');
    if (ask("  Jalankan 'npm run build' sekarang? (y/n)") === 'y') {
        info('Menjalankan npm run build...');
        passthru('npm run build', $code);
        if ($code !== 0) {
            err('npm run build gagal.');
            exit(1);
        }
    }
}

// --- Cek vendor ---
if (! is_dir('vendor')) {
    warn('Folder vendor tidak ditemukan.');
    if (ask("  Jalankan 'composer install' sekarang? (y/n)") === 'y') {
        info('Menjalankan composer install --no-dev...');
        passthru('composer install --no-dev --optimize-autoloader', $code);
        if ($code !== 0) {
            err('composer install gagal.');
            exit(1);
        }
    }
}

// --- Buat folder output ---
if (! is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

// --- Daftar exclude ---
$excludeDirs = [
    '.git',
    'node_modules',
    'vendor',
    '.agents',
    '.codex',
    '.kiro',
    'scripts',
    'storage/logs',
    'storage/framework/cache/data',
    'storage/framework/sessions',
    'storage/framework/views',
    'storage/debugbar',
    'tests',
    'scripts/dist',
    '.idea',
    '.vscode',
];

$excludeFiles = [
    '.env',
    '.env.local',
    '.env.production',
    '.env.staging',
    '.phpunit.result.cache',
    'phpunit.xml',
    'docker-compose.yml',
    'docker-compose.yaml',
    'Makefile',
    'Thumbs.db',
    '.DS_Store',
    'npm-debug.log',
];

$excludeExtensions = ['log', 'zip'];

// --- Buka ZIP langsung ---
info("Membuat ZIP: $outputFile");

$zip = new ZipArchive;
if ($zip->open($outputFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
    err("Tidak bisa membuat file ZIP: $outputFile");
    exit(1);
}

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($source, RecursiveDirectoryIterator::SKIP_DOTS),
    RecursiveIteratorIterator::LEAVES_ONLY
);

$addedCount = 0;
$skippedCount = 0;

foreach ($iterator as $file) {
    // Normalisasi ke forward slash
    $relPath = str_replace('\\', '/', substr($file->getRealPath(), strlen($source) + 1));

    $skip = false;

    // Cek exclude dir
    foreach ($excludeDirs as $ex) {
        if ($relPath === $ex || str_starts_with($relPath, $ex.'/')) {
            $skip = true;
            break;
        }
    }

    // Cek exclude file & ekstensi
    if (! $skip && $file->isFile()) {
        if (in_array(basename($relPath), $excludeFiles)) {
            $skip = true;
        } elseif (in_array($file->getExtension(), $excludeExtensions)) {
            $skip = true;
        }
    }

    if ($skip) {
        $skippedCount++;

        continue;
    }

    if ($file->isFile()) {
        $zip->addFile($file->getRealPath(), $relPath);
        $addedCount++;
    }
}

// --- Tambah folder storage yang kosong via addEmptyDir ---
$emptyDirs = [
    'storage/framework/cache/data',
    'storage/framework/sessions',
    'storage/framework/views',
    'storage/logs',
    'bootstrap/cache',
];

foreach ($emptyDirs as $dir) {
    if ($zip->locateName($dir.'/') === false) {
        $zip->addEmptyDir($dir);
    }
}

$zip->close();

// --- Hasil ---
if (file_exists($outputFile)) {
    $sizeMB = round(filesize($outputFile) / 1024 / 1024, 2);

    echo "\n";
    echo "\033[32m======================================\033[0m\n";
    echo "\033[32m  [OK] ZIP berhasil dibuat!           \033[0m\n";
    echo "\033[32m======================================\033[0m\n\n";
    echo "  File    : \033[32m".realpath($outputFile)."\033[0m\n";
    echo "  Ukuran  : \033[32m{$sizeMB} MB\033[0m\n";
    echo "  Ditambah: \033[32m{$addedCount} file\033[0m\n";
    echo "  Di-skip : \033[33m{$skippedCount} file\033[0m\n\n";
    echo "\033[33m[NEXT STEPS]\033[0m\n";
    echo "  1. Upload ZIP ke cPanel File Manager\n";
    echo "  2. Extract ke folder laravel/ (bukan public_html)\n";
    echo "  3. Buat .env dari .env.example di server (hanya pertama kali)\n";
    echo "  4. Terminal cPanel: composer install --no-dev\n";
    echo "  5. Terminal cPanel: php artisan migrate --force\n";
    echo "  6. Terminal cPanel: php artisan config:cache\n\n";
    echo "\033[36m[PERTAMA KALI DEPLOY]\033[0m\n";
    echo "  Tambahkan: php artisan key:generate (hanya jika .env baru)\n\n";
} else {
    err('Gagal membuat ZIP.');
    exit(1);
}
