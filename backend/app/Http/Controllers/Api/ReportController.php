<?php

namespace App\Http\Controllers\Api;

use App\Exports\ProjectsExport;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserTicketReportResource;
use App\Http\Resources\Report\TicketDistributionByCategoryResource;
use App\Http\Resources\Report\SlaReportResource;
use App\Http\Resources\TicketCollection;
use App\Http\Resources\TicketReportResource;
use App\Http\Resources\Report\TotalTimeSpentByDepartmentResource;
use App\Models\Tickets;
use App\Exports\TicketsExport;
use App\Http\Resources\report\SupportSummaryResource;
use App\Http\Resources\report\SupportTicketsPerMonthResource as ReportSupportTicketsPerMonthResource;
use App\Http\Resources\report\SupportTimeSpentPerMonthResource as ReportSupportTimeSpentPerMonthResource;
use App\Http\Resources\Report\TicketsPerMonthResource as ReportTicketsPerMonthResource;
use App\Models\ProjectHeaders;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\DB;
use App\Models\ProjectDetails;
use App\Exports\ProjectsDetailsExport;
use Illuminate\Container\Attributes\Log;

class ReportController extends Controller
{
    private function buildTicketQuery(Request $request)
    {
        $status = $request->query('status');
        $start  = $request->query('start_date');
        $end    = $request->query('end_date');

        return Tickets::query()
            ->with([
                'user:id,name',
                'support:id,name',
                'category:id,name',
                'assets:id,assets_name',
            ])
            ->when($start && $end, fn($q) => $q->betweenRequestDates($start, $end))
            ->when($status && $status !== 'all', fn($q) => $q->byStatus($status))
            ->latest();
    }

    public function ticketReport(Request $request)
    {
        $start = $request->query('start_date');
        $end   = $request->query('end_date');

        $data = [
            'status' => Tickets::statusCount($start, $end),
            'sla'    => Tickets::slaReport($start, $end),
        ];

        return response()->json([
            'message' => 'Ticket report fetched successfully',
            'data'    => new TicketReportResource($data)
        ], 200);
    }

    public function ticketReportUser(Request $request)
    {
        $start  = $request->query('start_date');
        $end    = $request->query('end_date');
        $userId = auth()->id();

        $data = [
            'status' => Tickets::statusCountUser($userId, $start, $end),
        ];

        return response()->json([
            'message' => 'Ticket report fetched successfully',
            'data'    => new UserTicketReportResource($data)
        ], 200);
    }
    public function ticketsPerMonth(Request $request)
    {
        $year = (int) ($request->query('year') ?? now()->year);

        $rows = Tickets::selectRaw('MONTH(created_at) as month, COUNT(*) as count')
            ->whereYear('created_at', $year)
            ->groupByRaw('MONTH(created_at)')
            ->get()
            ->keyBy('month');

        $data = collect(range(1, 12))->map(function ($m) use ($rows, $year) {
            return [
                'year'  => $year,
                'month' => $m,
                'count' => (int) ($rows[$m]->count ?? 0),
            ];
        });

        return response()->json([
            'message' => 'Tickets per month fetched successfully',
            'data'    => ReportTicketsPerMonthResource::collection($data),
        ], 200);
    }

    /**
     * ✅ FIX: YEAR-BASED (bukan start/end)
     * Query param: ?year=2026
     */
    public function totalTimeSpentPerMonthByDepartment(Request $request)
    {
        $year = (int) ($request->query('year') ?? now()->year);

        // ✅ anti double: 1 ticket cuma dihitung 1x
        $base = Tickets::query()
            ->selectRaw('tickets.id as ticket_id')
            ->selectRaw('tickets.user_id as user_id')
            ->selectRaw('tickets.time_spent as time_spent')
            ->selectRaw('MONTH(tickets.created_at) as month')
            ->whereYear('tickets.created_at', $year)
            ->whereIn('tickets.status', ['resolved', 'feedback']);

        $rows = DB::query()
            ->fromSub($base, 't')
            ->selectRaw('users.department_id as department_id')
            ->addSelect('departments.name as department_name')
            ->selectRaw('t.month as month')
            ->selectRaw('COALESCE(SUM(t.time_spent),0) as total_minutes')
            ->join('users', 't.user_id', '=', 'users.id')
            ->join('departments', 'users.department_id', '=', 'departments.id')
            ->whereNotNull('users.department_id')
            ->where('users.department_id', '>', 0)
            ->groupBy('users.department_id', 'departments.name', 't.month')
            ->orderBy('users.department_id')
            ->orderBy('t.month')
            ->get();

        $items = $rows->map(function ($r) {
            return [
                'department_id'   => (int) $r->department_id,
                'department_name' => $r->department_name,
                'month'           => (int) $r->month,
                'total_minutes'   => (int) $r->total_minutes,
            ];
        })->values();

        $labels = collect(range(1, 12))->values();

        $series = collect($items)
            ->groupBy('department_id')
            ->map(function ($list) use ($labels) {
                $first = $list->first();
                $name = $first['department_name'] ?? 'Unknown';
                $mapMonth = collect($list)->keyBy('month');

                $dataMinutes = $labels
                    ->map(fn($m) => (int) ($mapMonth[$m]['total_minutes'] ?? 0))
                    ->values();

                return [
                    'department_id'   => (int) ($first['department_id'] ?? 0),
                    'department_name' => $name,
                    'data_minutes'    => $dataMinutes,
                ];
            })
            ->values();

        return response()->json([
            'message' => 'Time spent per month by department fetched successfully',
            'meta' => [
                'year' => $year,
            ],
            'chart' => [
                'labels' => $labels,
                'series' => $series,
            ],
            'raw' => $items,
        ], 200);
    }

    public function slaReport(Request $request)
    {
        $start = $request->query('start_date');
        $end   = $request->query('end_date');

        if (!$start || !$end) {
            return response()->json([
                'message' => 'start_date dan end_date wajib diisi',
            ], 422);
        }

        $report = Tickets::slaReport($start, $end);

        return response()->json([
            'message' => 'SLA report fetched successfully',
            'data'    => new SlaReportResource($report),
        ], 200);
    }

    public function ticketDistributionByCategory(Request $request)
    {
        $start = $request->query('start_date');
        $end   = $request->query('end_date');

        if (!$start || !$end) {
            return response()->json([
                'message' => 'start_date dan end_date wajib diisi',
            ], 422);
        }

        $distribution = Tickets::query()
            ->selectRaw('category_id, COUNT(*) as count')
            ->with('category:id,name')
            ->whereBetween('created_at', ["$start 00:00:00", "$end 23:59:59"])
            ->groupBy('category_id')
            ->orderByDesc('count')
            ->get();

        return response()->json([
            'message' => 'Ticket distribution by category fetched successfully',
            'data'    => TicketDistributionByCategoryResource::collection($distribution),
        ], 200);
    }

    public function previewExportTickets(Request $request)
    {
        $status = $request->query('status'); // all|open|resolved|...
        $start  = $request->query('start_date');
        $end    = $request->query('end_date');

        // default: hari ini (biar ga berat kalau lupa input)
        $start = $start ?: now()->startOfDay()->toDateString();
        $end   = $end   ?: now()->endOfDay()->toDateString();

        $perPage = (int) $request->query('per_page', 50);

        $q = Tickets::query()
            ->with([
                'user:id,name',
                'support:id,name',
                'category:id,name',
                'assets:id,assets_name',
            ])
            ->whereBetween('created_at', ["$start 00:00:00", "$end 23:59:59"])
            ->when($status && $status !== 'all', fn($qq) => $qq->byStatus($status))
            ->latest();

        $tickets = $q->paginate($perPage);

        return response()->json([
            'message' => 'Preview tickets fetched successfully',
            'data'    => new TicketCollection($tickets), // kalau lu udah punya
        ], 200);
    }

    public function exportDataTicket(Request $request)
    {
        $status = $request->query('status');
        $start  = $request->query('start_date');
        $end    = $request->query('end_date');

        $filename = 'tickets_export_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download(
            new TicketsExport($status, $start, $end),
            $filename
        );
    }

    public function ticketsPerMonthBySupport(Request $request)
{
    $year  = (int) ($request->query('year') ?? now()->year);
    $start = $request->query('start_date');
    $end   = $request->query('end_date');

    // ✅ kalau start/end kosong, pakai full year dari "year"
    if (!$start || !$end) {
        $start = now()->setYear($year)->startOfYear()->toDateString();
        $end   = now()->setYear($year)->endOfYear()->toDateString();
    }

    $rows = Tickets::query()
        ->selectRaw('support_id, MONTH(created_at) as month, COUNT(*) as count')
        ->with('support:id,name')
        ->whereNotNull('support_id')
        ->where('support_id', '>', 0)
        ->whereBetween('created_at', ["$start 00:00:00", "$end 23:59:59"])
        ->groupBy('support_id', 'month')
        ->orderBy('support_id')
        ->orderBy('month')
        ->get();

    $items = ReportSupportTicketsPerMonthResource::collection($rows)->resolve();
    $labels = collect(range(1, 12))->values();

    $series = collect($items)
        ->groupBy('support_id')
        ->map(function ($list) use ($labels) {
            $name = $list->first()['support_name'] ?? 'Unknown';
            $mapMonth = collect($list)->keyBy('month');

            $data = $labels->map(fn($m) => (int)($mapMonth[$m]['count'] ?? 0))->values();

            return [
                'support_id'   => (int) $list->first()['support_id'],
                'support_name' => $name,
                'data'         => $data,
            ];
        })
        ->values();

    return response()->json([
        'message' => 'Tickets per month by support fetched successfully',
        'meta' => [
            'year'       => $year,
            'start_date' => $start,
            'end_date'   => $end,
        ],
        'chart' => [
            'labels' => $labels,
            'series' => $series,
        ],
        'raw' => $items,
    ], 200);
}


    public function timeSpentPerMonthBySupport(Request $request)
{
    $year  = (int) ($request->query('year') ?? now()->year);
    $start = $request->query('start_date');
    $end   = $request->query('end_date');

    if (!$start || !$end) {
        $start = now()->setYear($year)->startOfYear()->toDateString();
        $end   = now()->setYear($year)->endOfYear()->toDateString();
    }

    $rows = Tickets::query()
        ->selectRaw('support_id, MONTH(created_at) as month, COALESCE(SUM(time_spent),0) as total_minutes')
        ->with('support:id,name')
        ->whereNotNull('support_id')
        ->where('support_id', '>', 0)
        ->whereBetween('created_at', ["$start 00:00:00", "$end 23:59:59"])
        ->groupBy('support_id', 'month')
        ->orderBy('support_id')
        ->orderBy('month')
        ->get();

    $items = ReportSupportTimeSpentPerMonthResource::collection($rows)->resolve();
    $labels = collect(range(1, 12))->values();

    $series = collect($items)
        ->groupBy('support_id')
        ->map(function ($list) use ($labels) {
            $name = $list->first()['support_name'] ?? 'Unknown';
            $mapMonth = collect($list)->keyBy('month');

            $dataMinutes = $labels->map(fn($m) => (int)($mapMonth[$m]['total_minutes'] ?? 0))->values();

            return [
                'support_id'   => (int) $list->first()['support_id'],
                'support_name' => $name,
                'data_minutes' => $dataMinutes,
            ];
        })
        ->values();

    return response()->json([
        'message' => 'Time spent per month by support fetched successfully',
        'meta' => [
            'year'       => $year,
            'start_date' => $start,
            'end_date'   => $end,
        ],
        'chart' => [
            'labels' => $labels,
            'series' => $series,
        ],
        'raw' => $items,
    ], 200);
}


    public function supportSummary(Request $request)
    {
        $start  = $request->query('start_date') ?: now()->startOfMonth()->toDateString();
        $end    = $request->query('end_date')   ?: now()->endOfMonth()->toDateString();
        $status = $request->query('status'); // optional filter

        $rows = Tickets::query()
            ->selectRaw('
            support_id,
            COUNT(*) as total_tickets,
            SUM(CASE WHEN status IN ("resolved","feedback") THEN 1 ELSE 0 END) as resolved_tickets,
            SUM(CASE WHEN status NOT IN ("resolved","feedback") THEN 1 ELSE 0 END) as open_tickets,
            SUM(CASE WHEN is_late = 1 THEN 1 ELSE 0 END) as late_tickets,
            COALESCE(SUM(time_spent),0) as total_minutes
            ')

            ->with('support:id,name')
            ->whereNotNull('support_id')
            ->where('support_id', '>', 0)
            ->whereBetween('created_at', ["$start 00:00:00", "$end 23:59:59"])
            ->when($status && $status !== 'all', fn($q) => $q->byStatus($status))
            ->groupBy('support_id')
            ->orderByDesc('total_tickets')
            ->get();


        return response()->json([
            'message' => 'Support summary fetched successfully',
            'meta' => [
                'start_date' => $start,
                'end_date'   => $end,
                'status'     => $status ?? 'all',
            ],
            'data' => SupportSummaryResource::collection($rows),
        ], 200);
    }

    public function ticketsDetailBySupport(Request $request, $supportId)
    {
        $start  = $request->query('start_date') ?: now()->startOfDay()->toDateString();
        $end    = $request->query('end_date')   ?: now()->endOfDay()->toDateString();
        $status = $request->query('status');

        $tickets = Tickets::query()
            ->with([
                'user:id,name',
                'support:id,name',
                'category:id,name',
                'assets:id,assets_name',
            ])
            ->where('support_id', $supportId)
            ->whereBetween('created_at', ["$start 00:00:00", "$end 23:59:59"])
            ->when($status && $status !== 'all', fn($q) => $q->byStatus($status))
            ->latest()
            ->paginate((int) $request->query('per_page', 50));

        return response()->json([
            'message' => 'Ticket detail by support fetched successfully',
            'data'    => new TicketCollection($tickets),
        ], 200);
    }

    public function projectSummary(Request $request)
    {
        $year = (int) ($request->query('year') ?? now()->year);
        $data = ProjectHeaders::projectSummary($year);

        return response()->json([
            'message' => 'Project summary fetched successfully',
            'data' => $data,
        ], 200);
    }

    public function projectGanttReport(Request $request)
{
    $year = (int) ($request->query('year') ?? now()->year);

    // ✅ window default setahun, tapi bisa override kalau nanti lu mau custom range
    $rangeStart = $request->query('start_date') ?: "{$year}-01-01";
    $rangeEnd   = $request->query('end_date')   ?: "{$year}-12-31";

    $filters = [
        'year'       => $year,
        'start_date' => $rangeStart,
        'end_date'   => $rangeEnd,
        'status'     => $request->query('status'),
        'q'          => $request->query('q'),
    ];

    $data = ProjectHeaders::projectGanttReport($filters);

    return response()->json([
        'message' => 'Project gantt report fetched successfully',
        'meta' => [
            'year'       => $year,
            'start_date' => $rangeStart,
            'end_date'   => $rangeEnd,
            'status'     => $filters['status'] ?? 'all',
            'q'          => $filters['q'] ?? null,
        ],
        'data' => $data,
    ], 200);
}
public function projectGanttDetailReport(Request $request)
{
    $request->validate([
        'project_id' => ['required', 'integer', 'exists:project_headers,id'],
    ]);

    $projectId = (int) $request->query('project_id');

    try {
        $data = ProjectHeaders::projectGanttDetailReport($projectId);

        return response()->json([
            'message' => 'Project gantt detail fetched successfully',
            'data' => $data,
        ], 200);
    } catch (\Throwable $e) {
        Log::error('projectGanttDetailReport error', [
            'project_id' => $projectId,
            'error' => $e->getMessage(),
        ]);

        return response()->json([
            'message' => 'Failed to fetch project gantt detail',
            'error' => $e->getMessage(), // matiin di production kalo mau
        ], 500);
    }
}

    public function projectGanttSummary(Request $request)
{
    $year = (int) ($request->query('year') ?? now()->year);

    $rangeStart = $request->query('start_date') ?: "{$year}-01-01";
    $rangeEnd   = $request->query('end_date')   ?: "{$year}-12-31";

    $data = ProjectHeaders::projectGanttSummary([
        'start_date' => $rangeStart,
        'end_date'   => $rangeEnd,
    ]);

    return response()->json([
        'message' => 'Project gantt summary fetched successfully',
        'meta' => [
            'year' => $year,
            'start_date' => $rangeStart,
            'end_date' => $rangeEnd,
        ],
        'data' => $data,
    ], 200);
}


public function previewExportProjects(Request $request)
{
    $year    = (int) ($request->query('year') ?? now()->year);
    $status  = $request->query('status'); // header status
    $q       = $request->query('q');      // search
    $perPage = (int) $request->query('per_page', 50);

    $p = ProjectDetails::projectDetailsExportQuery([
        'year' => $year,
        'status' => $status,
        'q' => $q,
    ])->paginate($perPage);

    return response()->json([
        'message' => 'Preview projects (details) fetched successfully',
        'data' => $p,
    ], 200);
}

public function exportDataProject(Request $request)
{
    $year   = (int) ($request->query('year') ?? now()->year);
    $status = $request->query('status');
    $q      = $request->query('q');

    $filename = 'projects_details_export_' . now()->format('Ymd_His') . '.xlsx';

    return \Maatwebsite\Excel\Facades\Excel::download(
        new ProjectsDetailsExport($year, $status, $q),
        $filename
    );
}



    /**
     * ✅ Developer performance summary (project-based)
     * summary per developer berdasarkan project_details.developer_id
     */
    public function developerProjectSummary(Request $request)
    {
        $year   = (int) ($request->query('year') ?? now()->year);
        $status = $request->query('status'); // optional: filter status header
        $q      = $request->query('q');      // optional: filter project code/name

        $rows = ProjectHeaders::developerProjectSummary([
            'year' => $year,
            'status' => $status,
            'q' => $q,
        ]);

        return response()->json([
            'message' => 'Developer project summary fetched successfully',
            'meta' => [
                'year' => $year,
                'status' => $status ?? 'all',
                'q' => $q ?? null,
            ],
            'data' => $rows,
        ], 200);
    }

    /**
     * ✅ Developer detail: list project apa aja yang dia kerjain + summary kecil
     */
    public function developerProjectDetail(Request $request, $developerId)
    {
        $year   = (int) ($request->query('year') ?? now()->year);
        $status = $request->query('status');
        $q      = $request->query('q');
        $perPage = (int) $request->query('per_page', 50);

        $data = ProjectHeaders::developerProjectDetail((int) $developerId, [
            'year' => $year,
            'status' => $status,
            'q' => $q,
            'per_page' => $perPage,
        ]);

        return response()->json([
            'message' => 'Developer project detail fetched successfully',
            'meta' => [
                'year' => $year,
                'status' => $status ?? 'all',
                'q' => $q ?? null,
                'developer_id' => (int) $developerId,
            ],
            'data' => $data,
        ], 200);
    }
}
