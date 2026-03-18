<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegionListRequest;
use App\Http\Resources\DistrictResource;
use App\Http\Resources\ProvinceResource;
use App\Http\Resources\RegencyResource;
use App\Models\District;
use App\Models\Province;
use App\Models\Regency;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RegionController extends Controller
{
    public function provinces(RegionListRequest $request): AnonymousResourceCollection
    {
        $provinces = Province::query()
            ->search($request->searchTerm())
            ->withCount('regencies')
            ->orderBy('code')
            ->paginate($request->perPage())
            ->withQueryString();

        return ProvinceResource::collection($provinces);
    }

    public function province(Province $province): ProvinceResource
    {
        $province->loadCount(['regencies', 'districts']);

        return new ProvinceResource($province);
    }

    public function regencies(RegionListRequest $request): AnonymousResourceCollection
    {
        $regencies = Regency::query()
            ->with('province')
            ->withCount('districts')
            ->search($request->searchTerm())
            ->orderBy('code')
            ->paginate($request->perPage())
            ->withQueryString();

        return RegencyResource::collection($regencies);
    }

    public function regenciesByProvince(RegionListRequest $request, Province $province): AnonymousResourceCollection
    {
        $regencies = $province->regencies()
            ->with('province')
            ->withCount('districts')
            ->search($request->searchTerm())
            ->orderBy('code')
            ->paginate($request->perPage())
            ->withQueryString();

        return RegencyResource::collection($regencies);
    }

    public function regency(Regency $regency): RegencyResource
    {
        $regency->load('province')->loadCount('districts');

        return new RegencyResource($regency);
    }

    public function districts(RegionListRequest $request): AnonymousResourceCollection
    {
        $districts = District::query()
            ->with(['regency.province'])
            ->search($request->searchTerm())
            ->orderBy('code')
            ->paginate($request->perPage())
            ->withQueryString();

        return DistrictResource::collection($districts);
    }

    public function districtsByRegency(RegionListRequest $request, Regency $regency): AnonymousResourceCollection
    {
        $districts = $regency->districts()
            ->with(['regency.province'])
            ->search($request->searchTerm())
            ->orderBy('code')
            ->paginate($request->perPage())
            ->withQueryString();

        return DistrictResource::collection($districts);
    }

    public function district(District $district): DistrictResource
    {
        $district->load(['regency.province']);

        return new DistrictResource($district);
    }
}
