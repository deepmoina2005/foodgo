<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('restaurants')) {
            Schema::table('restaurants', function (Blueprint $table): void {
                if (! Schema::hasColumn('restaurants', 'latitude')) {
                    $table->decimal('latitude', 10, 7)->nullable()->after('city');
                }

                if (! Schema::hasColumn('restaurants', 'longitude')) {
                    $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
                }
            });
        }

        if (Schema::hasTable('delivery_partners')) {
            Schema::table('delivery_partners', function (Blueprint $table): void {
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

                if (! Schema::hasColumn('delivery_partners', 'is_available')) {
                    $table->boolean('is_available')->default(false)->after('longitude');
                }

                if (! Schema::hasColumn('delivery_partners', 'current_order_id')) {
                    $table->foreignId('current_order_id')->nullable()->after('is_available')->constrained('orders')->nullOnDelete();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('delivery_partners')) {
            Schema::table('delivery_partners', function (Blueprint $table): void {
                if (Schema::hasColumn('delivery_partners', 'current_order_id')) {
                    $table->dropConstrainedForeignId('current_order_id');
                }

                if (Schema::hasColumn('delivery_partners', 'is_available')) {
                    $table->dropColumn('is_available');
                }

                if (Schema::hasColumn('delivery_partners', 'longitude')) {
                    $table->dropColumn('longitude');
                }

                if (Schema::hasColumn('delivery_partners', 'latitude')) {
                    $table->dropColumn('latitude');
                }

                if (Schema::hasColumn('delivery_partners', 'area')) {
                    $table->dropColumn('area');
                }

                if (Schema::hasColumn('delivery_partners', 'city')) {
                    $table->dropColumn('city');
                }
            });
        }

        if (Schema::hasTable('restaurants')) {
            Schema::table('restaurants', function (Blueprint $table): void {
                if (Schema::hasColumn('restaurants', 'longitude')) {
                    $table->dropColumn('longitude');
                }

                if (Schema::hasColumn('restaurants', 'latitude')) {
                    $table->dropColumn('latitude');
                }
            });
        }
    }
};
