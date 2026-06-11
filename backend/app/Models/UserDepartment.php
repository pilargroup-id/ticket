<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserDepartment extends Model
{
    protected $table = 'user_departments';

    protected $fillable = [
        'user_pg_id',
        'pg_department_id',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'pg_department_id' => 'integer',
    ];
}
