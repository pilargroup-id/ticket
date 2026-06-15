<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TicketReportResource extends JsonResource
{
    public function toArray($request)
    {
        $status = $this['status'] ?? [];
        $sla = $this['sla'] ?? [];

        $total = (int) ($status['total'] ?? 0);
        $waiting = (int) ($status['waiting'] ?? 0);
        $inProgress = (int) ($status['in_progress'] ?? 0);
        $resolved = (int) ($status['resolved'] ?? 0);
        $feedback = (int) ($status['feedback'] ?? 0);
        $void = (int) ($status['void'] ?? 0);

        $resolvedInSla = (int) ($sla['resolved_in_sla'] ?? 0);
        $resolvedClosed = (int) ($sla['resolved'] ?? ($resolved + $feedback));
        $late = max($resolvedClosed - $resolvedInSla, 0);
        $slaPercent = (float) ($sla['sla_percent'] ?? 0);

        return [
            'total_ticket' => $total,

            'status' => [
                'total'       => $total,
                'waiting'     => $waiting,
                'in_progress' => $inProgress,
                'resolved'    => $resolved,
                'void'        => $void,
                'feedback'    => $feedback,
            ],

            'sla' => [
                'resolved'           => $resolvedClosed,
                'resolved_in_sla'    => $resolvedInSla,
                'on_time'            => $resolvedInSla,
                'late'               => $late,
                'sla_percent'        => $slaPercent,
                'percentage_on_time' => $slaPercent,
            ],
        ];
    }
}
