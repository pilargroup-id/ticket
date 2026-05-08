<?php

namespace App\Http\Resources\report;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupportTicketsPerMonthResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'support_id'   => (int) $this->support_id,
            'support_name' => $this->support?->name,
            'month'        => (int) $this->month,   // 1-12
            'count'        => (int) $this->count,
        ];
    }
}
