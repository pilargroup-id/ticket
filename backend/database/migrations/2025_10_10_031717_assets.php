<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('assets_code', 50)->nullable();
            $table->string('assets_name', 255)->nullable();
            $table->string('category', 255)->nullable();
            $table->string('status', 255)->nullable();
            $table->string('model', 255)->nullable();
            $table->string('check_in', 255)->nullable();
            $table->string('check_out', 255)->nullable();
            $table->string('check_out_to', 255)->nullable();
            $table->string('location', 255)->nullable();
            $table->string('notes', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
