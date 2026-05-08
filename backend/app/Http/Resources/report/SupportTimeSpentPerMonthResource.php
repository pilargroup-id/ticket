<?php

namespace App\Http\Resources\report;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupportTimeSpentPerMonthResource extends JsonResource
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
        $total = (int) ($this->total_minutes ?? 0);

        return [
            'support_id'          => (int) $this->support_id,
            'support_name'        => $this->support?->name,
            'month'               => (int) $this->month,
            'total_minutes'       => $total,
            'total_time_human'    => $this->humanMinutes($total),
        ];
    }
}
