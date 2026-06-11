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
    $departmentId = method_exists($this->resource, 'resolvedDepartmentId')
        ? $this->resource->resolvedDepartmentId()
        : $this->department_id;

    $departmentName = method_exists($this->resource, 'resolvedDepartmentName')
        ? $this->resource->resolvedDepartmentName()
        : ($this->department?->name ?? null);

    $isAdmin = method_exists($this->resource, 'isAdminUser')
        ? $this->resource->isAdminUser()
        : ($this->role === 'admin' || (int) $departmentId === 8);

    return [
        'id' => $this->id,
        'name' => $this->name,
        'username' => $this->username,
        'email' => $this->email,
        'role' => $this->role,
        'department_id' => $departmentId,
        'department_name' => $departmentName,
        'department' => $departmentName,
        'location_id' => $this->department?->location_id,
        'location_name' => $this->department?->location?->name ?? null,
        'phone' => $this->phone,
        'status' => $this->status,
        'job_position' => $this->job_position,
        'is_admin' => $isAdmin,
        'is_approved' => (bool) ($this->is_approved ?? false),
        'created_at' => $this->created_at,
        'updated_at' => $this->updated_at,
    ];
}

}
