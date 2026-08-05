<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The FK has drifted between environments (some already had it manually
        // dropped), so look it up instead of assuming Laravel's default name.
        $fk = DB::selectOne(
            "SELECT CONSTRAINT_NAME AS name FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_headers'
               AND COLUMN_NAME = 'requestor_id' AND REFERENCED_TABLE_NAME IS NOT NULL
             LIMIT 1"
        );

        if ($fk) {
            Schema::table('project_headers', function (Blueprint $table) use ($fk) {
                $table->dropForeign($fk->name);
            });
        }

        Schema::table('project_headers', function (Blueprint $table) {
            $table->string('requestor_id', 36)->change();
        });
    }

    public function down(): void
    {
        Schema::table('project_headers', function (Blueprint $table) {
            $table->unsignedBigInteger('requestor_id')->change();
        });

        Schema::table('project_headers', function (Blueprint $table) {
            $table->foreign('requestor_id')->references('id')->on('users')
                ->onUpdate('cascade')->onDelete('restrict');
        });
    }
};
