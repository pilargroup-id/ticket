<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\TicketStoreByAdminRequest;
use App\Http\Requests\Ticket\TicketStoreByUserRequest;
use App\Http\Requests\Ticket\TicketUpdateByAdminRequest;
use App\Http\Requests\Ticket\TicketUpdateByUserRequest;
use App\Http\Resources\TicketResource;
use App\Models\Tickets;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TicketController extends Controller
{
    private function tz(): string
    {
        return config('app.timezone', 'Asia/Jakarta');
    }

    private function parseInputDate($value): ?Carbon
    {
        if (!$value) return null;

        $tz = $this->tz();
        $s = trim((string) $value);

        if (str_ends_with($s, 'Z') || preg_match('/[+\-]\d{2}:\d{2}$/', $s)) {
            return Carbon::parse($s)->timezone($tz);
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/', $s)) {
            return Carbon::createFromFormat('Y-m-d\TH:i', substr($s, 0, 16), $tz);
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/', $s)) {
            return Carbon::createFromFormat('Y-m-d H:i:s', $s, $tz);
        }

        return Carbon::parse($s, $tz);
    }

    private function calcWaitingHour($requestDate, $startDate): ?int
    {
        if (!$requestDate || !$startDate) return null;

        $tz = $this->tz();

        $req = $requestDate instanceof Carbon
            ? $requestDate->copy()->timezone($tz)
            : Carbon::parse((string)$requestDate)->timezone($tz);

        $st = $startDate instanceof Carbon
            ? $startDate->copy()->timezone($tz)
            : Carbon::parse((string)$startDate)->timezone($tz);

        // kalau kebalik (gara2 timezone / input)
        if ($st->lt($req)) {
            [$req, $st] = [$st, $req];
        }

        // ✅ MENIT (bukan jam)
        return max(0, $req->diffInMinutes($st));
    }


    private function calcMinutes(Carbon $start, Carbon $end): int
    {
        $sec = $start->diffInSeconds($end);
        $mins = (int) ceil($sec / 60);
        return max(1, $mins);
    }

    private function buildTicketQuery(Request $request, bool $onlyMine = false)
{
    $status = $request->query('status');
    $start  = $request->query('start_date');
    $end    = $request->query('end_date');

    $perPage = (int) $request->query('per_page', 20);
    $perPage = max(1, min($perPage, 200));

    $with = [
        'user:id,name',
        'support:id,name',
        'category:id,name',
    ];

    if ($request->boolean('include_assets')) {
        $with[] = 'assets:id,assets_name';
    }

    $q = Tickets::query()
        ->select([
            'id',
            'ticket_code',
            'user_id',
            'support_id',     // ✅ wajib biar support relasi kebaca
            'category_id',
            'assets_id',

            'nama_pembuat',
            'problem',
            'status',
            'priority',

            'solution',       // ✅ FIX: sebelumnya ga ke-select
            'image',          // ✅ FIX: biar image_url ga null

            'notes',
            'request_date',
            'waiting_hour',
            'start_date',
            'end_date',
            'time_spent',
            'is_late',

            'created_at',
            'updated_at',     // ✅ FIX: biar updated_at ga null
        ])
        ->with($with);

    if ($onlyMine) {
        $q->where('user_id', auth()->id());
    }

    $q->when($start && $end, fn($qq) => $qq->betweenRequestDates($start, $end))
      ->when($status && $status !== 'all', fn($qq) => $qq->byStatus($status))
      ->latest();

    return [$q, $perPage];
}


    public function index(Request $request)
    {
        [$q, $perPage] = $this->buildTicketQuery($request);
        $tickets = $q->paginate($perPage);

        return response()->json([
            'message' => 'Tickets fetched successfully',
            'data'    => TicketResource::collection($tickets),
            'meta'    => [
                'current_page' => $tickets->currentPage(),
                'per_page'     => $tickets->perPage(),
                'total'        => $tickets->total(),
                'last_page'    => $tickets->lastPage(),
            ],
        ], 200);
    }

    public function indexUser(Request $request)
    {
        [$q, $perPage] = $this->buildTicketQuery($request, true);

        $q->orderByRaw("
            CASE
                WHEN status = 'resolved' THEN 1
                WHEN status IN ('in_progress', 'waiting') THEN 2
                WHEN status IN ('feedback', 'void') THEN 3
                ELSE 4
            END
        ")->orderBy('created_at', 'desc');

        $tickets = $q->paginate($perPage);

        return response()->json([
            'message' => 'Tickets fetched successfully',
            'data'    => TicketResource::collection($tickets),
            'meta'    => [
                'current_page' => $tickets->currentPage(),
                'per_page'     => $tickets->perPage(),
                'total'        => $tickets->total(),
                'last_page'    => $tickets->lastPage(),
            ],
        ], 200);
    }

    public function storeByAdmin(TicketStoreByAdminRequest $request)
    {
        $tz = $this->tz();

        $dataTicket = $request->validated();
        $dataTicket['created_by'] = 'admin';
        $dataTicket['request_date'] = $dataTicket['request_date'] ?? now($tz);

        do {
            $lastTicket = Tickets::latest('id')->first();
            $nextNumber = $lastTicket ? $lastTicket->id + 1 : 1;
            $ticketCode = 'TCK-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
        } while (Tickets::where('ticket_code', $ticketCode)->exists());

        $dataTicket['ticket_code'] = $ticketCode;

        if ($request->hasFile('image')) {
            $dataTicket['image'] = $request->file('image')->store('tickets', 'public');
        }

        $ticket = Tickets::create($dataTicket);

        return response()->json([
            'message' => 'Ticket created successfully by admin',
            'data'    => new TicketResource($ticket->load(['user', 'support', 'category', 'assets'])),
        ], 201);
    }

    public function storeByUser(TicketStoreByUserRequest $request)
    {
        $tz = $this->tz();
        $userId = auth()->id();

        $hasPendingFeedback = Tickets::where('user_id', $userId)
            ->where('status', 'resolved')
            ->exists();

        if ($hasPendingFeedback) {
            return response()->json([
                'message' => 'Silakan berikan feedback terlebih dahulu pada ticket yang sudah selesai.'
            ], 403);
        }

        $dataTicket = $request->validated();
        $dataTicket['created_by'] = 'user';
        $dataTicket['user_id'] = $userId;
        $dataTicket['request_date'] = $dataTicket['request_date'] ?? now($tz);

        $lastTicket = Tickets::latest('id')->first();
        $nextNumber = $lastTicket ? $lastTicket->id + 1 : 1;
        $dataTicket['ticket_code'] = 'TCK-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

        if ($request->hasFile('image')) {
    $file = $request->file('image');

    // ✅ kalau upload gagal, jangan lanjut store()
    if (!$file || !$file->isValid()) {
        return response()->json([
            'message' => 'Upload file gagal / file tidak valid',
            'error' => $file?->getErrorMessage(),
            'code' => $file?->getError(),
        ], 422);
    }

    // ✅ extra guard: kadang realpath kosong
    if (!method_exists($file, 'getRealPath') || empty($file->getRealPath())) {
        return response()->json([
            'message' => 'Upload file tidak memiliki path (tmp). Cek konfigurasi PHP upload.',
        ], 422);
    }

    $dataTicket['image'] = $file->store('tickets', 'public');
}


        $ticket = Tickets::create($dataTicket);

        return response()->json([
            'message' => 'Ticket created successfully by user',
            'data'    => new TicketResource($ticket->load(['user', 'support', 'category', 'assets'])),
        ], 201);
    }

    public function updateByAdmin(TicketUpdateByAdminRequest $request, $id)
    {
        $ticket = Tickets::findOrFail($id);
        $data = $request->validated();

        $status = $data['status'] ?? null;
        if (!$status) return response()->json(['message' => 'status is required'], 422);

        $tz = $this->tz();

        if ($status === 'waiting') {
            $ticket->update(['status' => 'waiting']);

            return response()->json([
                'message' => 'Ticket updated successfully by admin',
                'data'    => new TicketResource($ticket->fresh()->load(['user', 'support', 'category', 'assets'])),
            ], 200);
        }

        if ($status === 'void') {
            if (empty($data['notes'])) {
                return response()->json(['message' => 'notes wajib untuk VOID'], 422);
            }

            $ticket->update([
                'status' => 'void',
                'notes'  => $data['notes'],
            ]);

            return response()->json([
                'message' => 'Ticket updated successfully by admin',
                'data'    => new TicketResource($ticket->fresh()->load(['user', 'support', 'category', 'assets'])),
            ], 200);
        }

        if ($status === 'in_progress') {
            if (empty($data['support_id'])) return response()->json(['message' => 'support_id wajib untuk Execution'], 422);
            if (empty($data['priority']))   return response()->json(['message' => 'priority wajib untuk Execution'], 422);

            $payload = [
                'status'     => 'in_progress',
                'support_id' => $data['support_id'],
                'priority'   => $data['priority'],
                'is_late'    => 0,
            ];

            if (array_key_exists('assets_id', $data)) {
                $payload['assets_id'] = $data['assets_id'];
            }

            if (!empty($data['start_date'])) {
                $payload['start_date'] = $this->parseInputDate($data['start_date']);
            } elseif (empty($ticket->start_date)) {
                $payload['start_date'] = now($tz);
            } else {
                $payload['start_date'] = Carbon::parse($ticket->start_date)->timezone($tz);
            }

            $requestDateRaw = $ticket->getRawOriginal('request_date') ?: $ticket->getRawOriginal('created_at');
            $payload['waiting_hour'] = $this->calcWaitingHour($requestDateRaw, $payload['start_date']);

            $ticket->update($payload);

            return response()->json([
                'message' => 'Ticket updated successfully by admin',
                'data'    => new TicketResource($ticket->fresh()->load(['user', 'support', 'category', 'assets'])),
            ], 200);
        }

        if ($status === 'resolved') {
            if (empty($data['solution'])) {
                return response()->json(['message' => 'solution wajib untuk resolved'], 422);
            }

            if (empty($data['support_id'])) return response()->json(['message' => 'support_id wajib untuk resolved'], 422);
            if (empty($data['priority']))   return response()->json(['message' => 'priority wajib untuk resolved'], 422);

            if (!empty($data['start_date'])) {
                $ticket->update(['start_date' => $this->parseInputDate($data['start_date'])]);
                $ticket = $ticket->fresh();
            }

            if (empty($ticket->start_date)) {
                $ticket->update(['start_date' => now($tz)]);
                $ticket = $ticket->fresh();
            }

            $start = Carbon::parse($ticket->start_date)->timezone($tz);

            $end = !empty($data['end_date']) ? $this->parseInputDate($data['end_date']) : now($tz);
            if (!$end) $end = now($tz);

            if ($end->lt($start)) {
                return response()->json(['message' => 'end_date tidak boleh kurang dari start_date'], 422);
            }

            $autoMinutes = $this->calcMinutes($start, $end);
            $timeSpent = !empty($data['time_spent']) ? (int) $data['time_spent'] : $autoMinutes;
            $timeSpent = max(1, $timeSpent);

            $isLate = $timeSpent > 480 ? 1 : 0;

            $requestDateRaw = $ticket->getRawOriginal('request_date') ?: $ticket->getRawOriginal('created_at');
            $waitingHour = $ticket->waiting_hour;
            if ($waitingHour === null || (float) $waitingHour <= 0) {
                $waitingHour = $this->calcWaitingHour($requestDateRaw, $ticket->start_date);
            }

            $payload = [
                'status'       => 'resolved',
                'support_id'   => $data['support_id'],
                'priority'     => $data['priority'],
                'end_date'     => $end,
                'time_spent'   => $timeSpent,
                'solution'     => $data['solution'],
                'is_late'      => $isLate,
                'waiting_hour' => $waitingHour,
            ];

            if (array_key_exists('assets_id', $data)) {
                $payload['assets_id'] = $data['assets_id'];
            }

            if (!empty($data['notes'])) {
                $payload['notes'] = $data['notes'];
            }

            $ticket->update($payload);

            return response()->json([
                'message' => 'Ticket updated successfully by admin',
                'data'    => new TicketResource($ticket->fresh()->load(['user', 'support', 'category', 'assets'])),
            ], 200);
        }

        return response()->json(['message' => 'status invalid'], 422);
    }

    public function updateByUser(TicketUpdateByUserRequest $request, $id)
    {
        $ticket = Tickets::findOrFail($id);
        $dataTicket = $request->validated();

        if ($request->hasFile('image')) {
            if ($ticket->image) {
                Storage::disk('public')->delete($ticket->image);
            }
            $dataTicket['image'] = $request->file('image')->store('tickets', 'public');
        }

        $ticket->update($dataTicket);

        return response()->json([
            'message' => 'Ticket Updated Successfully By User',
            'data'    => new TicketResource($ticket->fresh()->load(['user', 'support', 'category', 'assets'])),
        ], 200);
    }
}
