<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\DistrictDataRequest;
use App\Http\Requests\ProvinceDataRequest;
use App\Http\Requests\RegencyDataRequest;
use App\Http\Requests\VillageDataRequest;
use App\Http\Resources\DistrictResource;
use App\Http\Resources\ProvinceResource;
use App\Http\Resources\RegencyResource;
use App\Http\Resources\VillageResource;
use App\Models\District;
use App\Models\Province;
use App\Models\Regency;
use App\Models\Village;
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
        $requestedDistrictCode = trim((string) $request->input('district', ''));

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
        $selectedDistrict = null;
        $villages = collect();

        if ($selectedProvince !== null) {
            $regencies = Regency::query()
                ->whereBelongsTo($selectedProvince)
                ->with('province')
                ->withCount(['districts', 'villages'])
                ->orderBy('code')
                ->get();

            $selectedRegency = $requestedRegencyCode !== ''
                ? $regencies->firstWhere('code', $requestedRegencyCode)
                : $regencies->first();

            if ($selectedRegency !== null) {
                $districts = District::query()
                    ->whereBelongsTo($selectedRegency)
                    ->with(['regency.province'])
                    ->withCount('villages')
                    ->orderBy('code')
                    ->get();

                $selectedDistrict = $requestedDistrictCode !== ''
                    ? $districts->firstWhere('code', $requestedDistrictCode)
                    : $districts->first();

                if ($selectedDistrict !== null) {
                    $villages = Village::query()
                        ->whereBelongsTo($selectedDistrict)
                        ->with(['district.regency.province'])
                        ->orderBy('code')
                        ->get();
                }
            }
        }

        return Inertia::render('Admin/Daerah/Index', [
            'stats' => [
                'provinces' => $provinces->count(),
                'regencies' => $provinces->sum('regencies_count'),
                'districts' => $provinces->sum('districts_count'),
                'villages' => Village::query()->count(),
            ],
            'provinces' => ProvinceResource::collection($provinces),
            'regencies' => RegencyResource::collection($regencies),
            'districts' => DistrictResource::collection($districts),
            'villages' => VillageResource::collection($villages),
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
            'selectedDistrict' => $selectedDistrict ? [
                'id' => $selectedDistrict->id,
                'code' => $selectedDistrict->code,
                'name' => $selectedDistrict->name,
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

    public function storeVillage(VillageDataRequest $request): RedirectResponse
    {
        $village = Village::query()->create($request->validated());
        $village->load('district.regency.province');

        return $this->redirectToIndex(
            $village->district?->regency?->province?->code,
            $village->district?->regency?->code,
            'Desa berhasil ditambahkan.',
            $village->district?->code,
        );
    }

    public function updateVillage(VillageDataRequest $request, Village $village): RedirectResponse
    {
        $village->update($request->validated());
        $village->load('district.regency.province');

        return $this->redirectToIndex(
            $village->district?->regency?->province?->code,
            $village->district?->regency?->code,
            'Desa berhasil diperbarui.',
            $village->district?->code,
        );
    }

    public function destroyVillage(Village $village): RedirectResponse
    {
        $village->load('district.regency.province');

        $provinceCode = $village->district?->regency?->province?->code;
        $regencyCode = $village->district?->regency?->code;
        $districtCode = $village->district?->code;

        $village->delete();

        return $this->redirectToIndex($provinceCode, $regencyCode, 'Desa berhasil dihapus.', $districtCode);
    }

    private function redirectToIndex(?string $provinceCode, ?string $regencyCode, string $message, ?string $districtCode = null): RedirectResponse
    {
        $parameters = Collection::make([
            'province' => $provinceCode,
            'regency' => $regencyCode,
            'district' => $districtCode,
        ])
            ->filter(fn (?string $value): bool => $value !== null && $value !== '')
            ->all();

        return redirect()
            ->route('admin.regions.index', $parameters)
            ->with('success', $message);
    }
}
