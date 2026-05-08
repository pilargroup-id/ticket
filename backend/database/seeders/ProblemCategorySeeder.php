<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
class ProblemCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('problem_categories')->insert([
            ['problem_category_name' => 'Software - Netsuite', 'created_at' => now(), 'updated_at' => now()],
            ['problem_category_name' => 'Software - Accurate', 'created_at' => now(), 'updated_at' => now()],
            ['problem_category_name' => 'Software - RP', 'created_at' => now(), 'updated_at' => now()],
            ['problem_category_name' => 'Software - FRP', 'created_at' => now(), 'updated_at' => now()],
            ['problem_category_name' => 'Software - Iseller', 'created_at' => now(), 'updated_at' => now()],
            ['problem_category_name' => 'Software - Lain-lain', 'created_at' => now(), 'updated_at' => now()],
            ['problem_category_name' => 'HardWare - Monitor/Proyektor/TV', 'created_at' => now(), 'updated_at' => now()],
            ['problem_category_name' => 'HardWare - Laptop/PC', 'created_at' => now(), 'updated_at' => now()],
            ['problem_category_name' => 'HardWare - Handphone', 'created_at' => now(), 'updated_at' => now()],
            ['problem_category_name' => 'HardWare - CCTV', 'created_at' => now(), 'updated_at' => now()],
            ['problem_category_name' => 'HardWare - Lain-lain', 'created_at' => now(), 'updated_at' => now()],
            ['problem_category_name' => 'Jaringan - Internet Lambat', 'created_at' => now(), 'updated_at' => now()],
            ['problem_category_name' => 'Jaringan - Tidak Dalam Terhubung Ke Internet', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
