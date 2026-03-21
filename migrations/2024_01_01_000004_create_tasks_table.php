<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('task_name');
            $table->text('task_desc')->nullable();
            $table->text('task_notes')->nullable();
            $table->date('task_due')->nullable();
            $table->string('task_priority')->default('None'); // None, Low, Medium, High
            $table->unsignedInteger('task_order')->default(0);
            $table->foreignId('board_id')->constrained('boards')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
