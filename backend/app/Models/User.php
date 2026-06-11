<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'username',
        'department_id',
        'email',
        'phone',
        'role',
        'job_position',
        'password',
        'status',
        'remember_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function department()
    {
        return $this->belongsTo(Departments::class);
    }

    public function primaryUserDepartment()
    {
        return $this->hasOne(UserDepartment::class, 'user_pg_id', 'id')->where('is_primary', true);
    }

    public function resolvedDepartmentId(): ?int
    {
        if (!is_null($this->department_id)) {
            return (int) $this->department_id;
        }

        return $this->primaryUserDepartment?->pg_department_id;
    }

    public function resolvedDepartmentName(): ?string
    {
        $department = $this->department;

        if ($department?->name) {
            return $department->name;
        }

        $departmentId = $this->resolvedDepartmentId();

        if ($departmentId === null) {
            return null;
        }

        if ((int) $departmentId === 8) {
            return 'IT';
        }

        if (!empty($this->job_position) && str_contains(strtolower($this->job_position), 'it')) {
            return 'IT';
        }

        return 'Department ' . $departmentId;
    }

    public function isAdminUser(): bool
    {
        return $this->role === 'admin' || (int) $this->resolvedDepartmentId() === 8;
    }
}
