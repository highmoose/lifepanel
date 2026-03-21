<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quicktabs', function (Blueprint $table) {
            $table->id();
            $table->string('quicktab_name');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('quicktab_order')->default(0);
            $table->string('quicktab_colour')->nullable();
            $table->tinyInteger('quicktab_open')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quicktabs');
    }
};
