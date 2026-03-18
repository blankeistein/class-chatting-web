<?php

namespace App\Services\Regions;

use App\Models\District;
use App\Models\Province;
use App\Models\Regency;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use JsonException;
use RuntimeException;

class IndonesiaRegionSynchronizer
{
    public function syncFromFile(string $path, bool $prune = false): array
    {
        if (! is_file($path)) {
            throw new RuntimeException("File sumber wilayah [{$path}] tidak ditemukan.");
        }

        $contents = file_get_contents($path);

        if ($contents === false) {
            throw new RuntimeException("File sumber wilayah [{$path}] tidak dapat dibaca.");
        }

        try {
            $payload = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RuntimeException("File sumber wilayah [{$path}] bukan JSON yang valid.", previous: $exception);
        }

        if (! is_array($payload)) {
            throw new RuntimeException('Payload wilayah harus berupa objek JSON.');
        }

        return $this->sync($payload, $prune);
    }

    public function sync(array $payload, bool $prune = false): array
    {
        $normalized = $this->normalizePayload($payload);

        return DB::transaction(function () use ($normalized, $prune): array {
            $timestamp = now();

            $provinceRows = array_map(function (array $province) use ($timestamp): array {
                return [
                    'code' => $province['code'],
                    'name' => $province['name'],
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
            }, $normalized['provinces']);

            if ($provinceRows !== []) {
                Province::query()->upsert($provinceRows, ['code'], ['name', 'updated_at']);
            }

            $provinceCodes = array_values(array_unique([
                ...$this->pluckCodes($provinceRows),
                ...array_column($normalized['regencies'], 'province_code'),
            ]));

            $provinceIds = Province::query()
                ->whereIn('code', $provinceCodes)
                ->pluck('id', 'code');

            $regencyRows = array_map(function (array $regency) use ($provinceIds, $timestamp): array {
                $provinceId = $provinceIds->get($regency['province_code']);

                if ($provinceId === null) {
                    throw new RuntimeException("Kode provinsi [{$regency['province_code']}] tidak ditemukan untuk kabupaten/kota [{$regency['code']}].");
                }

                return [
                    'province_id' => $provinceId,
                    'code' => $regency['code'],
                    'name' => $regency['name'],
                    'type' => $regency['type'],
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
            }, $normalized['regencies']);

            if ($regencyRows !== []) {
                Regency::query()->upsert($regencyRows, ['code'], ['province_id', 'name', 'type', 'updated_at']);
            }

            $regencyCodes = array_values(array_unique([
                ...$this->pluckCodes($regencyRows),
                ...array_column($normalized['districts'], 'regency_code'),
            ]));

            $regencyIds = Regency::query()
                ->whereIn('code', $regencyCodes)
                ->pluck('id', 'code');

            $districtRows = array_map(function (array $district) use ($regencyIds, $timestamp): array {
                $regencyId = $regencyIds->get($district['regency_code']);

                if ($regencyId === null) {
                    throw new RuntimeException("Kode kabupaten/kota [{$district['regency_code']}] tidak ditemukan untuk kecamatan [{$district['code']}].");
                }

                return [
                    'regency_id' => $regencyId,
                    'code' => $district['code'],
                    'name' => $district['name'],
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
            }, $normalized['districts']);

            if ($districtRows !== []) {
                District::query()->upsert($districtRows, ['code'], ['regency_id', 'name', 'updated_at']);
            }

            $pruned = [
                'districts' => 0,
                'regencies' => 0,
                'provinces' => 0,
            ];

            if ($prune) {
                if ($normalized['should_prune_districts']) {
                    $pruned['districts'] = $this->pruneMissingRows(District::class, $this->pluckCodes($districtRows));
                }

                if ($normalized['should_prune_regencies']) {
                    $pruned['regencies'] = $this->pruneMissingRows(Regency::class, $this->pluckCodes($regencyRows));
                }

                if ($normalized['should_prune_provinces']) {
                    $pruned['provinces'] = $this->pruneMissingRows(Province::class, $this->pluckCodes($provinceRows));
                }
            }

            return [
                'provinces' => count($provinceRows),
                'regencies' => count($regencyRows),
                'districts' => count($districtRows),
                'pruned' => $pruned,
            ];
        });
    }

    private function normalizePayload(array $payload): array
    {
        $provinces = $this->normalizeProvinces($payload['provinces'] ?? []);
        $regencies = $this->normalizeRegencies($payload);
        $districts = $this->normalizeDistricts($payload);

        return [
            'provinces' => $provinces,
            'regencies' => $regencies,
            'districts' => $districts,
            'should_prune_provinces' => array_key_exists('provinces', $payload),
            'should_prune_regencies' => array_key_exists('regencies', $payload) || $this->hasNestedRegencies($payload['provinces'] ?? []),
            'should_prune_districts' => array_key_exists('districts', $payload) || $this->hasNestedDistricts($payload['provinces'] ?? []),
        ];
    }

    private function normalizeProvinces(array $provinces): array
    {
        return collect($provinces)
            ->map(function (mixed $province): array {
                if (! is_array($province)) {
                    throw new RuntimeException('Setiap data provinsi harus berupa objek.');
                }

                return [
                    'code' => $this->normalizeCode($province['code'] ?? null, 'provinsi'),
                    'name' => $this->normalizeName($province['name'] ?? null, 'provinsi'),
                ];
            })
            ->keyBy('code')
            ->values()
            ->all();
    }

    private function normalizeRegencies(array $payload): array
    {
        $rows = [];

        if (array_key_exists('regencies', $payload)) {
            foreach ($payload['regencies'] as $regency) {
                if (! is_array($regency)) {
                    throw new RuntimeException('Setiap data kabupaten/kota harus berupa objek.');
                }

                $rows[] = $this->mapRegency($regency, $regency['province_code'] ?? null);
            }
        } else {
            foreach ($payload['provinces'] ?? [] as $province) {
                if (! is_array($province)) {
                    throw new RuntimeException('Setiap data provinsi harus berupa objek.');
                }

                foreach ($province['regencies'] ?? [] as $regency) {
                    if (! is_array($regency)) {
                        throw new RuntimeException('Setiap data kabupaten/kota harus berupa objek.');
                    }

                    $rows[] = $this->mapRegency($regency, $province['code'] ?? null);
                }
            }
        }

        return collect($rows)->keyBy('code')->values()->all();
    }

    private function normalizeDistricts(array $payload): array
    {
        $rows = [];

        if (array_key_exists('districts', $payload)) {
            foreach ($payload['districts'] as $district) {
                if (! is_array($district)) {
                    throw new RuntimeException('Setiap data kecamatan harus berupa objek.');
                }

                $rows[] = $this->mapDistrict($district, $district['regency_code'] ?? null);
            }
        } else {
            foreach ($payload['provinces'] ?? [] as $province) {
                if (! is_array($province)) {
                    throw new RuntimeException('Setiap data provinsi harus berupa objek.');
                }

                foreach ($province['regencies'] ?? [] as $regency) {
                    if (! is_array($regency)) {
                        throw new RuntimeException('Setiap data kabupaten/kota harus berupa objek.');
                    }

                    foreach ($regency['districts'] ?? [] as $district) {
                        if (! is_array($district)) {
                            throw new RuntimeException('Setiap data kecamatan harus berupa objek.');
                        }

                        $rows[] = $this->mapDistrict($district, $regency['code'] ?? null);
                    }
                }
            }
        }

        return collect($rows)->keyBy('code')->values()->all();
    }

    private function mapRegency(array $regency, mixed $provinceCode): array
    {
        $name = $this->normalizeName($regency['name'] ?? null, 'kabupaten/kota');

        return [
            'province_code' => $this->normalizeCode($provinceCode, 'kode provinsi'),
            'code' => $this->normalizeCode($regency['code'] ?? null, 'kabupaten/kota'),
            'name' => $name,
            'type' => $this->normalizeRegencyType($regency['type'] ?? null, $name),
        ];
    }

    private function mapDistrict(array $district, mixed $regencyCode): array
    {
        return [
            'regency_code' => $this->normalizeCode($regencyCode, 'kode kabupaten/kota'),
            'code' => $this->normalizeCode($district['code'] ?? null, 'kecamatan'),
            'name' => $this->normalizeName($district['name'] ?? null, 'kecamatan'),
        ];
    }

    private function normalizeCode(mixed $value, string $label): string
    {
        if (! is_scalar($value)) {
            throw new RuntimeException("Nilai {$label} wajib diisi.");
        }

        $code = trim((string) $value);

        if ($code === '') {
            throw new RuntimeException("Nilai {$label} wajib diisi.");
        }

        return $code;
    }

    private function normalizeName(mixed $value, string $label): string
    {
        if (! is_scalar($value)) {
            throw new RuntimeException("Nama {$label} wajib diisi.");
        }

        $name = trim((string) $value);

        if ($name === '') {
            throw new RuntimeException("Nama {$label} wajib diisi.");
        }

        return $name;
    }

    private function normalizeRegencyType(mixed $value, string $name): ?string
    {
        if (is_scalar($value)) {
            $type = Str::lower(trim((string) $value));

            if (in_array($type, ['kabupaten', 'kota'], true)) {
                return $type;
            }
        }

        $normalizedName = Str::lower($name);

        if (Str::startsWith($normalizedName, 'kota')) {
            return 'kota';
        }

        if (Str::startsWith($normalizedName, 'kabupaten') || Str::startsWith($normalizedName, 'kab.')) {
            return 'kabupaten';
        }

        return null;
    }

    private function hasNestedRegencies(array $provinces): bool
    {
        foreach ($provinces as $province) {
            if (is_array($province) && array_key_exists('regencies', $province)) {
                return true;
            }
        }

        return false;
    }

    private function hasNestedDistricts(array $provinces): bool
    {
        foreach ($provinces as $province) {
            if (! is_array($province)) {
                continue;
            }

            foreach ($province['regencies'] ?? [] as $regency) {
                if (is_array($regency) && array_key_exists('districts', $regency)) {
                    return true;
                }
            }
        }

        return false;
    }

    private function pruneMissingRows(string $modelClass, array $codes): int
    {
        $query = $modelClass::query();

        if ($codes !== []) {
            $query->whereNotIn('code', $codes);
        }

        return $query->delete();
    }

    private function pluckCodes(array $rows): array
    {
        return array_values(array_unique(array_map(
            static fn (array $row): string => $row['code'],
            $rows,
        )));
    }
}
