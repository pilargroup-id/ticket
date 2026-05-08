<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_on_holds', function (Blueprint $table) {
            $table->id();

            $table->foreignId('project_header_id')
                ->constrained('project_headers')
                ->cascadeOnDelete();

            $table->timestamp('hold_start')->nullable();
            $table->timestamp('hold_end')->nullable();

            $table->text('reason')->nullable();

            $table->integer('duration_minutes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_on_holds');
    }
};
