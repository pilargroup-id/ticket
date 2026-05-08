<?php

namespace App\Http\Resources\Report;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SlaReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // $this itu array dari scopeSlaReport()
        return [
            'resolved'         => (int) ($this['resolved'] ?? 0),
            'resolved_in_sla'  => (int) ($this['resolved_in_sla'] ?? 0),
            'sla_percent'      => (float) ($this['sla_percent'] ?? 0),
        ];
    }
}
