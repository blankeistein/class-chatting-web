<?php

namespace App\Providers;

use App\Models\Book;
use App\Models\User;
use Dedoc\Scramble\Scramble;
use Google\Cloud\Firestore\FirestoreClient;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(FirestoreClient::class, function (): FirestoreClient {
            $credentialsPath = base_path((string) config('firebase.projects.app.credentials'));

            if (! File::exists($credentialsPath)) {
                throw new RuntimeException('File kredensial Firebase tidak ditemukan.');
            }

            $credentials = json_decode((string) File::get($credentialsPath), true);

            if (! is_array($credentials)) {
                throw new RuntimeException('Isi file kredensial Firebase tidak valid.');
            }

            $projectId = Arr::get($credentials, 'project_id', env('FIREBASE_PROJECT_ID'));

            if (! is_string($projectId) || $projectId === '') {
                throw new RuntimeException('Project ID Firebase tidak valid.');
            }

            return new FirestoreClient([
                'projectId' => $projectId,
                'credentials' => $credentials,
            ]);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        Relation::enforceMorphMap([
            'book' => Book::class,
            'user' => User::class,
        ]);

        Scramble::configure()
            ->routes(function (Route $route): bool {
                return Str::startsWith($route->uri(), ['api/v1', 'api/firebase', 'private-api']);
            })
            ->expose('docs/api', 'docs/api.json');

        Gate::define('viewApiDocs', function (?User $user = null): bool {
            if (app()->environment('testing')) {
                return true;
            }

            return $user !== null && in_array($user->email, (array) config('app.development_email', []), true);
        });

        RateLimiter::for('login', function (Request $request) {
            return [
                Limit::perMinute(5)->by($request->ip()),
                Limit::perMinute(3)->by($request->input('email')),
            ];
        });

    }
}
