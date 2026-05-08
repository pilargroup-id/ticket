<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class ProjectDetails extends Model
{
    public $timestamps = true;
    protected $table = 'project_details';

    protected $fillable = [
        'project_header_id',
        'progress_date',
        'description',
        'status',
        'progress_percent',
        'developer_id',
    ];

    public function projectHeader() {
        return $this->belongsTo(ProjectHeaders::class, 'project_header_id');
    }

    public function developer() {
        return $this->belongsTo(User::class, 'developer_id');
    }

    /**
     * ✅ Export/Preview query: row = detail/task
     * Filters:
     * - year by progress_date
     * - status by header.status (biar konsisten sama page lu)
     * - q search: project_code / project_name / requestor / developer / detail description
     */
    public static function projectDetailsExportQuery(array $filters = [])
    {
        $year   = (int) ($filters['year'] ?? now()->year);
        $status = $filters['status'] ?? null;
        $q      = trim((string)($filters['q'] ?? ''));

        $query = DB::table('project_details as d')
            ->join('project_headers as h', 'd.project_header_id', '=', 'h.id')
            ->leftJoin('users as req', 'h.requestor_id', '=', 'req.id')
            ->leftJoin('users as dev', 'd.developer_id', '=', 'dev.id')
            ->select([
                'd.id as detail_id',
                'd.project_header_id',
                'd.progress_date',
                'd.description as detail_description',
                'd.status as detail_status',
                'd.progress_percent as detail_progress_percent',

                'h.project_code',
                'h.project_name',
                'h.status as header_status',
                'h.priority',
                'h.request_date',
                'h.start_date',
                'h.end_date',
                'h.is_late',

                DB::raw('COALESCE(req.name, "-") as requestor_name'),
                DB::raw('COALESCE(dev.name, "-") as developer_name'),
            ])
            ->whereYear('d.progress_date', $year)
            ->orderByDesc('d.progress_date')
            ->orderByDesc('d.id');

        // filter status header
        if ($status && $status !== 'all') {
            $query->where('h.status', $status);
        }

        // search
        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $w->where('h.project_code', 'like', "%{$q}%")
                  ->orWhere('h.project_name', 'like', "%{$q}%")
                  ->orWhere('req.name', 'like', "%{$q}%")
                  ->orWhere('dev.name', 'like', "%{$q}%")
                  ->orWhere('d.description', 'like', "%{$q}%")
                  ->orWhere('d.status', 'like', "%{$q}%");
            });
        }

        return $query;
    }
}
