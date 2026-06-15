<?php

namespace App\Http\Resources\Report;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SlaReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $resolved = (int) ($this['resolved'] ?? 0);
        $resolvedInSla = (int) ($this['resolved_in_sla'] ?? 0);
        $late = max($resolved - $resolvedInSla, 0);
        $slaPercent = (float) ($this['sla_percent'] ?? 0);

        return [
            'resolved'           => $resolved,
            'resolved_in_sla'    => $resolvedInSla,
            'on_time'            => $resolvedInSla,
            'late'               => $late,
            'sla_percent'        => $slaPercent,
            'percentage_on_time' => $slaPercent,
        ];
    }
}
