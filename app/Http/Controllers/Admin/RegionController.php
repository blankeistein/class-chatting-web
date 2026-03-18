<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\DistrictDataRequest;
use App\Http\Requests\ProvinceDataRequest;
use App\Http\Requests\RegencyDataRequest;
use App\Http\Resources\DistrictResource;
use App\Http\Resources\ProvinceResource;
use App\Http\Resources\RegencyResource;
use App\Models\District;
use App\Models\Province;
use App\Models\Regency;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class RegionController extends Controller
{
    public function index(Request $request): Response
    {
        $requestedProvinceCode = trim((string) $request->input('province', ''));
        $requestedRegencyCode = trim((string) $request->input('regency', ''));

        $provinces = Province::query()
            ->withCount(['regencies', 'districts'])
            ->orderBy('code')
            ->get();

        $selectedProvince = $requestedProvinceCode !== ''
            ? $provinces->firstWhere('code', $requestedProvinceCode)
            : $provinces->first();

        $regencies = collect();
        $selectedRegency = null;
        $districts = collect();

        if ($selectedProvince !== null) {
            $regencies = Regency::query()
                ->whereBelongsTo($selectedProvince)
                ->with('province')
                ->withCount('districts')
                ->orderBy('code')
                ->get();

            $selectedRegency = $requestedRegencyCode !== ''
                ? $regencies->firstWhere('code', $requestedRegencyCode)
                : $regencies->first();

            if ($selectedRegency !== null) {
                $districts = District::query()
                    ->whereBelongsTo($selectedRegency)
                    ->with(['regency.province'])
                    ->orderBy('code')
                    ->get();
            }
        }

        return Inertia::render('Admin/Daerah/Index', [
            'stats' => [
                'provinces' => $provinces->count(),
                'regencies' => $provinces->sum('regencies_count'),
                'districts' => $provinces->sum('districts_count'),
            ],
            'provinces' => ProvinceResource::collection($provinces),
            'regencies' => RegencyResource::collection($regencies),
            'districts' => DistrictResource::collection($districts),
            'selectedProvince' => $selectedProvince ? [
                'id' => $selectedProvince->id,
                'code' => $selectedProvince->code,
                'name' => $selectedProvince->name,
            ] : null,
            'selectedRegency' => $selectedRegency ? [
                'id' => $selectedRegency->id,
                'code' => $selectedRegency->code,
                'name' => $selectedRegency->name,
                'type' => $selectedRegency->type,
            ] : null,
        ]);
    }

    public function storeProvince(ProvinceDataRequest $request): RedirectResponse
    {
        $province = Province::query()->create($request->validated());

        return $this->redirectToIndex($province->code, null, 'Provinsi berhasil ditambahkan.');
    }

    public function updateProvince(ProvinceDataRequest $request, Province $province): RedirectResponse
    {
        $province->update($request->validated());

        return $this->redirectToIndex($province->code, null, 'Provinsi berhasil diperbarui.');
    }

    public function destroyProvince(Province $province): RedirectResponse
    {
        $province->delete();

        $nextProvince = Province::query()->orderBy('code')->first();

        return $this->redirectToIndex($nextProvince?->code, null, 'Provinsi berhasil dihapus.');
    }

    public function storeRegency(RegencyDataRequest $request): RedirectResponse
    {
        $regency = Regency::query()->create($request->validated());
        $regency->load('province');

        return $this->redirectToIndex($regency->province?->code, $regency->code, 'Kabupaten atau kota berhasil ditambahkan.');
    }

    public function updateRegency(RegencyDataRequest $request, Regency $regency): RedirectResponse
    {
        $regency->update($request->validated());
        $regency->load('province');

        return $this->redirectToIndex($regency->province?->code, $regency->code, 'Kabupaten atau kota berhasil diperbarui.');
    }

    public function destroyRegency(Regency $regency): RedirectResponse
    {
        $provinceCode = $regency->province?->code;
        $provinceId = $regency->province_id;

        $regency->delete();

        $nextRegency = Regency::query()
            ->where('province_id', $provinceId)
            ->orderBy('code')
            ->first();

        return $this->redirectToIndex($provinceCode, $nextRegency?->code, 'Kabupaten atau kota berhasil dihapus.');
    }

    public function storeDistrict(DistrictDataRequest $request): RedirectResponse
    {
        $district = District::query()->create($request->validated());
        $district->load('regency.province');

        return $this->redirectToIndex(
            $district->regency?->province?->code,
            $district->regency?->code,
            'Kecamatan berhasil ditambahkan.',
        );
    }

    public function updateDistrict(DistrictDataRequest $request, District $district): RedirectResponse
    {
        $district->update($request->validated());
        $district->load('regency.province');

        return $this->redirectToIndex(
            $district->regency?->province?->code,
            $district->regency?->code,
            'Kecamatan berhasil diperbarui.',
        );
    }

    public function destroyDistrict(District $district): RedirectResponse
    {
        $district->load('regency.province');

        $provinceCode = $district->regency?->province?->code;
        $regencyCode = $district->regency?->code;

        $district->delete();

        return $this->redirectToIndex($provinceCode, $regencyCode, 'Kecamatan berhasil dihapus.');
    }

    private function redirectToIndex(?string $provinceCode, ?string $regencyCode, string $message): RedirectResponse
    {
        $parameters = Collection::make([
            'province' => $provinceCode,
            'regency' => $regencyCode,
        ])
            ->filter(fn (?string $value): bool => $value !== null && $value !== '')
            ->all();

        return redirect()
            ->route('admin.regions.index', $parameters)
            ->with('success', $message);
    }
}
