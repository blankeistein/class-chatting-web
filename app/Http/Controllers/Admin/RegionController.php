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
use Inertia\Inertia;
use Inertia\Response;

class RegionController extends Controller
{
    public function index(): RedirectResponse
    {
        return redirect()->route('admin.regions.provinces.index');
    }

    public function provinces(Request $request): Response
    {
        [$search, $perPage, $sortDirection] = $this->indexFilters($request);

        $provinces = Province::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name', $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/Daerah/Provinces', [
            'provinces' => ProvinceResource::collection($provinces),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort_by' => 'name',
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    public function regencies(Request $request): Response
    {
        [$search, $perPage, $sortDirection, $provinceId] = $this->indexFilters($request);

        $regencies = Regency::query()
            ->with('province')
            ->when($provinceId > 0, fn ($query) => $query->where('province_id', $provinceId))
            ->when($search !== '', function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name', $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/Daerah/Regencies', [
            'regencies' => RegencyResource::collection($regencies),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'province_id' => $provinceId,
                'sort_by' => 'name',
                'sort_direction' => $sortDirection,
            ],
            'filterOptions' => [
                'provinces' => Province::query()
                    ->orderBy('name')
                    ->get(['id', 'name'])
                    ->toArray(),
            ],
        ]);
    }

    public function districts(Request $request): Response
    {
        [$search, $perPage, $sortDirection, $provinceId, $regencyId] = $this->indexFilters($request);

        $districts = District::query()
            ->with(['regency.province'])
            ->when($provinceId > 0, function ($query) use ($provinceId) {
                $query->whereHas('regency', fn ($regencyQuery) => $regencyQuery->where('province_id', $provinceId));
            })
            ->when($regencyId > 0, fn ($query) => $query->where('regency_id', $regencyId))
            ->when($search !== '', function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name', $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/Daerah/Districts', [
            'districts' => DistrictResource::collection($districts),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'province_id' => $provinceId,
                'regency_id' => $regencyId,
                'sort_by' => 'name',
                'sort_direction' => $sortDirection,
            ],
            'filterOptions' => [
                'provinces' => Province::query()
                    ->orderBy('name')
                    ->get(['id', 'name'])
                    ->toArray(),
                'regencies' => Regency::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'province_id'])
                    ->toArray(),
            ],
        ]);
    }

    public function villages(Request $request): Response
    {
        [$search, $perPage, $sortDirection, $provinceId, $regencyId, $districtId] = $this->indexFilters($request);

        $villages = Village::query()
            ->with(['district.regency.province'])
            ->when($provinceId > 0, function ($query) use ($provinceId) {
                $query->whereHas('district.regency', fn ($regencyQuery) => $regencyQuery->where('province_id', $provinceId));
            })
            ->when($regencyId > 0, function ($query) use ($regencyId) {
                $query->whereHas('district', fn ($districtQuery) => $districtQuery->where('regency_id', $regencyId));
            })
            ->when($districtId > 0, fn ($query) => $query->where('district_id', $districtId))
            ->when($search !== '', function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name', $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/Daerah/Villages', [
            'villages' => VillageResource::collection($villages),
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'province_id' => $provinceId,
                'regency_id' => $regencyId,
                'district_id' => $districtId,
                'sort_by' => 'name',
                'sort_direction' => $sortDirection,
            ],
            'filterOptions' => [
                'provinces' => Province::query()
                    ->orderBy('name')
                    ->get(['id', 'name'])
                    ->toArray(),
                'regencies' => Regency::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'province_id'])
                    ->toArray(),
                'districts' => District::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'regency_id'])
                    ->toArray(),
            ],
        ]);
    }

    public function storeProvince(ProvinceDataRequest $request): RedirectResponse
    {
        $province = Province::query()->create($request->validated());

        return $this->redirectToPage('admin.regions.provinces.index', 'Provinsi berhasil ditambahkan.');
    }

    public function updateProvince(ProvinceDataRequest $request, Province $province): RedirectResponse
    {
        $province->update($request->validated());

        return $this->redirectToPage('admin.regions.provinces.index', 'Provinsi berhasil diperbarui.');
    }

    public function destroyProvince(Province $province): RedirectResponse
    {
        $province->delete();

        return $this->redirectToPage('admin.regions.provinces.index', 'Provinsi berhasil dihapus.');
    }

    public function storeRegency(RegencyDataRequest $request): RedirectResponse
    {
        Regency::query()->create($request->validated());

        return $this->redirectToPage('admin.regions.regencies.index', 'Kabupaten atau kota berhasil ditambahkan.');
    }

    public function updateRegency(RegencyDataRequest $request, Regency $regency): RedirectResponse
    {
        $regency->update($request->validated());

        return $this->redirectToPage('admin.regions.regencies.index', 'Kabupaten atau kota berhasil diperbarui.');
    }

    public function destroyRegency(Regency $regency): RedirectResponse
    {
        $regency->delete();

        return $this->redirectToPage('admin.regions.regencies.index', 'Kabupaten atau kota berhasil dihapus.');
    }

    public function storeDistrict(DistrictDataRequest $request): RedirectResponse
    {
        District::query()->create($request->validated());

        return $this->redirectToPage(
            'admin.regions.districts.index',
            'Kecamatan berhasil ditambahkan.',
        );
    }

    public function updateDistrict(DistrictDataRequest $request, District $district): RedirectResponse
    {
        $district->update($request->validated());

        return $this->redirectToPage(
            'admin.regions.districts.index',
            'Kecamatan berhasil diperbarui.',
        );
    }

    public function destroyDistrict(District $district): RedirectResponse
    {
        $district->delete();

        return $this->redirectToPage('admin.regions.districts.index', 'Kecamatan berhasil dihapus.');
    }

    public function storeVillage(VillageDataRequest $request): RedirectResponse
    {
        Village::query()->create($request->validated());

        return $this->redirectToPage(
            'admin.regions.villages.index',
            'Desa berhasil ditambahkan.',
        );
    }

    public function updateVillage(VillageDataRequest $request, Village $village): RedirectResponse
    {
        $village->update($request->validated());

        return $this->redirectToPage(
            'admin.regions.villages.index',
            'Desa berhasil diperbarui.',
        );
    }

    public function destroyVillage(Village $village): RedirectResponse
    {
        $village->delete();

        return $this->redirectToPage('admin.regions.villages.index', 'Desa berhasil dihapus.');
    }

    private function redirectToPage(string $routeName, string $message): RedirectResponse
    {
        return redirect()
            ->route($routeName)
            ->with('success', $message);
    }

    /**
     * @return array{0:string,1:int,2:string,3:int,4:int,5:int}
     */
    private function indexFilters(Request $request): array
    {
        $search = trim((string) $request->input('search', ''));
        $perPage = (int) $request->input('per_page', 25);
        $sortBy = trim((string) $request->input('sort_by', 'name'));
        $sortDirection = trim((string) $request->input('sort_direction', 'asc'));
        $provinceId = (int) $request->input('province_id', 0);
        $regencyId = (int) $request->input('regency_id', 0);
        $districtId = (int) $request->input('district_id', 0);

        if (! in_array($perPage, [25, 50, 100], true)) {
            $perPage = 25;
        }

        if ($sortBy !== 'name') {
            $sortBy = 'name';
        }

        if (! in_array($sortDirection, ['asc', 'desc'], true)) {
            $sortDirection = 'asc';
        }

        return [$search, $perPage, $sortDirection, $provinceId, $regencyId, $districtId];
    }
}
