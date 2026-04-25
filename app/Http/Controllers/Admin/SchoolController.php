<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SchoolDataRequest;
use App\Http\Requests\SchoolImportRequest;
use App\Http\Resources\SchoolResource;
use App\Models\District;
use App\Models\Province;
use App\Models\Regency;
use App\Models\School;
use App\Models\Village;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SchoolController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $perPage = (int) $request->input('per_page', 20);
        $provinceId = (int) $request->input('province_id', 0);
        $regencyId = (int) $request->input('regency_id', 0);
        $districtId = (int) $request->input('district_id', 0);
        $status = trim((string) $request->input('status', ''));
        $bentukPendidikan = trim((string) $request->input('bentuk_pendidikan', ''));
        $sortBy = trim((string) $request->input('sort_by', 'created_at'));
        $sortDirection = trim((string) $request->input('sort_direction', 'desc'));

        if (! in_array($perPage, [25, 50, 100], true)) {
            $perPage = 25;
        }

        if (! in_array($sortBy, ['name', 'npsn', 'status', 'created_at'], true)) {
            $sortBy = 'created_at';
        }

        if (! in_array($sortDirection, ['asc', 'desc'], true)) {
            $sortDirection = 'desc';
        }

        $schools = School::query()
            ->with(['province', 'regency', 'district', 'village'])
            ->search($search)
            ->when($provinceId > 0, fn ($query) => $query->where('province_id', $provinceId))
            ->when($regencyId > 0, fn ($query) => $query->where('regency_id', $regencyId))
            ->when($districtId > 0, fn ($query) => $query->where('district_id', $districtId))
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($bentukPendidikan !== '', fn ($query) => $query->where('bentuk_pendidikan', $bentukPendidikan))
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/Sekolah/Index', [
            'schools' => SchoolResource::collection($schools),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'province_id' => $provinceId,
                'regency_id' => $regencyId,
                'district_id' => $districtId,
                'status' => $status,
                'bentuk_pendidikan' => $bentukPendidikan,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
            ],
            'filterOptions' => [
                ...$this->regionOptions(),
                'bentukPendidikan' => School::query()
                    ->whereNotNull('bentuk_pendidikan')
                    ->distinct()
                    ->orderBy('bentuk_pendidikan')
                    ->pluck('bentuk_pendidikan')
                    ->filter()
                    ->values()
                    ->all(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Sekolah/Create', $this->regionOptions());
    }

    public function store(SchoolDataRequest $request): RedirectResponse
    {
        School::query()->create($request->validated());

        return redirect()->route('admin.schools.index')->with('success', 'Sekolah berhasil ditambahkan.');
    }

    public function edit(School $school): Response
    {
        $school->load(['province', 'regency', 'district', 'village']);

        return Inertia::render('Admin/Sekolah/Edit', [
            'school' => new SchoolResource($school),
            ...$this->regionOptions(),
        ]);
    }

    public function show(School $school): Response
    {
        $school->load(['province', 'regency', 'district', 'village']);

        return Inertia::render('Admin/Sekolah/Show', [
            'school' => new SchoolResource($school),
        ]);
    }

    public function update(SchoolDataRequest $request, School $school): RedirectResponse
    {
        $school->update($request->validated());

        return redirect()->route('admin.schools.index')->with('success', 'Sekolah berhasil diperbarui.');
    }

    public function destroy(School $school): RedirectResponse
    {
        $school->delete();

        return redirect()->back()->with('success', 'Sekolah berhasil dihapus.');
    }

    public function bulkDelete(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:schools,id'],
        ]);

        $deletedCount = School::query()
            ->whereIn('id', $validated['ids'])
            ->delete();

        return redirect()->back()->with('success', "{$deletedCount} sekolah berhasil dihapus.");
    }

    public function bulkExport(Request $request): StreamedResponse
    {
        $ids = collect(explode(',', (string) $request->input('ids', '')))
            ->map(fn (string $id): int => (int) $id)
            ->filter(fn (int $id): bool => $id > 0)
            ->values()
            ->all();

        $schools = School::query()
            ->with(['province', 'regency', 'district'])
            ->whereIn('id', $ids)
            ->orderBy('name')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="schools_'.date('Y-m-d_H-i-s').'.csv"',
        ];

        return response()->stream(function () use ($schools): void {
            $file = fopen('php://output', 'w');

            if ($file === false) {
                return;
            }

            fputcsv($file, ['ID', 'Code', 'NPSN', 'Nama', 'Bentuk Pendidikan', 'Status', 'Provinsi', 'Kabupaten/Kota', 'Kecamatan', 'Alamat']);

            foreach ($schools as $school) {
                fputcsv($file, [
                    $school->id,
                    $school->code,
                    $school->npsn,
                    $school->name,
                    $school->bentuk_pendidikan,
                    $school->status,
                    $school->province?->name,
                    $school->regency?->name,
                    $school->district?->name,
                    $school->address,
                ]);
            }

            fclose($file);
        }, 200, $headers);
    }

    public function import(SchoolImportRequest $request): RedirectResponse
    {
        $file = $request->file('file');

        if (! $file instanceof UploadedFile) {
            return redirect()->back()->withErrors('File CSV tidak ditemukan.');
        }

        try {
            $result = $this->importSchoolsFromCsv($file);
        } catch (\RuntimeException|QueryException $exception) {
            return redirect()->back()->withErrors($exception->getMessage());
        }

        $summary = sprintf(
            'Import selesai. %d data diproses (%d baru, %d diperbarui, %d dilewati).',
            $result['processed'],
            $result['created'],
            $result['updated'],
            $result['skipped']
        );

        $redirect = redirect()->back()->with('success', $summary);

        if ($result['errors'] !== []) {
            $redirect->with('warning', 'Beberapa baris dilewati: '.implode(' | ', array_slice($result['errors'], 0, 5)));
        }

        return $redirect;
    }

    /**
     * @return array{processed:int,created:int,updated:int,skipped:int,errors:array<int,string>}
     */
    private function importSchoolsFromCsv(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');

        if ($handle === false) {
            throw new \RuntimeException('File CSV tidak dapat dibaca.');
        }

        $header = fgetcsv($handle);

        if (! is_array($header)) {
            fclose($handle);

            throw new \RuntimeException('Header CSV tidak ditemukan.');
        }

        $headerMap = $this->buildHeaderMap($header);

        $requiredColumns = [
            'id',
            'nama',
            'bentuk_pendidikan',
            'status_sekolah',
            'provinsi_id',
            'kabupaten_id',
            'kecamatan_id',
            'old_id',
        ];

        $missingColumns = array_values(array_filter($requiredColumns, fn (string $column): bool => ! array_key_exists($column, $headerMap)));

        if ($missingColumns !== []) {
            fclose($handle);

            throw new \RuntimeException('Kolom CSV tidak lengkap: '.implode(', ', $missingColumns));
        }

        $provinceCodeMap = Province::query()
            ->pluck('id', 'code')
            ->mapWithKeys(fn (int|string $id, int|string $code): array => [(string) $code => (int) $id])
            ->all();

        $regencyCodeMap = Regency::query()
            ->pluck('id', 'code')
            ->mapWithKeys(fn (int|string $id, int|string $code): array => [(string) $code => (int) $id])
            ->all();

        $districtCodeMap = District::query()
            ->pluck('id', 'code')
            ->mapWithKeys(fn (int|string $id, int|string $code): array => [(string) $code => (int) $id])
            ->all();

        $result = [
            'processed' => 0,
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        DB::transaction(function () use ($handle, $headerMap, $provinceCodeMap, $regencyCodeMap, $districtCodeMap, &$result): void {
            $rowNumber = 1;

            while (($row = fgetcsv($handle)) !== false) {
                $rowNumber++;

                if (! is_array($row) || $this->isRowEmpty($row)) {
                    continue;
                }

                $result['processed']++;

                $code = $this->csvValue($row, $headerMap, 'id');
                $name = $this->csvValue($row, $headerMap, 'nama');
                $bentukPendidikan = $this->csvValue($row, $headerMap, 'bentuk_pendidikan');
                $status = strtoupper($this->csvValue($row, $headerMap, 'status_sekolah'));

                $provinceCode = $this->csvValue($row, $headerMap, 'provinsi_id');
                $regencyCode = $this->csvValue($row, $headerMap, 'kabupaten_id');
                $districtCode = $this->csvValue($row, $headerMap, 'kecamatan_id');

                $provinceId = $provinceCodeMap[$provinceCode] ?? null;
                $regencyId = $regencyCodeMap[$regencyCode] ?? null;
                $districtId = $districtCodeMap[$districtCode] ?? null;

                if ($code === '' || $name === '' || $bentukPendidikan === '' || $status === '' || $provinceId === null || $regencyId === null || $districtId === null) {
                    $result['skipped']++;
                    $result['errors'][] = "Baris {$rowNumber} gagal diproses.";

                    continue;
                }

                $schoolData = [
                    'npsn' => $this->nullIfEmpty($this->csvValue($row, $headerMap, 'npsn')),
                    'name' => $name,
                    'bentuk_pendidikan' => $bentukPendidikan,
                    'status' => $status,
                    'province_id' => $provinceId,
                    'regency_id' => $regencyId,
                    'district_id' => $districtId,
                    'address' => $this->nullIfEmpty($this->csvValue($row, $headerMap, 'dusun')),
                    'rt' => $this->toNullableInteger($this->csvValue($row, $headerMap, 'rt')),
                    'rw' => $this->toNullableInteger($this->csvValue($row, $headerMap, 'rw')),
                    'longitude' => $this->toNullableFloat($this->csvValue($row, $headerMap, 'bujur')),
                    'latitute' => $this->toNullableFloat($this->csvValue($row, $headerMap, 'lintang')),
                    'old_code' => $this->nullIfEmpty($this->csvValue($row, $headerMap, 'old_id')),
                ];

                $school = School::query()->where('code', $code)->first();

                if ($school === null) {
                    School::query()->create([
                        'code' => $code,
                        ...$schoolData,
                    ]);
                    $result['created']++;

                    continue;
                }

                $school->update($schoolData);
                $result['updated']++;
            }
        });

        fclose($handle);

        return $result;
    }

    /**
     * @param  array<int, string|null>  $header
     * @return array<string, int>
     */
    private function buildHeaderMap(array $header): array
    {
        $map = [];

        foreach ($header as $index => $column) {
            $normalizedHeader = strtolower(trim((string) preg_replace('/^\xEF\xBB\xBF/', '', (string) $column)));

            if ($normalizedHeader !== '') {
                $map[$normalizedHeader] = $index;
            }
        }

        return $map;
    }

    /**
     * @param  array<int, string|null>  $row
     * @param  array<string, int>  $headerMap
     */
    private function csvValue(array $row, array $headerMap, string $column): string
    {
        $index = $headerMap[$column] ?? null;

        if ($index === null) {
            return '';
        }

        return trim((string) ($row[$index] ?? ''));
    }

    /**
     * @param  array<int, string|null>  $row
     */
    private function isRowEmpty(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function nullIfEmpty(string $value): ?string
    {
        return $value === '' ? null : $value;
    }

    private function toNullableInteger(string $value): ?int
    {
        if ($value === '' || ! is_numeric($value)) {
            return null;
        }

        return (int) $value;
    }

    private function toNullableFloat(string $value): ?float
    {
        if ($value === '' || ! is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }

    /**
     * @return array<string, array<int, array<string, int|string|null>>>
     */
    private function regionOptions(): array
    {
        return [
            'provinces' => Province::query()
                ->orderBy('code')
                ->get(['id', 'code', 'name'])
                ->toArray(),
            'regencies' => Regency::query()
                ->orderBy('code')
                ->get(['id', 'province_id', 'code', 'name', 'type'])
                ->toArray(),
            'districts' => District::query()
                ->orderBy('code')
                ->get(['id', 'regency_id', 'code', 'name'])
                ->toArray(),
            'villages' => Village::query()
                ->orderBy('code')
                ->get(['id', 'district_id', 'code', 'name'])
                ->toArray(),
        ];
    }
}
