<?php

namespace App\Console\Commands;

use App\Services\Regions\IndonesiaRegionSynchronizer;
use Illuminate\Console\Command;
use Throwable;

class SyncIndonesiaRegions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'regions:sync
                            {path=database/seeders/indonesia_regions.json : Path file JSON wilayah}
                            {--prune : Hapus data yang tidak lagi ada pada file sumber}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sinkronkan data provinsi, kabupaten/kota, dan kecamatan Indonesia dari file JSON lokal.';

    /**
     * Execute the console command.
     */
    public function handle(IndonesiaRegionSynchronizer $synchronizer): int
    {
        $path = $this->resolvePath((string) $this->argument('path'));

        try {
            $summary = $synchronizer->syncFromFile($path, (bool) $this->option('prune'));
        } catch (Throwable $throwable) {
            $this->error($throwable->getMessage());

            return self::FAILURE;
        }

        $this->table(
            ['Jenis Data', 'Tersinkron'],
            [
                ['Provinsi', $summary['provinces']],
                ['Kabupaten/Kota', $summary['regencies']],
                ['Kecamatan', $summary['districts']],
            ],
        );

        if ((bool) $this->option('prune')) {
            $this->table(
                ['Jenis Data', 'Terhapus'],
                [
                    ['Provinsi', $summary['pruned']['provinces']],
                    ['Kabupaten/Kota', $summary['pruned']['regencies']],
                    ['Kecamatan', $summary['pruned']['districts']],
                ],
            );
        }

        $this->info("Sinkronisasi wilayah berhasil dari [{$path}].");

        return self::SUCCESS;
    }

    private function resolvePath(string $path): string
    {
        if ($path === '') {
            return database_path('seeders/indonesia_regions.json');
        }

        if ($this->isAbsolutePath($path) || is_file($path)) {
            return $path;
        }

        return base_path($path);
    }

    private function isAbsolutePath(string $path): bool
    {
        return str_starts_with($path, DIRECTORY_SEPARATOR)
            || preg_match('/^[A-Za-z]:[\\\\\/]/', $path) === 1;
    }
}
