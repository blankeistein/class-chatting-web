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
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\PathParameter;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Regions', 'Referensi wilayah Indonesia: provinsi, kabupaten atau kota, dan kecamatan.', 10)]
class RegionController extends Controller
{
    #[Endpoint(
        operationId: 'regionsListProvinces',
        title: 'List provinces',
        description: 'Mengambil daftar provinsi dalam format paginasi.'
    )]
    #[QueryParameter('search', 'Kata kunci pencarian berdasarkan kode atau nama provinsi.', required: false, example: 'jakarta')]
    #[QueryParameter('per_page', 'Jumlah item per halaman. Nilai yang valid antara 1 sampai 100.', required: false, type: 'integer', example: 25)]
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

    #[Endpoint(
        operationId: 'regionsShowProvince',
        title: 'Get province detail',
        description: 'Mengambil detail satu provinsi berdasarkan kode wilayah Indonesia.'
    )]
    #[PathParameter('province', 'Kode provinsi Indonesia yang dipakai route model binding.', example: '31')]
    public function province(Province $province): ProvinceResource
    {
        $province->loadCount(['regencies', 'districts']);

        return new ProvinceResource($province);
    }

    #[Endpoint(
        operationId: 'regionsListRegencies',
        title: 'List regencies',
        description: 'Mengambil daftar kabupaten atau kota dalam format paginasi beserta referensi provinsinya.'
    )]
    #[QueryParameter('search', 'Kata kunci pencarian berdasarkan kode atau nama kabupaten atau kota.', required: false, example: 'bandung')]
    #[QueryParameter('per_page', 'Jumlah item per halaman. Nilai yang valid antara 1 sampai 100.', required: false, type: 'integer', example: 25)]
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

    #[Endpoint(
        operationId: 'regionsListRegenciesByProvince',
        title: 'List regencies by province',
        description: 'Mengambil daftar kabupaten atau kota yang berada dalam satu provinsi tertentu.'
    )]
    #[PathParameter('province', 'Kode provinsi Indonesia yang menjadi induk data kabupaten atau kota.', example: '31')]
    #[QueryParameter('search', 'Kata kunci pencarian berdasarkan kode atau nama kabupaten atau kota.', required: false, example: 'selatan')]
    #[QueryParameter('per_page', 'Jumlah item per halaman. Nilai yang valid antara 1 sampai 100.', required: false, type: 'integer', example: 25)]
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

    #[Endpoint(
        operationId: 'regionsShowRegency',
        title: 'Get regency detail',
        description: 'Mengambil detail satu kabupaten atau kota berdasarkan kode wilayah Indonesia.'
    )]
    #[PathParameter('regency', 'Kode kabupaten atau kota Indonesia yang dipakai route model binding.', example: '3171')]
    public function regency(Regency $regency): RegencyResource
    {
        $regency->load('province')->loadCount('districts');

        return new RegencyResource($regency);
    }

    #[Endpoint(
        operationId: 'regionsListDistricts',
        title: 'List districts',
        description: 'Mengambil daftar kecamatan dalam format paginasi beserta konteks kabupaten atau kota dan provinsinya.'
    )]
    #[QueryParameter('search', 'Kata kunci pencarian berdasarkan kode atau nama kecamatan.', required: false, example: 'kebayoran')]
    #[QueryParameter('per_page', 'Jumlah item per halaman. Nilai yang valid antara 1 sampai 100.', required: false, type: 'integer', example: 25)]
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

    #[Endpoint(
        operationId: 'regionsListDistrictsByRegency',
        title: 'List districts by regency',
        description: 'Mengambil daftar kecamatan untuk satu kabupaten atau kota tertentu.'
    )]
    #[PathParameter('regency', 'Kode kabupaten atau kota Indonesia yang menjadi induk data kecamatan.', example: '3171')]
    #[QueryParameter('search', 'Kata kunci pencarian berdasarkan kode atau nama kecamatan.', required: false, example: 'baru')]
    #[QueryParameter('per_page', 'Jumlah item per halaman. Nilai yang valid antara 1 sampai 100.', required: false, type: 'integer', example: 25)]
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

    #[Endpoint(
        operationId: 'regionsShowDistrict',
        title: 'Get district detail',
        description: 'Mengambil detail satu kecamatan berdasarkan kode wilayah Indonesia.'
    )]
    #[PathParameter('district', 'Kode kecamatan Indonesia yang dipakai route model binding.', example: '3171010')]
    public function district(District $district): DistrictResource
    {
        $district->load(['regency.province']);

        return new DistrictResource($district);
    }
}
