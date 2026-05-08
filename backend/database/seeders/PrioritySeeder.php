<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PrioritySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('priority')->insert([
            ['priority_name' => 'Low', 'created_at' => now(), 'updated_at' => null],
            ['priority_name' => 'Medium', 'created_at' => now(), 'updated_at' => null],
            ['priority_name' => 'High', 'created_at' => now(), 'updated_at' => null],
        ]);
    }
}
