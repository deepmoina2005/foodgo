<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('delivery_partners')) {
            Schema::table('delivery_partners', function (Blueprint $table): void {
                if (! Schema::hasColumn('delivery_partners', 'is_available')) {
                    $table->boolean('is_available')->default(true)->after('longitude');
                }

                if (! Schema::hasColumn('delivery_partners', 'current_order_id')) {
                    $table->foreignId('current_order_id')->nullable()->after('is_available')->constrained('orders')->nullOnDelete();
                }

                if (! Schema::hasColumn('delivery_partners', 'city')) {
                    $table->string('city')->nullable()->after('vehicle_type');
                }

                if (! Schema::hasColumn('delivery_partners', 'area')) {
                    $table->string('area')->nullable()->after('city');
                }

                if (! Schema::hasColumn('delivery_partners', 'latitude')) {
                    $table->decimal('latitude', 10, 7)->nullable()->after('area');
                }

                if (! Schema::hasColumn('delivery_partners', 'longitude')) {
                    $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
                }
            });

            if (Schema::hasColumn('delivery_partners', 'is_available')) {
                DB::statement('ALTER TABLE delivery_partners MODIFY is_available TINYINT(1) NOT NULL DEFAULT 1');
            }
        }

        if (Schema::hasTable('delivery_requests')) {
            return;
        }

        Schema::create('delivery_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->string('city')->nullable();
            $table->string('area')->nullable();
            $table->string('status')->default('open');
            $table->foreignId('accepted_by_delivery_partner_id')->nullable()->constrained('delivery_partners')->nullOnDelete();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->unique('order_id');
            $table->index(['status', 'expires_at']);
        });

        if (Schema::hasTable('delivery_assignments') && ! Schema::hasColumn('delivery_assignments', 'order_id_unique_guard')) {
            Schema::table('delivery_assignments', function (Blueprint $table): void {
                $table->unique('order_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('delivery_assignments')) {
            Schema::table('delivery_assignments', function (Blueprint $table): void {
                $table->dropUnique('delivery_assignments_order_id_unique');
            });
        }

        Schema::dropIfExists('delivery_requests');
    }
};
