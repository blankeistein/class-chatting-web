<?php

namespace App\Providers;

use App\Models\Book;
use App\Models\User;
use Dedoc\Scramble\RouteRegistrar;
use Dedoc\Scramble\Scramble;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

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

        Scramble::configure()->routes(function (RouteRegistrar $r) {
            $r->prefix('docs/api');
        });

        Gate::define('viewApiDocs', function (?User $user = null) {
            return $user && in_array($user->email, config('app.development_email'));
        });
    }
}
