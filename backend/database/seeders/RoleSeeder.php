<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('roles')->insert([
            ['role_name' => 'Admin', 'created_at' => now(), 'updated_at' => now()],
            ['role_name' => 'Super Admin', 'created_at' => now(), 'updated_at' => now()],
            ['role_name' => 'User', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
