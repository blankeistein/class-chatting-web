<?php

namespace App\Http\Controllers\API\V2;

use App\Enums\RoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\API\V2\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use App\Services\FirebaseStorageService;
use App\Services\SyncStudentSchoolToFirestoreService;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\HeaderParameter;
use Google\Cloud\Firestore\FirestoreClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Kreait\Laravel\Firebase\Facades\Firebase;

#[Group('Profile V2', 'Endpoint versi 2 untuk melihat dan memperbarui profil pengguna yang terautentikasi Firebase.', 22)]
class ProfileController extends Controller
{
    public function __construct(
        private FirebaseStorageService $storage,
        private FirestoreClient $firestore,
        private SyncStudentSchoolToFirestoreService $syncStudentSchoolToFirestore,
    ) {}

    #[Endpoint(
        operationId: 'publicProfileShowV2',
        title: 'Get current user profile v2',
        description: 'Mengambil data profil pengguna yang sedang login berdasarkan Firebase ID token.'
    )]
    #[HeaderParameter('Authorization', 'Firebase ID token bearer. Format: `Bearer <firebase_id_token>`.', required: true, example: 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...')]
    public function show(Request $request): JsonResponse
    {
        $user = $this->resolveActiveUser($request);

        if (! $user) {
            return $this->errorResponse(401, 401, 'Pengguna tidak ditemukan atau tidak aktif.');
        }

        $user->load(['student.school:id,code,npsn,name']);

        return $this->successResponse([
            'message' => 'Profil berhasil diambil.',
            'data' => (new UserResource($user))->resolve(),
        ]);
    }

    #[Endpoint(
        operationId: 'publicProfileUpdateV2',
        title: 'Update current user profile v2',
        description: 'Memperbarui profil pengguna di database lokal lalu menyinkronkan perubahan ke Firebase Auth, Firebase Storage (avatar), dan Firestore di path `users/{uuid}` (field `name`, `searchUserName`, serta `schoolId`/`schoolName`/`schoolAddress` bila `schoolId` dikirim).'
    )]
    #[HeaderParameter('Authorization', 'Firebase ID token bearer. Format: `Bearer <firebase_id_token>`.', required: true, example: 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...')]
    #[BodyParameter('name', 'Nama lengkap pengguna.', required: true, example: 'Budi Santoso')]
    #[BodyParameter('email', 'Alamat email pengguna.', required: true, example: 'budi@example.com')]
    #[BodyParameter('username', 'Username unik pengguna.', required: false, example: 'budi_santoso')]
    #[BodyParameter('phone', 'Nomor telepon pengguna.', required: false, example: '+6281234567890')]
    #[BodyParameter('avatar', 'File gambar avatar (jpg, jpeg, png, webp). Maksimal 2MB.', required: false, type: 'string', format: 'binary')]
    #[BodyParameter('remove_avatar', 'Set true untuk menghapus avatar saat ini.', required: false, type: 'boolean', example: false)]
    #[BodyParameter('schoolId', 'ID sekolah di server. Menyimpan/memperbarui relasi murid dan menyinkronkan schoolId, schoolName, schoolAddress ke Firestore.', required: false, type: 'integer', example: 12)]
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->authenticatedUser() ?? $this->resolveActiveUser($request);

        if (! $user) {
            return $this->errorResponse(401, 401, 'Pengguna tidak ditemukan atau tidak aktif.');
        }

        $validated = $request->validated();

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'] ?? null,
            'phone' => $validated['phone'] ?? null,
        ];

        if ($request->boolean('remove_avatar') && $user->avatar) {
            $this->deleteAvatar($user);
            $data['avatar'] = null;
        }

        if ($request->hasFile('avatar')) {
            $avatarUrl = $this->uploadAvatar($request->file('avatar'), $user);

            if (! $avatarUrl) {
                return $this->errorResponse(500, 500, 'Gagal mengunggah avatar ke Firebase Storage.');
            }

            $data['avatar'] = $avatarUrl;
        }

        $user->update($data);
        $user->refresh();

        $this->syncFirebaseProfile($user);
        $this->syncFirestoreProfile($user);

        if (array_key_exists('schoolId', $validated) && $validated['schoolId'] !== null) {
            $this->syncSchoolAssignment($user, (int) $validated['schoolId']);
            $user->load(['student.school']);
        }

        return $this->successResponse([
            'message' => 'Profil berhasil diperbarui.',
            'data' => (new UserResource($user))->resolve(),
        ]);
    }

    private function resolveActiveUser(Request $request): ?User
    {
        $firebaseUid = $request->attributes->get('firebase_uid');

        if (! is_string($firebaseUid) || $firebaseUid === '') {
            return null;
        }

        return User::query()
            ->where('firebase_uid', $firebaseUid)
            ->where('is_active', true)
            ->first();
    }

    private function uploadAvatar(UploadedFile $file, User $user): ?string
    {
        try {
            $filename = 'user-'.$user->id.'-'.time().'.webp';
            $path = 'image-profile-user/'.$filename;

            $oldPath = $this->storage->extractPath($user->avatar);
            $this->storage->delete($oldPath);

            $this->storage->uploadImageAsWebp($file, $path, 80, 512);

            return $this->storage->buildUrl($path);
        } catch (\Throwable $e) {
            Log::error('Failed to upload avatar to Firebase Storage', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function deleteAvatar(User $user): void
    {
        $oldPath = $this->storage->extractPath($user->avatar);
        $this->storage->delete($oldPath);
    }

    private function syncFirebaseProfile(User $user): void
    {
        if (blank($user->firebase_uid)) {
            return;
        }

        try {
            $properties = [
                'displayName' => $user->name,
                'email' => $user->email,
            ];

            if ($user->avatar && str_starts_with($user->avatar, 'http')) {
                $properties['photoUrl'] = $user->avatar;
            } else {
                $properties['photoUrl'] = null;
            }

            if (filled($user->phone)) {
                $properties['phoneNumber'] = $user->phone;
            }

            Firebase::auth()->updateUser($user->firebase_uid, $properties);
        } catch (\Throwable $e) {
            Log::warning('Failed to sync profile to Firebase Auth', [
                'user_id' => $user->id,
                'firebase_uid' => $user->firebase_uid,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Sync name-related fields to Firestore document users/{uuid}.
     */
    private function syncFirestoreProfile(User $user): void
    {
        if (blank($user->firebase_uid)) {
            return;
        }

        try {
            $this->firestore
                ->collection('users')
                ->document($user->firebase_uid)
                ->set([
                    'name' => $user->name,
                    'searchUserName' => $this->buildSearchUserName($user->name),
                ], ['merge' => true]);
        } catch (\Throwable $e) {
            Log::warning('Failed to sync profile to Firestore', [
                'user_id' => $user->id,
                'firebase_uid' => $user->firebase_uid,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Persist school assignment on the server and sync school fields to Firestore.
     */
    private function syncSchoolAssignment(User $user, int $schoolId): void
    {
        $school = School::query()->find($schoolId);

        if (! $school) {
            return;
        }

        $student = Student::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'school_id' => $school->id,
                'is_active' => true,
            ]
        );

        if ($user->role === RoleEnum::User) {
            $user->forceFill(['role' => RoleEnum::Student])->save();
        }

        $this->syncStudentSchoolToFirestore->syncUserSchool(
            $user,
            $school,
            onlyIfDocumentExists: false,
        );

        $student->setRelation('school', $school);
        $user->setRelation('student', $student);
    }

    /**
     * Build searchable username tokens: full lowercase name plus space-separated parts.
     *
     * @return list<string>
     */
    private function buildSearchUserName(string $name): array
    {
        $normalized = mb_strtolower(trim(preg_replace('/\s+/u', ' ', $name) ?? $name));

        if ($normalized === '') {
            return [];
        }

        $parts = array_values(array_filter(
            explode(' ', $normalized),
            fn (string $part): bool => $part !== ''
        ));

        return array_values(array_unique([
            $normalized,
            ...$parts,
        ]));
    }

    private function successResponse(array $data, int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'status' => true,
            ...$data,
            'version' => 2,
        ], $statusCode);
    }

    private function errorResponse(int $statusCode, int $errorCode, string $message): JsonResponse
    {
        return response()->json([
            'status' => false,
            'errorCode' => $errorCode,
            'message' => $message,
            'version' => 2,
        ], $statusCode);
    }
}
