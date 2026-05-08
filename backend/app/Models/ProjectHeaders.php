<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ProjectHeaders extends Model
{
    protected $table = 'project_headers';

    protected $fillable = [
        'project_code',
        'project_name',
        'request_date',
        'requestor_id',
        'status', 
        'priority',
        'progress_percent',
        'description',
        'notes',
        'progress_date',
        'start_date',
        'end_date',
        'actual_start_date',
        'actual_end_date',
        'total_pending_minutes',
        'effective_end_date',
        'is_late',
    ];

    protected $casts = [
        'request_date'       => 'datetime',
        'start_date'         => 'datetime',
        'end_date'           => 'datetime',
        'actual_start_date'  => 'datetime',
        'actual_end_date'    => 'datetime',
        'effective_end_date' => 'datetime',
        'is_late'            => 'boolean',
    ];

    // ==========================
    // RELATIONS
    // ==========================
    public function details()
    {
        return $this->hasMany(ProjectDetails::class, 'project_header_id', 'id');
    }

    public function requestor()
    {
        return $this->belongsTo(User::class, 'requestor_id');
    }

    public function pendings()
    {
        return $this->hasMany(Pendings::class, 'project_header_id', 'id');
    }

    // ==========================
    // CONSTANTS STATUS (biar konsisten)
    // ==========================
    public const STATUS_WAITING     = 'waiting';
    public const STATUS_PENDING     = 'pending';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_VOID        = 'void';
    public const STATUS_RESOLVED    = 'resolved';

    // ==========================
    // SUMMARY FOR DASHBOARD
    // ==========================
    public static function projectSummary(int $year)
    {
        $query = self::query()->whereYear('start_date', $year);

        $waiting     = (clone $query)->waiting()->count();
        $pending     = (clone $query)->pending()->count();
        $inProgress  = (clone $query)->inProgress()->count();
        $resolved    = (clone $query)->resolved()->count();
        $void        = (clone $query)->void()->count();
        $total       = (clone $query)->count();

        // Closed on time / late (hanya resolved)
        $closedOnTime = (clone $query)->resolved()->where('is_late', 0)->count();
        $closedLate   = (clone $query)->resolved()->where('is_late', 1)->count();

        // SLA (normal): resolved on time / total resolved
        $sla = $resolved > 0 ? round(($closedOnTime / $resolved) * 100, 2) : 0;

        return [
            'total'        => $total,
            'waiting'      => $waiting,
            'pending'      => $pending,
            'in_progress'  => $inProgress,
            'resolved'     => $resolved,
            'void'         => $void,
            'closedOnTime' => $closedOnTime,
            'closedLate'   => $closedLate,
            'sla'          => $sla,
        ];
    }

    public static function projectExportQuery(array $filters = [])
{
    $year   = isset($filters['year']) ? (int) $filters['year'] : (int) now()->year;
    $status = $filters['status'] ?? null;
    $q      = $filters['q'] ?? null;

    $query = self::query()
        ->from('project_headers as ph')
        ->leftJoin('users as req', 'req.id', '=', 'ph.requestor_id')
        ->select([
            'ph.id',
            'ph.project_code',
            'ph.project_name',
            'ph.status',
            'ph.priority',
            'ph.progress_percent',
            'ph.is_late',

            'ph.request_date',
            'ph.start_date',
            'ph.end_date',
            'ph.actual_start_date',
            'ph.actual_end_date',
            'ph.effective_end_date',

            'ph.total_pending_minutes',
            'ph.description',
            'ph.notes',

            DB::raw('COALESCE(req.name, "-") as requestor_name'),
        ])
        ->whereYear('ph.start_date', $year);

    if ($status && $status !== 'all') {
        $query->where('ph.status', $status);
    }

    if ($q) {
        $query->where(function (Builder $qb) use ($q) {
            $qb->where('ph.project_name', 'like', "%{$q}%")
               ->orWhere('ph.project_code', 'like', "%{$q}%");
        });
    }

    return $query->orderBy('ph.start_date', 'asc');
}

    // ==========================
    // SCOPES
    // ==========================
    public function scopeBetweenRequestDates($query, $start, $end)
    {
        if ($start && $end) {
            $start = date('Y-m-d 00:00:00', strtotime($start));
            $end   = date('Y-m-d 23:59:59', strtotime($end));
            return $query->whereBetween('request_date', [$start, $end]);
        }
        return $query;
    }

    public function scopeByStatus($query, $status)
    {
        // FIX: sebelumnya whereHas('status') padahal relasinya ga ada
        return $query->where('status', $status);
    }

    public function scopeWaiting($query)
    {
        return $query->byStatus(self::STATUS_WAITING);
    }

    public function scopePending($query)
    {
        return $query->byStatus(self::STATUS_PENDING);
    }

    public function scopeInProgress($query)
    {
        return $query->byStatus(self::STATUS_IN_PROGRESS);
    }

    public function scopeResolved($query)
    {
        return $query->byStatus(self::STATUS_RESOLVED);
    }

    public function scopeVoid($query)
    {
        return $query->byStatus(self::STATUS_VOID);
    }

    // ==========================
    // STATISTIK BY DATE RANGE
    // ==========================
    public static function statistik($start = null, $end = null)
    {
        $base = self::query()->betweenRequestDates($start, $end);

        $waitingCount    = (clone $base)->waiting()->count();
        $pendingCount    = (clone $base)->pending()->count();
        $inProgressCount = (clone $base)->inProgress()->count();
        $resolvedCount   = (clone $base)->resolved()->count();
        $voidCount       = (clone $base)->void()->count();

        return [
            'total'       => $waitingCount + $pendingCount + $inProgressCount + $resolvedCount + $voidCount,
            'waiting'     => $waitingCount,
            'pending'     => $pendingCount,
            'in_progress' => $inProgressCount,
            'resolved'    => $resolvedCount,
            'void'        => $voidCount,
        ];
    }

    // ==========================
    // SUMMARY BY YEAR
    // ==========================
    public static function summary($year = null)
    {
        $query = self::query();

        if ($year) {
            $query->whereYear('start_date', $year);
        }

        $waiting     = (clone $query)->waiting()->count();
        $pending     = (clone $query)->pending()->count();
        $inProgress  = (clone $query)->inProgress()->count();
        $resolved    = (clone $query)->resolved()->count();
        $void        = (clone $query)->void()->count();

        $total = (clone $query)->count();

        // Closed on time / late (hanya resolved)
        $closedOnTime = (clone $query)->resolved()->where('is_late', 0)->count();
        $closedLate   = (clone $query)->resolved()->where('is_late', 1)->count();

        // SLA (normal): resolved on time / total resolved
        $sla = $resolved > 0 ? round(($closedOnTime / $resolved) * 100, 2) : 0;

        return [
            'total'        => $total,
            'waiting'      => $waiting,
            'pending'      => $pending,
            'in_progress'  => $inProgress,
            'resolved'     => $resolved,
            'void'         => $void,
            'closedOnTime' => $closedOnTime,
            'closedLate'   => $closedLate,
            'sla'          => $sla,
        ];
    }


public static function projectGanttDetailReport(int $projectId)
{
    $project = self::query()
        ->with(['details:id,project_header_id,progress_date,description,status,progress_percent,developer_id'])
        ->select([
            'id',
            'project_code',
            'project_name',
            'status',
            'progress_percent',
            'start_date',
            'end_date',
        ])
        ->where('id', $projectId)
        ->firstOrFail();

    $headerProgress = (int) ($project->progress_percent ?? 0);
    $headerStatusLabel = self::humanStatus($project->status);

    $headerTask = [
        'id'       => "H-{$project->id}",
        'name'     => "{$project->project_name}  [ {$headerStatusLabel} - {$headerProgress}% ]",
        'start'    => optional($project->start_date)->format('Y-m-d'),
        'end'      => optional($project->end_date)->format('Y-m-d'),
        'progress' => $headerProgress,
        'status'   => $project->status,
        'type'     => 'header',
    ];

    $detailTasks = $project->details
        ->sortBy('progress_date')
        ->values()
        ->map(function ($d, $idx) use ($project) {
            $p = (int) ($d->progress_percent ?? 0);
            $date = optional($d->progress_date)->format('Y-m-d')
                ?? optional($project->start_date)->format('Y-m-d');

            return [
                'id'       => "D-{$d->id}",
                'name'     => $d->description ?? ("Progress #" . ($idx + 1)),
                'start'    => $date,
                'end'      => $date,
                'progress' => $p,
                'status'   => $d->status ?? null,
                'type'     => 'detail',
                'parent'   => "H-{$project->id}",
            ];
        });

    return [
        'project' => [
            'id'           => $project->id,
            'code'         => $project->project_code,
            'name'         => $project->project_name,
            'status'       => $project->status,
            'status_label' => $headerStatusLabel,
            'progress'     => $headerProgress,
            'start'        => optional($project->start_date)->format('Y-m-d'),
            'end'          => optional($project->end_date)->format('Y-m-d'),
        ],
        'tasks' => collect([$headerTask])->concat($detailTasks)->values(),
    ];
}

/**
 * Biar label status konsisten buat UI
 */
public static function humanStatus(?string $status): string
{
    $s = strtolower(trim((string) $status));

    return match ($s) {
        'waiting'     => 'Waiting',
        'pending'     => 'Pending',
        'in_progress' => 'In Progress',
        'void'        => 'Void',
        'resolved'    => 'Resolved',
        default       => $s !== '' ? ucfirst(str_replace('_', ' ', $s)) : '-',
    };
}

public static function developerProjectSummary(array $filters = [])
{
    $year   = isset($filters['year']) ? (int) $filters['year'] : (int) now()->year;
    $status = $filters['status'] ?? null; // status header (ph.status)
    $q      = $filters['q'] ?? null;      // search header (ph.project_code/name)

    $base = DB::table('project_details as pd')
        ->join('project_headers as ph', 'ph.id', '=', 'pd.project_header_id')
        ->leftJoin('users as dev', 'dev.id', '=', 'pd.developer_id')
        ->whereNotNull('pd.developer_id')
        ->whereYear('pd.progress_date', $year); // ✅ FIX: filter by detail activity date

    if ($status && $status !== 'all') {
        $base->where('ph.status', $status);
    }

    if ($q) {
        $base->where(function ($qb) use ($q) {
            $qb->where('ph.project_name', 'like', "%{$q}%")
               ->orWhere('ph.project_code', 'like', "%{$q}%");
        });
    }

    $rows = (clone $base)
        ->selectRaw('
            pd.developer_id as developer_id,
            COALESCE(dev.name, "Unknown") as developer_name,

            COUNT(pd.id) as total_tasks,
            COUNT(DISTINCT ph.id) as projects_count,

            ROUND(AVG(COALESCE(pd.progress_percent,0)), 2) as avg_progress_task,

            -- ✅ FIX: hitung project distinct biar gak ke-multiply oleh jumlah tasks
            COUNT(DISTINCT CASE WHEN ph.status = "resolved" THEN ph.id END) as resolved_touch_count,
            COUNT(DISTINCT CASE WHEN ph.status = "resolved" AND ph.is_late = 1 THEN ph.id END) as late_touch_count,
            COUNT(DISTINCT CASE WHEN ph.status IN ("waiting","pending","in_progress") THEN ph.id END) as open_touch_count
        ')
        ->groupBy('pd.developer_id', 'dev.name')
        ->orderByDesc('projects_count')
        ->get();

    return $rows->map(function ($r) {
        return [
            'developer_id' => (int) $r->developer_id,
            'developer_name' => $r->developer_name,
            'projects_count' => (int) $r->projects_count,
            'total_tasks' => (int) $r->total_tasks,
            'avg_progress_task' => (float) $r->avg_progress_task,
            'open_touch_count' => (int) $r->open_touch_count,
            'resolved_touch_count' => (int) $r->resolved_touch_count,
            'late_touch_count' => (int) $r->late_touch_count,
        ];
    })->values();
}



public static function developerProjectDetail(int $developerId, array $filters = [])
{
    $year    = isset($filters['year']) ? (int) $filters['year'] : (int) now()->year;
    $status  = $filters['status'] ?? null;
    $q       = $filters['q'] ?? null;
    $perPage = (int) ($filters['per_page'] ?? 50);

    // ✅ daftar project yang disentuh developer di tahun tsb (berdasarkan progress_date)
    $projQuery = DB::table('project_details as pd')
        ->join('project_headers as ph', 'ph.id', '=', 'pd.project_header_id')
        ->leftJoin('users as req', 'req.id', '=', 'ph.requestor_id')
        ->where('pd.developer_id', $developerId)
        ->whereYear('pd.progress_date', $year); // ✅ FIX

    if ($status && $status !== 'all') {
        $projQuery->where('ph.status', $status);
    }

    if ($q) {
        $projQuery->where(function ($qb) use ($q) {
            $qb->where('ph.project_name', 'like', "%{$q}%")
               ->orWhere('ph.project_code', 'like', "%{$q}%");
        });
    }

    $projects = $projQuery
        ->selectRaw('
            ph.id as project_id,
            ph.project_code,
            ph.project_name,
            ph.status,
            ph.priority,
            ph.progress_percent,
            ph.is_late,
            ph.start_date,
            ph.end_date,
            COALESCE(req.name, "-") as requestor_name,

            COUNT(pd.id) as tasks_count,
            ROUND(AVG(COALESCE(pd.progress_percent,0)), 2) as avg_task_progress,
            MAX(pd.progress_date) as last_progress_date
        ')
        ->groupBy(
            'ph.id',
            'ph.project_code',
            'ph.project_name',
            'ph.status',
            'ph.priority',
            'ph.progress_percent',
            'ph.is_late',
            'ph.start_date',
            'ph.end_date',
            'req.name'
        )
        ->orderByDesc('last_progress_date')
        ->paginate($perPage);

    $projectIds = collect($projects->items())->pluck('project_id')->values();

    // ✅ FIX: tasks yang di-embed juga harus ikut year filter (biar nggak nyampur tahun lain)
    $tasks = DB::table('project_details as pd')
        ->where('pd.developer_id', $developerId)
        ->whereIn('pd.project_header_id', $projectIds)
        ->whereYear('pd.progress_date', $year) // ✅ FIX
        ->select([
            'pd.id',
            'pd.project_header_id as project_id',
            'pd.progress_date',
            'pd.description',
            'pd.status',
            'pd.progress_percent',
        ])
        ->orderBy('pd.project_header_id')
        ->orderBy('pd.progress_date')
        ->get()
        ->groupBy('project_id');

    $items = collect($projects->items())->map(function ($p) use ($tasks) {
        $list = $tasks->get($p->project_id, collect());

        return [
            'project_id' => (int) $p->project_id,
            'project_code' => $p->project_code,
            'project_name' => $p->project_name,
            'status' => $p->status,
            'priority' => $p->priority,
            'progress_percent' => (int) ($p->progress_percent ?? 0),
            'is_late' => (int) ($p->is_late ?? 0),

            'start_date' => $p->start_date ? date('Y-m-d', strtotime($p->start_date)) : null,
            'end_date'   => $p->end_date ? date('Y-m-d', strtotime($p->end_date)) : null,
            'requestor_name' => $p->requestor_name,

            'tasks_count' => (int) $p->tasks_count,
            'avg_task_progress' => (float) $p->avg_task_progress,
            'last_progress_date' => $p->last_progress_date ? date('Y-m-d', strtotime($p->last_progress_date)) : null,

            'tasks' => $list->map(function ($t) {
                return [
                    'id' => (int) $t->id,
                    'progress_date' => $t->progress_date ? date('Y-m-d', strtotime($t->progress_date)) : null,
                    'description' => $t->description,
                    'status' => $t->status,
                    'progress_percent' => (int) ($t->progress_percent ?? 0),
                ];
            })->values(),
        ];
    });

    return [
        'pagination' => [
            'current_page' => $projects->currentPage(),
            'per_page' => $projects->perPage(),
            'total' => $projects->total(),
            'last_page' => $projects->lastPage(),
        ],
        'rows' => $items->values(),
    ];
}

public static function projectGanttReport(array $filters = [])
{
    $start  = $filters['start_date'] ?? (now()->year . "-01-01");
    $end    = $filters['end_date']   ?? (now()->year . "-12-31");
    $status = $filters['status'] ?? null;
    $q      = $filters['q'] ?? null;

    $query = self::query()
        ->select([
            'project_headers.id',
            'project_headers.project_code',
            'project_headers.project_name',
            'project_headers.status',
            'project_headers.progress_percent',
            'project_headers.is_late',
            'project_headers.start_date',
            'project_headers.end_date',
            'project_headers.actual_start_date',
            'project_headers.actual_end_date',
            'project_headers.effective_end_date',
        ])
        // ✅ OVERLAP RANGE (INTI GANTT)
        ->whereNotNull('project_headers.start_date')
        ->whereNotNull('project_headers.end_date')
        ->whereDate('project_headers.start_date', '<=', $end)
        ->whereDate('project_headers.end_date', '>=', $start);

    if ($status && $status !== 'all') {
        $query->where('project_headers.status', $status);
    }

    if ($q) {
        $query->where(function ($qq) use ($q) {
            $qq->where('project_headers.project_code', 'like', "%{$q}%")
               ->orWhere('project_headers.project_name', 'like', "%{$q}%");
        });
    }

    $rows = $query->orderBy('project_headers.start_date')->get();

    return $rows->map(function ($p) {
        // ✅ start = actual_start kalau ada, fallback start_date
        $start = $p->actual_start_date ?: $p->start_date;

        // ✅ end = effective_end kalau ada, fallback actual_end, fallback end_date
        $end = $p->effective_end_date ?: ($p->actual_end_date ?: $p->end_date);

        $startFmt = $start ? date('Y-m-d', strtotime($start)) : null;
        $endFmt   = $end ? date('Y-m-d', strtotime($end)) : null;

        // ✅ safety: kalau end < start, swap biar gantt gak error
        if ($startFmt && $endFmt && $endFmt < $startFmt) {
            [$startFmt, $endFmt] = [$endFmt, $startFmt];
        }

        return [
            'id'       => (int) $p->id,
            'code'     => $p->project_code,
            'name'     => $p->project_name,
            'label'    => trim(($p->project_code ?: '-') . ' — ' . ($p->project_name ?: '-')),
            'start'    => $startFmt,
            'end'      => $endFmt,
            'progress' => (int) ($p->progress_percent ?? 0),
            'status'   => $p->status,
            'is_late'  => (int) ($p->is_late ?? 0),
        ];
    })->values();
}

public static function projectGanttSummary(array $filters = [])
{
    $start = $filters['start_date'] ?? (now()->year . "-01-01");
    $end   = $filters['end_date']   ?? (now()->year . "-12-31");

    $base = self::query()
        ->whereNotNull('start_date')
        ->whereNotNull('end_date')
        ->whereDate('start_date', '<=', $end)
        ->whereDate('end_date', '>=', $start);

    $total = (clone $base)->count();

    $counts = (clone $base)
        ->selectRaw('status, COUNT(*) as c')
        ->groupBy('status')
        ->pluck('c', 'status');

    // resolved breakdown by is_late
    $closedOnTime = (clone $base)
        ->where('status', 'resolved')
        ->where('is_late', 0)
        ->count();

    $closedLate = (clone $base)
        ->where('status', 'resolved')
        ->where('is_late', 1)
        ->count();

    $resolved = $closedOnTime + $closedLate;

    // ✅ SLA: hanya ontime yang jadi pembilang, late bikin turun
    $sla = $resolved > 0 ? round(($closedOnTime / $resolved) * 100, 2) : 0;

    return [
        'total'       => (int) $total,
        'waiting'     => (int) ($counts['waiting'] ?? 0),
        'pending'     => (int) ($counts['pending'] ?? 0),
        'in_progress' => (int) ($counts['in_progress'] ?? 0),
        'resolved'    => (int) $resolved,
        'void'        => (int) ($counts['void'] ?? 0),

        'closedOnTime' => (int) $closedOnTime,
        'closedLate'   => (int) $closedLate,
        'sla'          => (float) $sla,
    ];
}



}
