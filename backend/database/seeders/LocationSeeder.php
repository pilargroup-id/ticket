<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $locations = [
            'Head Office',
            'Gudang Rawabokor',
            'Gudang Jatake 1',
            'Gudang Jatake 2',
            'Gudang KS-Tubun',
            'Pasar Lama',
            'Poris',
            'Kalideres',
            'Banjar Wijaya',
            'Talaga Bestari',
            'Karawaci Pandan',
            'Karawaci Borobudur',
            'Ciledug',
            'Kelapa Dua',
            'Sepatan',
            'Pamulang',
            'Ciledug Indah',
            'Dasana Indah',
            'Gudang Garuda 21',
        ];

        foreach ($locations as $loc) {
            DB::table('locations')->insert([
                'location_name' => $loc,
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        }
    }
}
