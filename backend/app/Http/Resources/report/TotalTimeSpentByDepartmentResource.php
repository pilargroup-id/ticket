<?php

namespace App\Http\Resources\Report;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TotalTimeSpentByDepartmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'year'           => $this['year'],
            'department_id'  => $this['department_id'],
            'department'     => $this['department_name'] ?? null,
            'months'         => $this['months'],
        ];
    }
}
