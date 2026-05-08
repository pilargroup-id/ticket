<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_headers', function (Blueprint $table) {
            $table->id();
            $table->string('project_code', 20)->nullable();
            $table->string('project_name', 255)->nullable();
            $table->datetime('request_date')->nullable();
            $table->foreignId('requestor_id')->constrained('users')->onUpdate('cascade')->onDelete('restrict');
            $table->enum('status', ['waiting','in_progress','pending','resolved','void'])->default('waiting');
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->unsignedTinyInteger('progress_percent')->default(0);
            $table->text('description')->nullable();
            $table->text('notes')->nullable();
            $table->datetime('progress_date')->nullable();
            $table->datetime('start_date')->nullable();
            $table->datetime('end_date')->nullable();
            $table->datetime('actual_start_date')->nullable();
            $table->datetime('actual_end_date')->nullable();
            $table->integer('total_pending_minutes')->default(0);
            $table->datetime('effective_end_date')->nullable();
            $table->boolean('is_late')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        schema::dropIfExists('project_headers');
    }
};
