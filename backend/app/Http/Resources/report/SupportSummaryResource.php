<?php

namespace App\Http\Resources\report;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupportSummaryResource extends JsonResource
{
    private function humanMinutes(?int $minutes): string
    {
        $minutes = (int) ($minutes ?? 0);
        $h = intdiv($minutes, 60);
        $m = $minutes % 60;
        if ($h > 0 && $m > 0) return "{$h} jam {$m} menit";
        if ($h > 0) return "{$h} jam";
        return "{$m} menit";
    }

    public function toArray(Request $request): array
    {
        $totalMinutes = (int) ($this->total_minutes ?? 0);
        $totalTickets = (int) ($this->total_tickets ?? 0);
        $avg = $totalTickets > 0 ? (int) round($totalMinutes / $totalTickets) : 0;

        return [
            'support_id'        => (int) $this->support_id,
            'support_name'      => $this->support?->name,

            'total_tickets'     => $totalTickets,
            'resolved_tickets'  => (int) ($this->resolved_tickets ?? 0),
            'open_tickets'      => (int) ($this->open_tickets ?? 0),
            'late_tickets'      => (int) ($this->late_tickets ?? 0),

            'total_minutes'     => $totalMinutes,
            'total_time_human'  => $this->humanMinutes($totalMinutes),

            'avg_minutes'       => $avg,
            'avg_time_human'    => $this->humanMinutes($avg),
        ];
    }
}
