<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsersResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
 public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'username' => $this->username,
        'email' => $this->email,
        'role' => $this->role,
        'department_id' => $this->department_id,
        'department_name' => $this->department?->name ?? null,
        'location_id' => $this->department?->location_id,
        'location_name' => $this->department?->location?->name ?? null,
        'phone' => $this->phone,
        'status' => $this->status,
        'job_position' => $this->job_position,
        'is_approved' => (bool) ($this->is_approved ?? false),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}

}
