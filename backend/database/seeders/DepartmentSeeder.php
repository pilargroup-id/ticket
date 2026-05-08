<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $mapping = [
            'HUMAN CAPITAL'      => 'Head Office',
            'MARKETING'          => 'Pasar Lama',
            'RETAIL ECOMMERCE'   => 'Gudang Jatake 1',
            'PRODUCT'            => 'Head Office',
            'SUPPLY CHAIN'       => 'Gudang Rawabokor',
            'IT'                 => 'Head Office',
            'FINANCE'            => 'Head Office',
            'STORE'              => 'Gudang KS-Tubun',
            'SALES B2B'          => 'Head Office',
            'SALES GT'           => 'Gudang Rawabokor',
            'BOARD OF DIRECTOR'  => 'Head Office',
            'LEGAL'              => 'Head Office',
            'Pikasa'             => 'Head Office',
            'Pilkada'            => 'Head Office',
        ];

        $insertData = [];

        foreach ($mapping as $department => $locationName) {
            $location = DB::table('locations')->where('location_name', $locationName)->first();

            if ($location) {
                $insertData[] = [
                    'department_name' => $department,
                    'location_id'     => $location->id,
                    'created_at'      => now(),
                    'updated_at'      => now(),
                ];
            }
        }

        DB::table('departments')->insert($insertData);
    }
}
