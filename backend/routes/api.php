<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SSOController;
use App\Http\Controllers\Api\InternalSyncController;


/*
|--------------------------------------------------------------------------
| PUBLIC (No Auth)
|--------------------------------------------------------------------------
*/

\Illuminate\Support\Facades\Log::info('Incoming request', [
    'url'    => request()->fullUrl(),
    'method' => request()->method(),
    'query'  => request()->query(),
    ]);
    

if (app()->environment('local')) {
    Route::post('/dev/login', [AuthController::class, 'devLogin']);
}

Route::post('/register', [AuthController::class, 'register'])->name('api.register');
Route::post('/login', [AuthController::class, 'login']);
Route::get('/department', [DepartmentController::class, 'index']);

Route::get('/auth/sso-url', [SSOController::class, 'getSsoUrl']);
Route::get('/auth/callback', [SSOController::class, 'callback']);

Route::middleware('internal.secret')->group(function () {
    Route::post('/internal/sync-user', [InternalSyncController::class, 'syncUser']);
    Route::delete('/internal/sync-user/{username}', [InternalSyncController::class, 'deleteUser']);
    Route::post('/internal/force-logout', [InternalSyncController::class, 'forceLogout']);

    
});
/*
|--------------------------------------------------------------------------
| AUTHENTICATED (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // ===========================
    // AUTH / PROFILE
    // ===========================
    Route::get('/profile', [UserController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/auth/pg-token', [SSOController::class, 'getPgToken']);

    // ===========================
    // USER SIDE
    // ===========================
    Route::prefix('user')->group(function () {
        // ticket (user)
        Route::post('/ticket', [TicketController::class, 'storeByUser']);
        Route::get('/tickets', [TicketController::class, 'indexUser']); // sebelumnya /my-ticket
        Route::put('/ticket/{id}', [TicketController::class, 'updateByUser']);

        // support list (user)
        Route::get('/supports', [UserController::class, 'SupportIndex']);

        // feedback (user)
        Route::post('/feedback/{id}', [FeedbackController::class, 'store']);

        // category (user) - kalau memang user boleh akses
        Route::resource('category', CategoryController::class)->except(['create', 'edit']);

        // reports user
        Route::prefix('reports')->group(function () {
            Route::get('/tickets', [ReportController::class, 'ticketReportUser']);
            // kalau FE lama masih manggil 2 endpoint, keep alias:
            Route::get('/ticket-user', [ReportController::class, 'ticketReportUser']);
            Route::get('/user-tickets', [ReportController::class, 'ticketReportUser']);
        });
    });

    // ===========================
    // ADMIN SIDE
    // ===========================
    Route::middleware('admin')->group(function () {

        // ---------------------------
        // Users / Support / Developer
        // ---------------------------
        Route::post('/department', [DepartmentController::class, 'store']);
        Route::put('/department/{id}', [DepartmentController::class, 'update']);
        Route::delete('/department/{id}', [DepartmentController::class, 'destroy']);
        Route::get('/support', [UserController::class, 'supports']);
        Route::get('/developer', [UserController::class, 'developer']);

        Route::post('/user', [UserController::class, 'registerByAdmin']);
        Route::post('/approve-user/{id}', [AuthController::class, 'approveUser']);
        Route::put('/user/{id}', [UserController::class, 'update']);
        Route::delete('/user/{id}', [UserController::class, 'destroy']);
        Route::get('/user', [UserController::class, 'index']);

        // ---------------------------
        // MASTER DATA (Admin)
        // ---------------------------
        Route::resource('location', LocationController::class)->except(['create', 'edit']);
        Route::resource('asset', AssetController::class)->except(['create', 'edit']);

        // ---------------------------
        // TICKETS (Admin)
        // ---------------------------
        Route::prefix('ticket')->group(function () {
            Route::post('/admin', [TicketController::class, 'storeByAdmin']);
            Route::put('/{id}', [TicketController::class, 'updateByAdmin']);
            Route::patch('/resolved/{id}', [TicketController::class, 'resolveTicket']);
            Route::patch('/cancel/{id}', [TicketController::class, 'cancelTicket']);
            Route::patch('/void/{id}', [TicketController::class, 'voidTicket']);
            Route::get('/', [TicketController::class, 'index']);
        });

        // ---------------------------
        // FEEDBACK (Admin)
        // ---------------------------
        Route::get('/feedback', [FeedbackController::class, 'index']);

        // ---------------------------
        // PROJECT (Admin)
        // ---------------------------
        Route::prefix('project')->group(function () {
            Route::get('/', [ProjectController::class, 'index']);
            Route::post('/', [ProjectController::class, 'store']);

            Route::post('/{id}/start', [ProjectController::class, 'start']);
            Route::post('/{id}/progress', [ProjectController::class, 'progress']);
            Route::post('/{id}/hold', [ProjectController::class, 'hold']);
            Route::post('/{id}/unhold', [ProjectController::class, 'unhold']);
            Route::post('/{id}/void', [ProjectController::class, 'void']);
            Route::post('/{id}/resolve', [ProjectController::class, 'resolve']);

            Route::get('/{id}/history', [ProjectController::class, 'history']);
            Route::put('/{id}', [ProjectController::class, 'update']);
        });

        // ---------------------------
        // REPORTS (Admin)
        // ---------------------------
        Route::prefix('reports')->group(function () {

            // ticket summary
            Route::get('/ticket-all', [ReportController::class, 'ticketReport']);

            // export
            Route::get('/tickets/preview', [ReportController::class, 'previewExportTickets']);
            Route::get('/tickets/export', [ReportController::class, 'exportDataTicket']);

            // charts utama
            Route::get('/tickets/per-month', [ReportController::class, 'ticketsPerMonth']);
            Route::get('/tickets/time-spent-per-month-department', [ReportController::class, 'totalTimeSpentPerMonthByDepartment']);
            Route::get('/tickets/distribution-category', [ReportController::class, 'ticketDistributionByCategory']);
            Route::get('/tickets/sla', [ReportController::class, 'slaReport']);

            // by support
            Route::prefix('supports')->group(function () {
                Route::get('/summary', [ReportController::class, 'supportSummary']);
                Route::get('/tickets-per-month', [ReportController::class, 'ticketsPerMonthBySupport']);
                Route::get('/time-spent-per-month', [ReportController::class, 'timeSpentPerMonthBySupport']);
                Route::get('/{supportId}/tickets', [ReportController::class, 'ticketsDetailBySupport']);
            });

            // by developer
            Route::prefix('developers')->group(function () {
                Route::get('/projects/summary', [ReportController::class, 'developerProjectSummary']);
                Route::get('/{developerId}/projects', [ReportController::class, 'developerProjectDetail']);
            });

            // project reports
            Route::prefix('projects')->group(function () {
                Route::get('/summary', [ReportController::class, 'projectSummary']);
                Route::get('/gantt', [ReportController::class, 'projectGanttReport']);
                Route::get('/gantt-detail', [ReportController::class, 'projectGanttDetailReport']);
                Route::get('/preview', [ReportController::class, 'previewExportProjects']);
                Route::get('/export', [ReportController::class, 'exportDataProject']);
            });
        });
    });
});

