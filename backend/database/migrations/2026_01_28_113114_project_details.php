<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_details', function (Blueprint $table) {
            $table->id();

            $table->foreignId('project_header_id')
                ->constrained('project_headers')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // siapa developer saat progress ini
            $table->foreignId('developer_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // kapan progress dicatat
            $table->dateTime('progress_date')->nullable();

            // status snapshot saat itu (HARUS SAMA DENGAN PROJECT)
            $table->enum('status', [
                'waiting',
                'in_progress',
                'pending',
                'resolved',
                'void',
            ])->default('waiting');

            // snapshot progress
            $table->unsignedTinyInteger('progress_percent')->default(0);

            // deskripsi progress / notes
            $table->text('description')->nullable();

            $table->timestamps();

            // index buat timeline & monitoring
            $table->index(['project_header_id', 'progress_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_details');
    }
};
