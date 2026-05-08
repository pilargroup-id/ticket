<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserTicketReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'status' => [
                'waiting'     => (int) data_get($this->resource, 'status.waiting', 0),
                'in_progress' => (int) data_get($this->resource, 'status.in_progress', 0),
                'resolved'    => (int) data_get($this->resource, 'status.resolved', 0),
                'void'    => (int) data_get($this->resource, 'status.void', 0),
                'feedback'    => (int) data_get($this->resource, 'status.feedback', 0),
            ],
        ];
    }
}
