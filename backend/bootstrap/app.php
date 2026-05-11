<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\ManagerMiddleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

// Load base environment first, then let .env.local override it for local development.
$basePath = dirname(__DIR__);

if (file_exists($basePath . '/.env')) {
    Dotenv\Dotenv::createMutable($basePath, '.env')->safeLoad();
}

if (file_exists($basePath . '/.env.local')) {
    Dotenv\Dotenv::createMutable($basePath, '.env.local')->safeLoad();
}

return Application::configure(basePath: $basePath)
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(function ($request) {
            if ($request->is('api/*')) {
                return null;
            }

            return '/login';
        });

        $middleware->alias([
            'admin'            => \App\Http\Middleware\AdminMiddleware::class,
            'manager'          => \App\Http\Middleware\ManagerMiddleware::class,
            'internal.secret'  => \App\Http\Middleware\InternalSecretMiddleware::class,
        ]);

        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (AuthenticationException $exception, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }
        });
    })->create();
