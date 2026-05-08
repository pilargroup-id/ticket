<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Project\ProjectStoreRequest;

use App\Http\Resources\Project\ProjectResource;
use App\Models\ProjectHeaders;
use App\Models\ProjectDetails;
use App\Models\Pendings;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProjectController extends Controller
{
    private function tz(): string
    {
        return config('app.timezone', 'Asia/Jakarta');
    }

    private function normalizeStatus($s): string
    {
        $key = strtolower(trim((string)($s ?? '')));
        $list = ['waiting', 'in_progress', 'pending', 'unhold', 'resolved', 'void'];
        return in_array($key, $list, true) ? $key : 'waiting';
    }

    private function parseInputDate($value): ?Carbon
    {
        if (!$value) return null;

        $tz = $this->tz();
        $s = trim((string) $value);

        if (str_ends_with($s, 'Z') || preg_match('/[+\-]\d{2}:\d{2}$/', $s)) {
            return Carbon::parse($s)->timezone($tz);
        }

        // datetime-local dari FE: "Y-m-d\TH:i"
        if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/', $s)) {
            return Carbon::parse($s, $tz);
        }

        // fallback laravel format
        return Carbon::createFromFormat('Y-m-d H:i:s', $s, $tz);
    }

    private function lastDeveloperId(ProjectHeaders $project): ?int
    {
        return $project->details()->latest('id')->value('developer_id');
    }

    private function computeEffectiveEnd(ProjectHeaders $project, bool $includePending): ?Carbon
    {
        if (empty($project->end_date)) return null;

        $end = Carbon::parse($project->end_date)->timezone($this->tz());
        if (!$includePending) return $end;

        $pendingMinutes = (int)($project->total_pending_minutes ?? 0);
        if ($pendingMinutes > 0) $end = $end->copy()->addMinutes($pendingMinutes);

        return $end;
    }

    private function isLate(ProjectHeaders $project): bool
    {
        if (empty($project->actual_end_date)) return false;

        $tz = $this->tz();
        $actualEnd = Carbon::parse($project->actual_end_date)->timezone($tz);

        $effective = $project->effective_end_date
            ? Carbon::parse($project->effective_end_date)->timezone($tz)
            : null;

        if (!$effective && !empty($project->end_date)) {
            $effective = Carbon::parse($project->end_date)->timezone($tz);
        }

        if (!$effective) return false;

        return $actualEnd->gt($effective);
    }

    private function responseProject(ProjectHeaders $project, string $message, int $code = 200)
    {
        return response()->json([
            'message' => $message,
            'data' => new ProjectResource(
                $project->fresh()->load(['details.developer', 'requestor', 'pendings'])
            ),
        ], $code);
    }

  public function index(Request $request)
{
    $startDate = $request->query('start_date');
    $endDate   = $request->query('end_date');

    $q = ProjectHeaders::with(['details.developer', 'requestor', 'pendings'])
        ->orderByDesc('id');

    // ✅ Kalau dua-duanya ada → filter range
    if ($startDate && $endDate) {
        $q->whereBetween('request_date', [$startDate, $endDate]);
    }

    // ✅ Kalau salah satu doang ada → anggap invalid (opsional, biar gak ambigu)
    if (($startDate && !$endDate) || (!$startDate && $endDate)) {
        return response()->json([
            'message' => 'Kalau mau filter tanggal, kirim start_date dan end_date sekaligus.'
        ], 422);
    }

    $projects = $q->get();

    return response()->json([
        'message' => 'Projects retrieved successfully',
        'data'    => ProjectResource::collection($projects),
    ], 200);
}


    public function history(Request $request, $id)
    {
        $project = ProjectHeaders::with(['details.developer', 'requestor', 'pendings'])
            ->findOrFail($id);

        // ambil details jadi history
        $history = $project->details
            ->sortBy('progress_date')
            ->values()
            ->map(function ($d) {
                return [
                    'id' => $d->id,
                    'type' => $d->status, // dipakai chip/label di FE
                    'progress_date' => $d->progress_date,
                    'created_at' => $d->created_at,
                    'updated_at' => $d->updated_at,
                    'progress_percent' => $d->progress_percent ?? null,
                    'description' => $d->description ?? $d->notes ?? null,
                    'pending_minutes' => $d->pending_minutes ?? null,

                    // buat "by"
                    'by_name' => optional($d->developer)->name,
                    'developer_id' => $d->developer_id,
                ];
            });

        return response()->json([
            'message' => 'Project history retrieved successfully',
            'history' => $history, // ✅ FE modal lu bisa pakai data.history
        ], 200);
    }

    public function store(ProjectStoreRequest $request)
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data) {
            $project = ProjectHeaders::create(array_merge($data, [
                'status' => $this->normalizeStatus($data['status'] ?? 'waiting'),
                'progress_percent' => $data['progress_percent'] ?? 0,
            ]));

            $code = 'PRJ-' . str_pad((string)$project->id, 3, '0', STR_PAD_LEFT);
            $project->update(['project_code' => $code]);

            return response()->json([
                'message' => 'Project created successfully',
                'data'    => new ProjectResource($project->fresh()->load(['details.developer', 'requestor', 'pendings'])),
            ], 201);
        });
    }

    public function start(Request $request, $id)
    {
        $project = ProjectHeaders::findOrFail($id);

        $data = $request->validate([
            'developer_id'     => ['required', 'integer', 'exists:users,id'],
            'progress_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'progress_date'    => ['nullable'],
            'description'      => ['nullable', 'string'],
        ]);

        $tz = $this->tz();

        return DB::transaction(function () use ($project, $data, $tz) {
            if (empty($project->actual_start_date)) {
                $project->actual_start_date = now($tz);
            }

            $project->status = 'in_progress';

            if (array_key_exists('progress_percent', $data) && $data['progress_percent'] !== null) {
                $project->progress_percent = $data['progress_percent'];
            }

            $project->progress_date = $this->parseInputDate($data['progress_date'] ?? now($tz)) ?? now($tz);
            $project->save();

            ProjectDetails::create([
                'project_header_id' => $project->id,
                'progress_date'     => $project->progress_date,
                'description'       => $data['description'] ?? null,
                'status'            => 'in_progress',
                'progress_percent'  => $project->progress_percent ?? 0,
                'developer_id'      => (int)$data['developer_id'],
            ]);

            return $this->responseProject($project, 'Project started successfully');
        });
    }

    public function progress(Request $request, $id)
    {
        $project = ProjectHeaders::findOrFail($id);

        $data = $request->validate([
            'developer_id'     => ['required', 'integer', 'exists:users,id'],
            'progress_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'progress_date'    => ['nullable'],
            'description'      => ['nullable', 'string'],
        ]);

        $tz = $this->tz();

        return DB::transaction(function () use ($project, $data, $tz) {
            $project->status = 'in_progress';
            $project->progress_percent = $data['progress_percent'];
            $project->progress_date = $this->parseInputDate($data['progress_date'] ?? now($tz)) ?? now($tz);
            $project->save();

            ProjectDetails::create([
                'project_header_id' => $project->id,
                'progress_date'     => $project->progress_date,
                'description'       => $data['description'] ?? null,
                'status'            => 'in_progress',
                'progress_percent'  => $project->progress_percent,
                'developer_id'      => (int)$data['developer_id'],
            ]);

            return $this->responseProject($project, 'Project progress updated successfully');
        });
    }

    public function hold(Request $request, $id)
    {
        $project = ProjectHeaders::findOrFail($id);

        $data = $request->validate([
            'reason'       => ['required', 'string'],
            'description'  => ['nullable', 'string'],
        ]);

        $tz = $this->tz();

        return DB::transaction(function () use ($project, $data, $tz) {
            $holdStart = now($tz);

            Pendings::create([
                'project_header_id' => $project->id,
                'hold_start'        => $holdStart,
                'hold_end'          => null,
                'reason'            => $data['reason'],
                'duration_minutes'  => null,
            ]);

            $project->status = 'pending';
            $project->save();

            $devId = $this->lastDeveloperId($project);

            ProjectDetails::create([
                'project_header_id' => $project->id,
                'progress_date'     => $holdStart,
                'description'       => $data['description'] ?? $data['reason'],
                'status'            => 'pending',
                'progress_percent'  => $project->progress_percent ?? 0,
                'developer_id'      => $devId,
            ]);

            return $this->responseProject($project, 'Project put on hold successfully');
        });
    }

    public function unhold(Request $request, $id)
    {
        $project = ProjectHeaders::findOrFail($id);

        $data = $request->validate([
            'include_pending_minutes' => ['nullable', 'boolean'],
            'developer_id'            => ['nullable', 'integer', 'exists:users,id'],
            'description'             => ['nullable', 'string'],
        ]);

        $tz = $this->tz();

        return DB::transaction(function () use ($project, $data, $tz) {
            $include = (bool)($data['include_pending_minutes'] ?? false);

            $pending = Pendings::where('project_header_id', $project->id)
                ->whereNull('hold_end')
                ->latest('id')
                ->lockForUpdate()
                ->first();

            $now = now($tz);
            $mins = 0;

            if ($pending) {
                $pending->hold_end = $now;
                $mins = (int)ceil(Carbon::parse($pending->hold_start)->diffInSeconds($now) / 60);
                if ($mins < 1) $mins = 1;

                $pending->duration_minutes = $mins;
                $pending->save();

                if ($include) {
                    $project->total_pending_minutes = (int)($project->total_pending_minutes ?? 0) + $mins;
                }
            }

            $project->status = 'in_progress';
            $project->effective_end_date = $this->computeEffectiveEnd($project, $include);
            $project->save();

            $devId = !empty($data['developer_id'])
                ? (int)$data['developer_id']
                : $this->lastDeveloperId($project);

            ProjectDetails::create([
                'project_header_id' => $project->id,
                'progress_date'     => $now,
                'description'       => $data['description'] ?? null,
                'status'            => 'in_progress',
                'progress_percent'  => $project->progress_percent ?? 0,
                'developer_id'      => $devId,
            ]);

            return $this->responseProject($project, 'Project continued successfully');
        });
    }

    public function void(Request $request, $id)
    {
        $project = ProjectHeaders::findOrFail($id);

        $data = $request->validate([
            'notes'       => ['required', 'string'],
            'description' => ['nullable', 'string'],
        ]);

        $tz = $this->tz();

        return DB::transaction(function () use ($project, $data, $tz) {
            $project->status = 'void';
            $project->notes  = $data['notes'];
            $project->save();

            $devId = $this->lastDeveloperId($project);

            ProjectDetails::create([
                'project_header_id' => $project->id,
                'progress_date'     => now($tz),
                'description'       => $data['description'] ?? $data['notes'],
                'status'            => 'void',
                'progress_percent'  => $project->progress_percent ?? 0,
                'developer_id'      => $devId,
            ]);

            return $this->responseProject($project, 'Project voided successfully');
        });
    }

    public function resolve(Request $request, $id)
    {
        $project = ProjectHeaders::findOrFail($id);

        $data = $request->validate([
            'actual_end_date'          => ['nullable'],
            'include_pending_minutes'  => ['nullable', 'boolean'],
            'description'              => ['nullable', 'string'],
        ]);

        $tz = $this->tz();

        return DB::transaction(function () use ($project, $data, $tz) {
            $include = (bool)($data['include_pending_minutes'] ?? false);

            if (empty($project->actual_start_date)) {
                $project->actual_start_date = now($tz);
            }

            $actualEnd = $this->parseInputDate($data['actual_end_date'] ?? now($tz)) ?? now($tz);

            $project->actual_end_date = $actualEnd;
            $project->status = 'resolved';
            $project->progress_percent = 100;
            $project->progress_date = $actualEnd;

            $project->effective_end_date = $this->computeEffectiveEnd($project, $include);
            $project->is_late = $this->isLate($project);

            $project->save();

            $devId = $this->lastDeveloperId($project);

            ProjectDetails::create([
                'project_header_id' => $project->id,
                'progress_date'     => $actualEnd,
                'description'       => $data['description'] ?? null,
                'status'            => 'resolved',
                'progress_percent'  => 100,
                'developer_id'      => $devId,
            ]);

            return $this->responseProject($project, 'Project resolved successfully');
        });
    }

    public function update(Request $request, $id)
    {
        $project = ProjectHeaders::findOrFail($id);

        $status = $request->input('status');
        if (!$status) return response()->json(['message' => 'status is required'], 422);

        $status = $this->normalizeStatus($status);
        $current = $this->normalizeStatus($project->status);

        // waiting (reset header status doang)
        if ($status === 'waiting') {
            $project->update(['status' => 'waiting']);
            return $this->responseProject($project, 'Project updated to waiting');
        }

        if ($status === 'pending') {
            return $this->hold($request, $id);
        }

        if ($status === 'unhold') {
            return $this->unhold($request, $id);
        }

        if ($status === 'void') {
            return $this->void($request, $id);
        }

        if ($status === 'resolved') {
            return $this->resolve($request, $id);
        }

        if ($status === 'in_progress') {
            // auto route
            if ($current === 'waiting') return $this->start($request, $id);
            return $this->progress($request, $id);
        }

        return response()->json(['message' => 'status invalid'], 422);
    }
}
