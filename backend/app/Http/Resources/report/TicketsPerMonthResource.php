<?php

namespace App\Http\Resources\Report;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketsPerMonthResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'year'  => $this['year'],
            'month' => $this['month'],
            'count' => $this['count'],
        ];
    }
}
