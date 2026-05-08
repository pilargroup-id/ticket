<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TicketReportResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'total_ticket' => $this['status']['total'],

            'status' => [
                'waiting'     => $this['status']['waiting'],
                'in_progress' => $this['status']['in_progress'],
                'resolved'    => $this['status']['resolved'],
                'void'        => $this['status']['void'],
                'feedback'    => $this['status']['feedback'],
            ],

            'sla' => [
                'resolved_in_sla' => $this['sla']['resolved_in_sla'],
                'sla_percent'     => $this['sla']['sla_percent'],
            ],
        ];
    }
}
