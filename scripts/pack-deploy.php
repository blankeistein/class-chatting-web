<?php

/**
 * pack-deploy.php
 * Pack Laravel project jadi ZIP siap upload ke cPanel
 * Menghasilkan DUA file ZIP terpisah:
 *   - {project}_laravel_{timestamp}.zip  → extract ke laravel/ di server
 *   - {project}_public_html_{timestamp}.zip → extract ke public_html/ di server
 *
 * Usage:
 *   php scripts/pack-deploy.php [options]
 *
 * Options:
 *   --include-vendor     Sertakan folder vendor/ dalam ZIP laravel
 *   --skip-build         Lewati pengecekan npm build
 *   --force              Lanjut meski ada warning
 *   --help               Tampilkan bantuan
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
function ok(string $msg): void
{
    echo "\033[32m[OK]    $msg\033[0m\n";
}

function createZip(string $outputFile, callable $filler): bool
{
    $zip = new ZipArchive;
    if ($zip->open($outputFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        err("Tidak bisa membuat file ZIP: $outputFile");

        return false;
    }
    $filler($zip);
    $zip->close();

    return file_exists($outputFile);
}

function printZipResult(string $label, string $outputFile, string $timestamp): void
{
    $sizeMB = round(filesize($outputFile) / 1024 / 1024, 2);
    $md5 = md5_file($outputFile);
    $name = basename($outputFile);

    echo "  \033[32m[$label]\033[0m\n";
    echo "  File    : \033[32m".realpath($outputFile)."\033[0m\n";
    echo "  Ukuran  : \033[32m{$sizeMB} MB\033[0m\n";
    echo "  MD5     : \033[90m{$md5}\033[0m\n";
    echo "  Verif   : \033[90mmd5sum $name\033[0m\n\n";
}

// --- Parse arguments ---
$args = array_slice($argv, 1);
$includeVendor = in_array('--include-vendor', $args);
$skipBuild = in_array('--skip-build', $args);
$force = in_array('--force', $args);

if (in_array('--help', $args)) {
    echo "\nUsage: php scripts/pack-deploy.php [options]\n\n";
    echo "Options:\n";
    echo "  --include-vendor   Sertakan folder vendor/ dalam ZIP laravel\n";
    echo "  --skip-build       Lewati pengecekan npm build\n";
    echo "  --force            Lanjut meski ada warning\n";
    echo "  --help             Tampilkan bantuan ini\n\n";
    echo "Contoh:\n";
    echo "  php scripts/pack-deploy.php\n";
    echo "  php scripts/pack-deploy.php --include-vendor\n\n";
    exit(0);
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
$outputDir = 'dist';
$source = getcwd();

$zipLaravel = "$outputDir/{$projectName}_laravel_{$timestamp}.zip";
$zipPublicHtml = "$outputDir/{$projectName}_public_html_{$timestamp}.zip";

echo "\n";
echo "\033[34m======================================\033[0m\n";
echo "\033[34m      Laravel Deploy Packer           \033[0m\n";
echo "\033[34m======================================\033[0m\n\n";

info('Output: dua ZIP terpisah (laravel + public_html)');
info('Vendor: '.($includeVendor ? 'disertakan' : 'tidak disertakan'));
echo "\n";

// --- Cek npm build ---
if (! $skipBuild) {
    if (! is_dir('public/build')) {
        err('Folder public/build tidak ditemukan. Jalankan: npm run build');
        err('Atau gunakan --skip-build untuk melewati pengecekan ini.');
        exit(1);
    }

    if (! file_exists('public/build/manifest.json') || filesize('public/build/manifest.json') === 0) {
        warn('public/build/manifest.json tidak ditemukan atau kosong.');
        if (! $force) {
            err('Gunakan --force untuk tetap lanjut.');
            exit(1);
        }
        warn('--force aktif, melanjutkan...');
    } else {
        ok('public/build/manifest.json ditemukan.');
    }
}

// --- Cek vendor ---
if ($includeVendor && ! is_dir('vendor')) {
    err('--include-vendor aktif tapi folder vendor/ tidak ditemukan.');
    err('Jalankan dulu: composer install --no-dev --optimize-autoloader');
    exit(1);
}

// --- Buat folder output ---
if (! is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

// ============================================================
// ZIP 1: laravel/ — semua kode Laravel termasuk public/build
// ============================================================
info("Membuat ZIP laravel: $zipLaravel");

$excludeDirs = [
    '.git',
    'node_modules',
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
    '.idea',
    '.vscode',
    'bootstrap/cache',
    'scripts',
    'dist',
    // public/index.php dan .htaccess masuk zip public_html, bukan di sini
    // tapi public/build tetap masuk zip laravel
];

if (! $includeVendor) {
    $excludeDirs[] = 'vendor';
}

// Semua isi public/ kecuali build/ → masuk zip public_html, exclude dari zip laravel
// build/ tetap di laravel/public/build/
$publicDir = 'public';

$excludeFiles = [
    '.env',
    '.env.local',
    '.env.production',
    '.env.staging',
    '.env.example',
    '.phpunit.result.cache',
    'phpunit.xml',
    'docker-compose.yml',
    'docker-compose.yaml',
    'Makefile',
    'Thumbs.db',
    '.DS_Store',
    'npm-debug.log',
    'public/hot',
];

$excludeExtensions = ['log', 'zip'];

$laravelAdded = 0;
$laravelSkipped = 0;

$successLaravel = createZip($zipLaravel, function (ZipArchive $zip) use (
    $source, $excludeDirs, $excludeFiles, $excludeExtensions,
    &$laravelAdded, &$laravelSkipped
) {
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($source, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::LEAVES_ONLY
    );

    foreach ($iterator as $file) {
        $relPath = str_replace('\\', '/', substr($file->getRealPath(), strlen($source) + 1));

        $skip = false;

        // Exclude dirs
        foreach ($excludeDirs as $ex) {
            if ($relPath === $ex || str_starts_with($relPath, $ex.'/')) {
                $skip = true;
                break;
            }
        }

        // Isi public/ (kecuali public/build) masuk zip public_html, bukan zip laravel
        // public/build tetap masuk zip laravel
        if (! $skip && str_starts_with($relPath, 'public/') && ! str_starts_with($relPath, 'public/build/manifest.json')) {
            $skip = true;
        }

        // Exclude files & ekstensi
        if (! $skip && $file->isFile()) {
            if (in_array(basename($relPath), $excludeFiles)) {
                $skip = true;
            } elseif (in_array($file->getExtension(), $excludeExtensions)) {
                $skip = true;
            }
        }

        if ($skip) {
            $laravelSkipped++;

            continue;
        }

        if ($file->isFile()) {
            $zip->addFile($file->getRealPath(), $relPath);

            // Set chmod 600 untuk file di storage/app/private
            if (str_starts_with($relPath, 'storage/app/private/')) {
                $zip->setExternalAttributesName($relPath, ZipArchive::OPSYS_UNIX, 0100600 << 16);
            }

            $laravelAdded++;
        }
    }

    // Folder kosong yang dibutuhkan Laravel
    foreach ([
        'storage/framework/cache/data',
        'storage/framework/sessions',
        'storage/framework/views',
        'storage/logs',
        'bootstrap/cache',
    ] as $dir) {
        if ($zip->locateName($dir.'/') === false) {
            $zip->addEmptyDir($dir);
        }
    }
});

if ($successLaravel) {
    ok("ZIP laravel selesai — $laravelAdded file ditambah, $laravelSkipped di-skip.");
} else {
    err('Gagal membuat ZIP laravel.');
    exit(1);
}

// ============================================================
// ZIP 2: public_html/ — hanya index.php dan .htaccess
// ============================================================
info("Membuat ZIP public_html: $zipPublicHtml");

$publicHtmlAdded = 0;

$successPublicHtml = createZip($zipPublicHtml, function (ZipArchive $zip) use (
    $source, &$publicHtmlAdded
) {
    // Semua isi public/ kecuali public/build/
    $publicPath = $source.'/public';
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($publicPath, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::LEAVES_ONLY
    );

    foreach ($iterator as $file) {
        $relPath = str_replace('\\', '/', substr($file->getRealPath(), strlen($publicPath) + 1));

        if ($file->isFile()) {
            // Simpan langsung ke root (tanpa prefix public/)
            // misal: public/index.php → index.php
            //        public/favicon.ico → favicon.ico
            $zip->addFile($file->getRealPath(), $relPath);
            $publicHtmlAdded++;
        }
    }
});

if ($successPublicHtml) {
    ok("ZIP public_html selesai — $publicHtmlAdded file ditambah.");
} else {
    err('Gagal membuat ZIP public_html.');
    exit(1);
}

// ============================================================
// Hasil akhir
// ============================================================
echo "\n";
echo "\033[32m======================================\033[0m\n";
echo "\033[32m  [OK] Semua ZIP berhasil dibuat!     \033[0m\n";
echo "\033[32m======================================\033[0m\n\n";

printZipResult('laravel', $zipLaravel, $timestamp);
printZipResult('public_html', $zipPublicHtml, $timestamp);

echo "\033[33m[NEXT STEPS]\033[0m\n";
echo "  1. Upload {$projectName}_laravel_{$timestamp}.zip  → extract ke laravel/\n";
echo "  2. Upload {$projectName}_public_html_{$timestamp}.zip → extract ke public_html/\n";
echo "  3. Edit public_html/index.php — sesuaikan path ke laravel/\n";
echo "  4. Buat .env di laravel/ (hanya pertama kali)\n";

if (! $includeVendor) {
    echo "  5. Terminal cPanel: cd laravel && rm -rf vendor && composer install --no-dev --optimize-autoloader\n";
} else {
    echo "  5. vendor/ sudah di-include, skip composer install\n";
}

echo "  6. Terminal cPanel: cd laravel && chmod 600 storage/app/private/*\n";
echo "  7. Terminal cPanel: cd laravel && php artisan migrate --force\n";
echo "  8. Terminal cPanel: cd laravel && php artisan optimize\n\n";
