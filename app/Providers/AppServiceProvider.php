<?php

namespace App\Providers;

use App\Models\Book;
use App\Models\User;
use Dedoc\Scramble\Scramble;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
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
