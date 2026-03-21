<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quickticks', function (Blueprint $table) {
            $table->id();
            $table->text('quicktick_desc');
            $table->tinyInteger('quicktick_complete')->default(0);
            $table->tinyInteger('quicktick_priority')->default(0);
            $table->unsignedInteger('quicktick_order')->default(0);
            $table->foreignId('quicktab_id')->constrained('quicktabs')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quickticks');
    }
};
