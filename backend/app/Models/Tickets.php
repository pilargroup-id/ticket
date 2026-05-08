<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Tickets extends Model
{
    protected $fillable = [
        'ticket_code',
        'user_id',
        'support_id',
        'category_id',
        'assets_id',
        'nama_pembuat',
        'status',
        'priority',
        'problem',
        'image',
        'solution',
        'notes',
        'request_date',
        'waiting_hour',
        'start_date',
        'end_date',
        'time_spent',
        'is_late',
        'updated_at',
        'created_at',
    ];

    protected $casts = [
        'request_date' => 'datetime',
        'start_date'   => 'datetime',
        'end_date'     => 'datetime',
        'waiting_hour' => 'integer',
        'time_spent'   => 'integer',
        'is_late'      => 'boolean',
    ];

    // ==================== RELATIONSHIPS ====================
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function support()
    {
        return $this->belongsTo(User::class, 'support_id');
    }

    public function category()
    {
        return $this->belongsTo(Categories::class, 'category_id');
    }

    public function assets()
    {
        return $this->belongsTo(Assets::class, 'assets_id');
    }

    public function feedback()
    {
        return $this->hasOne(Feedbacks::class, 'ticket_id');
    }

    // ==================== SCOPES (FILTER HELPERS) ====================

    public function scopeBetweenRequestDates($query, $start = null, $end = null)
    {
        if ($start && $end) {
            return $query->whereBetween('request_date', [
                Carbon::parse($start)->startOfDay(),
                Carbon::parse($end)->endOfDay(),
            ]);
        }
        return $query;
    }

    public function scopeThisMonth($query)
    {
        return $query->whereBetween('request_date', [
            Carbon::now()->startOfMonth(),
            Carbon::now()->endOfMonth()
        ]);
    }

    public function scopeByStatus($q, $status)
    {
        if (!$status || $status === 'all') return $q;
        return $q->where('status', $status);
    }

    // ==================== STATIC FUNCTIONS (BUSINESS LOGIC) ====================

    public static function generateTicketCode()
    {
        $lastTicket = DB::table('tickets')
            ->orderBy('id', 'DESC')
            ->first();

        if ($lastTicket) {
            $lastNumber = (int) substr($lastTicket->ticket_code, 4);
            $newNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '001';
        }

        return "TCK-{$newNumber}";
    }

    public static function statusCountUser($userId = null, $start = null, $end = null)
    {
        $query = DB::table('tickets')->where('user_id', $userId);

        if ($start && $end) {
            $query->whereBetween('request_date', [
                Carbon::parse($start)->startOfDay(),
                Carbon::parse($end)->endOfDay(),
            ]);
        }

        $results = [
            'waiting'     => (clone $query)->where('status', 'waiting')->count(),
            'in_progress' => (clone $query)->where('status', 'in_progress')->count(),
            'resolved'    => (clone $query)->where('status', 'resolved')->count(),
            'void'        => (clone $query)->where('status', 'void')->count(),
            'feedback'    => (clone $query)->where('status', 'feedback')->count(),
        ];

        return $results;
    }

    public static function statusCount($start = null, $end = null)
    {
        $query = DB::table('tickets');

        if ($start && $end) {
            $query->whereBetween('request_date', [
                Carbon::parse($start)->startOfDay(),
                Carbon::parse($end)->endOfDay(),
            ]);
        }

        $results = [
            'total'       => (clone $query)->count(),
            'waiting'     => (clone $query)->where('status', 'waiting')->count(),
            'in_progress' => (clone $query)->where('status', 'in_progress')->count(),
            'resolved'    => (clone $query)->where('status', 'resolved')->count(),
            'void'        => (clone $query)->where('status', 'void')->count(),
            'feedback'    => (clone $query)->where('status', 'feedback')->count(),
        ];

        return $results;
    }

    public static function slaReport($start = null, $end = null)
{
    $query = DB::table('tickets')
        ->whereIn('status', ['resolved', 'feedback']);

    if ($start && $end) {
        $query->whereBetween('created_at', [
            Carbon::parse($start)->startOfDay(),
            Carbon::parse($end)->endOfDay(),
        ]);
    }

    $totalResolved = (clone $query)->count();
    $resolvedInSLA = (clone $query)->where('time_spent', '<=', 480)->count();

    $slaPercent = $totalResolved > 0
        ? round(($resolvedInSLA / $totalResolved) * 100, 2)
        : 0;

    return [
        'resolved'        => $totalResolved,
        'resolved_in_sla' => $resolvedInSLA,
        'sla_percent'     => $slaPercent,
    ];
}


    public static function countPerMonthByYear(int $year)
    {
        return DB::table('tickets')
            ->select(
                DB::raw('MONTH(request_date) as month'),
                DB::raw('COUNT(*) as total_tickets')
            )
            ->whereYear('request_date', $year)
            ->groupBy(DB::raw('MONTH(request_date)'))
            ->orderBy(DB::raw('MONTH(request_date)'))
            ->pluck('total_tickets', 'month');
    }

    public static function countByCategory($start = null, $end = null)
    {
        $query = DB::table('tickets as t')
            ->join('categories as c', 't.category_id', '=', 'c.id')
            ->select('c.name as category', DB::raw('COUNT(t.id) as total'));

        if ($start && $end) {
            $query->whereBetween('t.request_date', [
                Carbon::parse($start)->startOfDay(),
                Carbon::parse($end)->endOfDay()
            ]);
        }

        return $query
            ->groupBy('c.name')
            ->pluck('total', 'category');
    }

    public static function reportBySupport($start = null, $end = null)
    {
        $query = DB::table('tickets as t')
            ->join('users as u', 't.support_id', '=', 'u.id')
            ->select('t.*', 'u.name as support_name', 'u.id as support_id')
            ->whereNotNull('t.support_id');

        if ($start && $end) {
            $query->whereBetween('t.request_date', [
                Carbon::parse($start)->startOfDay(),
                Carbon::parse($end)->endOfDay(),
            ]);
        }

        return $query->get()->groupBy('support_id');
    }

    public static function countByDeveloperPerMonth(int $year)
    {
        $results = DB::table('tickets as t')
            ->join('users as u', 't.support_id', '=', 'u.id')
            ->select(
                'u.id as developer_id',
                'u.name as developer_name',
                DB::raw('MONTH(t.request_date) as month'),
                DB::raw('COUNT(t.id) as total_tickets')
            )
            ->whereYear('t.request_date', $year)
            ->where('t.status', 'resolved')
            ->whereNotNull('t.support_id')
            ->groupBy('u.id', 'u.name', DB::raw('MONTH(t.request_date)'))
            ->orderBy('u.name')
            ->orderBy(DB::raw('MONTH(t.request_date)'))
            ->get();

        $developers = [];
        foreach ($results as $row) {
            $devKey = $row->developer_id;

            if (!isset($developers[$devKey])) {
                $developers[$devKey] = [
                    'developer_id'   => $row->developer_id,
                    'developer_name' => $row->developer_name,
                    'monthly_data'   => array_fill(1, 12, 0)
                ];
            }

            $developers[$devKey]['monthly_data'][$row->month] = $row->total_tickets;
        }

        return array_values($developers);
    }

    public static function timeSpentByDeveloper(int $year)
    {
        return DB::table('tickets as t')
            ->join('users as u', 't.support_id', '=', 'u.id')
            ->select(
                'u.id as developer_id',
                'u.name as developer_name',
                DB::raw('SUM(t.time_spent) as total_time_spent'),
                DB::raw('COUNT(t.id) as total_tickets'),
                DB::raw('ROUND(AVG(t.time_spent), 2) as avg_time_spent')
            )
            ->whereYear('t.request_date', $year)
            ->where('t.status', 'resolved')
            ->whereNotNull('t.support_id')
            ->whereNotNull('t.time_spent')
            ->groupBy('u.id', 'u.name')
            ->orderBy('total_time_spent', 'DESC')
            ->get();
    }

    public function scopeMyTicket($query)
    {
        $userId = auth()->id();

        return $query
            ->with(['category', 'user', 'support', 'assets'])
            ->where('user_id', $userId)
            ->orderByRaw("
                CASE
                    WHEN status = 'resolved' THEN 1
                    WHEN status IN ('waiting', 'in_progress') THEN 2
                    ELSE 3
                END
            ")
            ->orderByDesc('request_date');
    }
}
