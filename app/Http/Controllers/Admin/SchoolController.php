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
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SchoolController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $perPage = (int) $request->input('per_page', 20);
        $provinceCode = trim((string) $request->input('province_code', ''));
        $regencyCode = trim((string) $request->input('regency_code', ''));
        $districtCode = trim((string) $request->input('district_code', ''));
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

        $provinceId = $provinceCode !== '' ? Province::where('code', $provinceCode)->value('id') : null;
        $regencyId = $regencyCode !== '' ? Regency::where('code', $regencyCode)->value('id') : null;
        $districtId = $districtCode !== '' ? District::where('code', $districtCode)->value('id') : null;

        $schools = School::query()
            ->search($search)
            ->when($provinceId, fn ($query) => $query->where('province_id', $provinceId))
            ->when($regencyId, fn ($query) => $query->where('regency_id', $regencyId))
            ->when($districtId, fn ($query) => $query->where('district_id', $districtId))
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
                'province_code' => $provinceCode,
                'regency_code' => $regencyCode,
                'district_code' => $districtCode,
                'status' => $status,
                'bentuk_pendidikan' => $bentukPendidikan,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
            ],
            'filterOptions' => $this->getFilterOptions(),
            'regionOptions' => Inertia::optional(fn (): array => $this->getRegionFilterOptions()),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Sekolah/Create', $this->regionOptions());
    }

    public function importPage(): Response
    {
        return Inertia::render('Admin/Sekolah/Import');
    }

    public function store(SchoolDataRequest $request): RedirectResponse
    {
        if (! Gate::allows('create', School::class)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

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
        if (! Gate::allows('update', $school)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

        $school->update($request->validated());

        return redirect()->route('admin.schools.index')->with('success', 'Sekolah berhasil diperbarui.');
    }

    public function destroy(School $school): RedirectResponse
    {
        if (! Gate::allows('delete', $school)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

        $school->delete();

        return redirect()->back()->with('success', 'Sekolah berhasil dihapus.');
    }

    public function bulkDelete(Request $request): RedirectResponse
    {
        if (! Gate::allows('delete', School::class)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

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

            fputcsv($file, ['ID', 'Code', 'NPSN', 'Nama', 'Bentuk Pendidikan', 'Status', 'Provinsi', 'Kabupaten/Kota', 'Kecamatan', 'Alamat', 'Kode Pos']);

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
                    $school->postcode,
                ]);
            }

            fclose($file);
        }, 200, $headers);
    }

    public function import(SchoolImportRequest $request): JsonResponse
    {
        if (! Gate::allows('create', School::class)) {
            return response()->json([
                'success' => false,
                'message' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ], 403);
        }

        $file = $request->file('file');

        if (! $file instanceof UploadedFile) {
            return response()->json([
                'success' => false,
                'message' => 'File CSV tidak ditemukan.',
            ], 400);
        }

        try {
            $result = $this->importSchoolsFromCsv($file);
        } catch (\RuntimeException|QueryException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Import sekolah berhasil diproses.',
            'data' => [
                'processed' => $result['processed'],
                'created' => $result['created'],
                'updated' => $result['updated'],
                'skipped' => $result['skipped'],
                'errors' => $result['errors'],
            ],
        ]);
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

        $header = fgetcsv($handle, null, ';');

        if (! is_array($header)) {
            fclose($handle);

            throw new \RuntimeException('Header CSV tidak ditemukan.');
        }

        $headerMap = $this->buildHeaderMap($header);

        $requiredColumns = [
            'nama',
            'bentuk_pendidikan',
            'status_sekolah',
            'provinsi_id',
            'kabupaten_id',
            'kecamatan_id',
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

            while (($row = fgetcsv($handle, null, ';')) !== false) {
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

                // Generate unique code if 'id' column is empty
                if ($code === '') {
                    $code = $this->generateUniqueSchoolCode();
                }

                if ($name === '' || $bentukPendidikan === '' || $status === '' || $provinceId === null || $regencyId === null || $districtId === null) {
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
                    'postcode' => $this->nullIfEmpty($this->csvValue($row, $headerMap, 'kode_pos')),
                    'longitude' => $this->toNullableFloat($this->csvValue($row, $headerMap, 'bujur')),
                    'latitude' => $this->toNullableFloat($this->csvValue($row, $headerMap, 'lintang')),
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
     * Generate a unique 6-character alphanumeric code for school.
     */
    private function generateUniqueSchoolCode(): string
    {
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $maxAttempts = 100;
        $attempt = 0;

        do {
            $code = '';
            for ($i = 0; $i < 6; $i++) {
                $code .= $characters[random_int(0, strlen($characters) - 1)];
            }

            $exists = School::query()->where('code', $code)->exists();
            $attempt++;

            if ($attempt >= $maxAttempts) {
                throw new \RuntimeException('Gagal generate kode unik setelah '.$maxAttempts.' percobaan.');
            }
        } while ($exists);

        return $code;
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

    /**
     * @return array<string, mixed>
     */
    private function getFilterOptions(): array
    {
        return [
            'bentukPendidikan' => School::query()
                ->whereNotNull('bentuk_pendidikan')
                ->where('bentuk_pendidikan', '!=', '')
                ->distinct()
                ->orderBy('bentuk_pendidikan')
                ->pluck('bentuk_pendidikan')
                ->values()
                ->toArray(),
        ];
    }

    /**
     * @return array<string, array<int, array<string, int|string|null>>>
     */
    private function getRegionFilterOptions(): array
    {
        return [
            'provinces' => Province::query()
                ->orderBy('code')
                ->get(['id', 'code', 'name'])
                ->toArray(),
        ];
    }
}
