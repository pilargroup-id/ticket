<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
          Schema::create('feedbacks', function(Blueprint $table){
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->onUpdate('cascade')->onDelete('restrict');
            $table->string('description')->nullable();
            $table->integer('rating')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedbacks');
    }
};
