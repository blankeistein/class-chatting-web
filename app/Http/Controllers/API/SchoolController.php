<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegionListRequest;
use App\Http\Resources\SchoolResource;
use App\Models\School;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\PathParameter;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Schools', 'Referensi data sekolah beserta konteks wilayah administratif.', 11)]
class SchoolController extends Controller
{
    #[Endpoint(
        operationId: 'schoolsList',
        title: 'List schools',
        description: 'Mengambil daftar sekolah dalam format paginasi dengan dukungan pencarian NPSN atau nama sekolah.'
    )]
    #[QueryParameter('search', 'Kata kunci pencarian berdasarkan NPSN atau nama sekolah.', required: false, example: 'SMAN')]
    #[QueryParameter('per_page', 'Jumlah item per halaman. Nilai yang valid antara 1 sampai 100.', required: false, type: 'integer', example: 25)]
    public function index(RegionListRequest $request): AnonymousResourceCollection
    {
        $schools = School::query()
            ->with(['province', 'regency', 'district', 'village'])
            ->search($request->searchTerm())
            ->orderBy('name')
            ->paginate($request->perPage())
            ->withQueryString();

        return SchoolResource::collection($schools);
    }

    #[Endpoint(
        operationId: 'schoolsShow',
        title: 'Get school detail',
        description: 'Mengambil detail satu sekolah berdasarkan id.'
    )]
    #[PathParameter('school', 'Id sekolah yang dipakai route model binding.', example: '1')]
    public function show(School $school): SchoolResource
    {
        $school->load(['province', 'regency', 'district', 'village']);

        return new SchoolResource($school);
    }
}
