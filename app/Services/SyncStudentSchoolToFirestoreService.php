<?php

namespace App\Services;

use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Google\Cloud\Firestore\FirestoreClient;
use Illuminate\Support\Facades\Log;

class SyncStudentSchoolToFirestoreService
{
    public function __construct(
        private FirestoreClient $firestore,
    ) {}

    /**
     * Sync school fields for a student record to Firestore users/{firebase_uid}.
     * Only updates when the Firestore document already exists.
     */
    public function sync(Student $student): void
    {
        $student->loadMissing([
            'user:id,firebase_uid,name',
            'school.province:id,name',
            'school.regency:id,name',
            'school.district:id,name',
        ]);

        $user = $student->user;
        $school = $student->school;

        if (! $user instanceof User || ! $school instanceof School) {
            return;
        }

        $this->syncUserSchool($user, $school, onlyIfDocumentExists: true);
    }

    /**
     * Sync school fields to Firestore users/{firebase_uid}.
     *
     * @param  bool  $onlyIfDocumentExists  When true, skip if the Firestore document is missing.
     */
    public function syncUserSchool(User $user, School $school, bool $onlyIfDocumentExists = true): void
    {
        if (blank($user->firebase_uid)) {
            return;
        }

        $school->loadMissing([
            'province:id,name',
            'regency:id,name',
            'district:id,name',
        ]);

        try {
            $document = $this->firestore
                ->collection('users')
                ->document($user->firebase_uid);

            if ($onlyIfDocumentExists) {
                $snapshot = $document->snapshot();

                if (! $snapshot->exists()) {
                    Log::info('Skipping Firestore school sync because user document does not exist', [
                        'user_id' => $user->id,
                        'firebase_uid' => $user->firebase_uid,
                        'school_id' => $school->id,
                    ]);

                    return;
                }
            }

            $document->set([
                'schoolId' => $school->id,
                'schoolName' => $school->name,
                'schoolAddress' => $this->formatSchoolAddress($school),
            ], ['merge' => true]);
        } catch (\Throwable $e) {
            Log::warning('Failed to sync school to Firestore', [
                'user_id' => $user->id,
                'firebase_uid' => $user->firebase_uid,
                'school_id' => $school->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Build address string: desa/alamat, kecamatan, kabupaten, provinsi.
     */
    public function formatSchoolAddress(School $school): string
    {
        $locality = filled($school->address)
            ? trim((string) $school->address)
            : null;

        $parts = array_values(array_filter([
            $locality,
            $school->district?->name,
            $school->regency?->name,
            $school->province?->name,
        ], fn (?string $part): bool => filled($part)));

        return implode(', ', $parts);
    }
}
