<?php

namespace App\Http\Resources\Report;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketDistributionByCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'category_id' => (int) $this->category_id,
            'category'    => $this->category ? [
                'id'   => (int) $this->category->id,
                'name' => $this->category->name,
            ] : null,
            'count'       => (int) $this->count,
        ];
    }
}
